import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import {
  TokenDenyListService,
  ACCESS_TOKEN_TTL_SECONDS,
} from './token-deny-list.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { RequestContext } from '../audit/interfaces/audit-log-entry.interface';
import { LoginSecurityService } from './login-security.service';
import { User, toSafeUser } from '../users/entities/user.entity';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { CookieConfig, AuthResult } from './interfaces/auth.interfaces';
import { ErrorMessages } from '../common/constants/error-messages';
import { parseDurationMs } from './utils/parse-duration';
import { createAuditLogger, AuditLogger } from './utils/audit-log.helper';
import {
  BCRYPT_ROUNDS,
  SESSION_IDLE_TIMEOUT_HOURS,
  MFA_CHALLENGE_HMAC_LABEL,
  MFA_CHALLENGE_TOKEN_TYPE,
  MFA_CHALLENGE_EXPIRY,
  MFA_SETUP_HMAC_LABEL,
  MFA_SETUP_TOKEN_TYPE,
  MFA_SETUP_EXPIRY,
  REFRESH_TOKEN_COOKIE_NAME,
} from './constants/auth.constants';
import type { StringValue } from 'ms';

@Injectable()
export class TokenService {
  private readonly refreshExpiration: string;
  private readonly refreshMaxAgeMs: number;
  private readonly mfaChallengeSecret: string;
  private readonly mfaSetupSecret: string;
  private readonly accessExpiration: string;
  private readonly isProduction: boolean;
  private readonly logAuditEvent: AuditLogger;

  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
    private readonly tokenDenyListService: TokenDenyListService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly loginSecurityService: LoginSecurityService,
  ) {
    // OWASP ASVS V3.3.3 / NIST SP 800-63B §7.2: absolute timeout <= 12h at AAL2
    this.refreshExpiration = this.configService.get<string>(
      'auth.jwtRefreshExpiration',
    )!;
    this.refreshMaxAgeMs = parseDurationMs(this.refreshExpiration);
    this.accessExpiration = this.configService.get<string>(
      'auth.jwtAccessExpiration',
    )!;
    this.isProduction = this.configService.get<boolean>('app.isProduction')!;
    const jwtSecret = this.configService.get<string>('auth.jwtSecret')!;
    this.mfaChallengeSecret = crypto
      .createHmac('sha256', jwtSecret)
      .update(MFA_CHALLENGE_HMAC_LABEL)
      .digest('hex');
    this.mfaSetupSecret = crypto
      .createHmac('sha256', jwtSecret)
      .update(MFA_SETUP_HMAC_LABEL)
      .digest('hex');
    this.logAuditEvent = createAuditLogger(this.auditService);
  }

  async generateTokens(
    user: User,
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    const tokenFamily = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + this.refreshMaxAgeMs);

    // Enforce concurrent session limit — evict oldest if over limit
    await this.sessionsService.enforceSessionLimit(user.id, {
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    // SCRUM-347: create session BEFORE signing the access token so the access
    // token can carry sessionId in its JwtPayload. Pairs with the per-session
    // deny-list (`deny:session:{sessionId}`) checked by JwtStrategy.validate.
    const tempToken = crypto.randomUUID();
    const session = await this.sessionsService.createSession({
      userId: user.id,
      refreshToken: tempToken,
      tokenFamily,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent || null,
      expiresAt,
    });

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        jti: crypto.randomUUID(),
        sessionId: session.id,
      } satisfies JwtPayload,
      {
        expiresIn: this.accessExpiration as StringValue,
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        sessionId: session.id,
        family: tokenFamily,
      } satisfies RefreshTokenPayload,
      { expiresIn: this.refreshExpiration as StringValue },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.sessionsService.updateSessionHash(session.id, refreshTokenHash);

    return { accessToken, refreshToken, sessionId: session.id };
  }

  async refreshTokens(
    refreshToken: string,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<{ accessToken: string; cookie: CookieConfig }> {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException(ErrorMessages.auth.INVALID_REFRESH_TOKEN);
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(ErrorMessages.auth.INVALID_REFRESH_TOKEN);
    }

    await this.validateSessionNotIdle(payload, ctx);

    // Rotate: validates old session, detects theft, creates new session
    const expiresAt = new Date(Date.now() + this.refreshMaxAgeMs);
    const tempToken = crypto.randomUUID();

    const newSession = await this.sessionsService.rotateRefreshToken({
      oldSessionId: payload.sessionId,
      oldRefreshToken: refreshToken,
      newRefreshToken: tempToken,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent || null,
      expiresAt,
    });

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      this.signTokenPair(user, newSession.id, payload.family);

    // Update session hash with actual signed token
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, BCRYPT_ROUNDS);
    await this.sessionsService.updateSessionHash(
      newSession.id,
      refreshTokenHash,
    );

    this.logAuditEvent(AuditAction.TOKEN_REFRESH, ctx, user.id);

    return {
      accessToken: newAccessToken,
      cookie: this.buildRefreshCookie(newRefreshToken),
    };
  }

  async generateTokensForMfa(
    userId: string,
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): Promise<AuthResult> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        ErrorMessages.mfa.AUTHENTICATION_REQUIRED,
      );
    }
    const { accessToken, refreshToken, sessionId } = await this.generateTokens(
      user,
      requestMeta,
    );

    const travelResult = await this.loginSecurityService.checkImpossibleTravel(
      user,
      requestMeta,
    );
    if (travelResult?.isAnomalous && travelResult.actionTaken === 'blocked') {
      this.loginSecurityService.handleTravelBlock(
        travelResult,
        user.id,
        requestMeta,
      );
    }

    this.loginSecurityService
      .notifyIfNewDevice(user, sessionId, requestMeta)
      .catch(() => {});
    this.loginSecurityService.checkSuspiciousLoginSuccess(user, requestMeta);

    return {
      status: 'success' as const,
      accessToken,
      user: toSafeUser(user),
      cookie: this.buildRefreshCookie(refreshToken),
    };
  }

  signMfaChallengeToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, type: MFA_CHALLENGE_TOKEN_TYPE },
      {
        expiresIn: MFA_CHALLENGE_EXPIRY as StringValue,
        secret: this.mfaChallengeSecret,
      },
    );
  }

  signMfaSetupToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, type: MFA_SETUP_TOKEN_TYPE },
      {
        expiresIn: MFA_SETUP_EXPIRY as StringValue,
        secret: this.mfaSetupSecret,
      },
    );
  }

  verifyMfaSetupToken(token: string): { sub: string } {
    const payload = this.jwtService.verify<{ sub: string; type: string }>(
      token,
      { secret: this.mfaSetupSecret },
    );
    if (payload.type !== MFA_SETUP_TOKEN_TYPE) {
      throw new UnauthorizedException('Invalid setup token');
    }
    return { sub: payload.sub };
  }

  private async validateSessionNotIdle(
    payload: RefreshTokenPayload,
    ctx?: RequestContext,
  ): Promise<void> {
    const oldSession = await this.sessionsService.findById(payload.sessionId);
    if (
      oldSession &&
      !oldSession.isRevoked &&
      this.sessionsService.isSessionIdle(oldSession.lastUsedAt)
    ) {
      await this.sessionsService.revokeSessionDirect(payload.sessionId);

      this.logAuditEvent(AuditAction.SESSION_IDLE_REVOKED, ctx, payload.sub, {
        sessionId: payload.sessionId,
        lastUsedAt: oldSession.lastUsedAt.toISOString(),
        idleTimeoutHours: SESSION_IDLE_TIMEOUT_HOURS,
      });

      throw new UnauthorizedException(ErrorMessages.auth.INVALID_REFRESH_TOKEN);
    }
  }

  private signTokenPair(
    user: Pick<User, 'id' | 'email' | 'role'>,
    newSessionId: string,
    family: string,
  ): { accessToken: string; refreshToken: string } {
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        jti: crypto.randomUUID(),
        sessionId: newSessionId,
      } satisfies JwtPayload,
      { expiresIn: this.accessExpiration as StringValue },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        sessionId: newSessionId,
        family,
      } satisfies RefreshTokenPayload,
      { expiresIn: this.refreshExpiration as StringValue },
    );

    return { accessToken, refreshToken };
  }

  buildRefreshCookie(refreshToken: string): CookieConfig {
    return {
      name: REFRESH_TOKEN_COOKIE_NAME,
      value: refreshToken,
      options: {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: Math.floor(this.refreshMaxAgeMs / 1000),
      },
    };
  }

  buildClearCookie(): CookieConfig {
    return {
      name: REFRESH_TOKEN_COOKIE_NAME,
      value: '',
      options: {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      },
    };
  }

  async logout(
    refreshToken: string,
    ctx?: RequestContext,
  ): Promise<CookieConfig> {
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken);
      await this.sessionsService.revokeSession(payload.sessionId, payload.sub);
      this.tokenDenyListService
        .denyAllForUser(payload.sub, ACCESS_TOKEN_TTL_SECONDS)
        .catch(() => {});

      this.logAuditEvent(AuditAction.LOGOUT, ctx, payload.sub);
    } catch {
      // Token is invalid/expired — just clear the cookie
    }

    return this.buildClearCookie();
  }

  async logoutAll(userId: string, ctx?: RequestContext): Promise<CookieConfig> {
    await this.sessionsService.revokeAllUserSessions(userId);
    this.tokenDenyListService
      .denyAllForUser(userId, ACCESS_TOKEN_TTL_SECONDS)
      .catch(() => {});

    this.logAuditEvent(AuditAction.LOGOUT, ctx, userId, {
      scope: 'all_sessions',
    });

    return this.buildClearCookie();
  }
}
