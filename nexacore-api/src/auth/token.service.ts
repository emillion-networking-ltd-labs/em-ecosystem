import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  TokenDenyListService,
  ACCESS_TOKEN_TTL_SECONDS,
} from './token-deny-list.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { RequestContext } from '../audit/interfaces/audit-log-entry.interface';
import { ImpossibleTravelService } from '../geolocation/impossible-travel.service';
import { SuspiciousLoginService } from '../security/suspicious-login.service';
import { ImpossibleTravelResult } from '../geolocation/interfaces/geolocation-result.interface';
import { User, toSafeUser } from '../users/entities/user.entity';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { CookieConfig, AuthResult } from './interfaces/auth.interfaces';
import { ErrorMessages } from '../common/constants/error-messages';
import { parseDurationMs } from './utils/parse-duration';
import {
  BCRYPT_ROUNDS,
  SESSION_IDLE_TIMEOUT_HOURS,
  MFA_CHALLENGE_HMAC_LABEL,
  MFA_CHALLENGE_TOKEN_TYPE,
  MFA_CHALLENGE_EXPIRY,
  REFRESH_TOKEN_COOKIE_NAME,
} from './constants/auth.constants';
import type { StringValue } from 'ms';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly refreshExpiration: string;
  private readonly refreshMaxAgeMs: number;
  private readonly mfaChallengeSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly tokenDenyListService: TokenDenyListService,
    private readonly auditService: AuditService,
    private readonly impossibleTravelService: ImpossibleTravelService,
    private readonly suspiciousLoginService: SuspiciousLoginService,
  ) {
    // OWASP ASVS V3.3.3 / NIST SP 800-63B §7.2: absolute timeout <= 12h at AAL2
    this.refreshExpiration = process.env.JWT_REFRESH_EXPIRATION || '12h';
    this.refreshMaxAgeMs = parseDurationMs(this.refreshExpiration);
    const jwtSecret =
      process.env.JWT_SECRET || 'default-dev-secret-change-in-production';
    this.mfaChallengeSecret = crypto
      .createHmac('sha256', jwtSecret)
      .update(MFA_CHALLENGE_HMAC_LABEL)
      .digest('hex');
  }

  async generateTokens(
    user: User,
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        jti: crypto.randomUUID(),
      } satisfies JwtPayload,
      {
        expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
      },
    );

    const tokenFamily = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + this.refreshMaxAgeMs);

    // Enforce concurrent session limit — evict oldest if over limit
    await this.sessionsService.enforceSessionLimit(user.id, {
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    // Create session with temp token, then sign JWT with session ID, then update hash
    const tempToken = crypto.randomUUID();
    const session = await this.sessionsService.createSession({
      userId: user.id,
      refreshToken: tempToken,
      tokenFamily,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent || null,
      expiresAt,
    });

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

    // Idle timeout check: reject refresh if session inactive too long
    const oldSession = await this.sessionsService.findById(payload.sessionId);
    if (
      oldSession &&
      !oldSession.isRevoked &&
      this.sessionsService.isSessionIdle(oldSession.lastUsedAt)
    ) {
      await this.prisma.session.update({
        where: { id: payload.sessionId },
        data: { isRevoked: true },
      });

      this.auditService
        .log({
          action: AuditAction.SESSION_IDLE_REVOKED,
          userId: payload.sub,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
          metadata: {
            sessionId: payload.sessionId,
            lastUsedAt: oldSession.lastUsedAt.toISOString(),
            idleTimeoutHours: SESSION_IDLE_TIMEOUT_HOURS,
          },
        })
        .catch(() => {});

      throw new UnauthorizedException(ErrorMessages.auth.INVALID_REFRESH_TOKEN);
    }

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

    // Sign new tokens with actual session ID
    const newAccessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        jti: crypto.randomUUID(),
      } satisfies JwtPayload,
      {
        expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
      },
    );

    const newRefreshToken = this.jwtService.sign(
      {
        sub: user.id,
        sessionId: newSession.id,
        family: payload.family,
      } satisfies RefreshTokenPayload,
      { expiresIn: this.refreshExpiration as StringValue },
    );

    // Update session hash with actual signed token
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, BCRYPT_ROUNDS);
    await this.sessionsService.updateSessionHash(
      newSession.id,
      refreshTokenHash,
    );

    this.auditService
      .log({
        action: AuditAction.TOKEN_REFRESH,
        userId: user.id,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
      })
      .catch(() => {});

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

    const travelResult = await this.checkImpossibleTravel(user, requestMeta);
    if (travelResult?.isAnomalous && travelResult.actionTaken === 'blocked') {
      this.handleTravelBlock(travelResult, user.id, requestMeta);
    }

    this.notifyIfNewDevice(user, sessionId, requestMeta).catch(() => {});
    this.checkSuspiciousLoginSuccess(user, requestMeta);

    return {
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

  buildRefreshCookie(refreshToken: string): CookieConfig {
    return {
      name: REFRESH_TOKEN_COOKIE_NAME,
      value: refreshToken,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      },
    };
  }

  async notifyIfNewDevice(
    user: { id: string; email: string; firstName: string | null },
    sessionId: string,
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): Promise<void> {
    const previousSessions = await this.prisma.session.findMany({
      where: {
        userId: user.id,
        id: { not: sessionId },
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: { ipAddress: true, userAgent: true },
    });

    if (previousSessions.length === 0) return;

    const knownIp = previousSessions.some(
      (s) => s.ipAddress === requestMeta.ipAddress,
    );
    const knownUa = previousSessions.some(
      (s) => s.userAgent === (requestMeta.userAgent || null),
    );

    if (!knownIp || !knownUa) {
      await this.mailService.sendLoginNotificationEmail(
        user.email,
        requestMeta.ipAddress,
        requestMeta.userAgent || null,
        user.firstName,
      );
    }
  }

  async checkImpossibleTravel(
    user: {
      id: string;
      email: string;
      firstName: string | null;
      mfaEnabled: boolean;
    },
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): Promise<ImpossibleTravelResult | null> {
    try {
      return await this.impossibleTravelService.detectImpossibleTravel({
        userId: user.id,
        ipAddress: requestMeta.ipAddress,
        email: user.email,
        firstName: user.firstName,
        userAgent: requestMeta.userAgent || null,
        mfaEnabled: user.mfaEnabled,
      });
    } catch {
      return null;
    }
  }

  handleTravelBlock(
    travelResult: ImpossibleTravelResult,
    userId: string,
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): void {
    this.auditService
      .log({
        action: AuditAction.LOGIN_BLOCKED_TRAVEL,
        userId,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        metadata: {
          previousLocation: travelResult.previousLocation,
          currentLocation: travelResult.currentLocation,
          distanceKm: travelResult.distanceKm,
          elapsedHours: travelResult.elapsedHours,
          requiredSpeedKmh: travelResult.requiredSpeedKmh,
        },
      })
      .catch(() => {});
    throw new ForbiddenException(
      'Login blocked due to suspicious location activity. Please try again later or contact support.',
    );
  }

  checkSuspiciousLoginSuccess(
    user: { id: string; email: string; firstName?: string | null },
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): void {
    this.suspiciousLoginService
      .analyzeLoginSuccess({
        userId: user.id,
        email: user.email,
        firstName: user.firstName ?? null,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent ?? null,
        loginTime: new Date(),
      })
      .catch(() => {});
  }
}
