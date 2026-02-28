import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User, SafeUser, toSafeUser } from '../users/entities/user.entity';
import { Provider } from '../users/enums/provider.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { OAuthProfile } from '../common/interfaces/oauth-profile.interface';
import { OAuthCodeStore } from './stores/oauth-code.store';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { RequestContext } from '../audit/interfaces/audit-log-entry.interface';
import type { StringValue } from 'ms';
import {
  BCRYPT_ROUNDS,
  MAX_FAILED_ATTEMPTS,
  DUMMY_PASSWORD_HASH,
  getLockoutDurationMinutes,
} from './constants/auth.constants';

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const RESET_TOKEN_EXPIRY_HOURS = 1;
const RESEND_COOLDOWN_SECONDS = 60;

/** Parse a duration string like '7d' or '15m' into milliseconds */
function parseDurationMs(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

export interface CookieConfig {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path: string;
    maxAge: number;
  };
}

export interface AuthResult {
  accessToken: string;
  user: SafeUser;
  cookie: CookieConfig;
}

export interface MfaChallengeResult {
  mfaRequired: true;
  mfaToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshExpiration: string;
  private readonly refreshMaxAgeMs: number;
  private readonly mfaChallengeSecret: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly oauthCodeStore: OAuthCodeStore,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {
    this.refreshExpiration = process.env.JWT_REFRESH_EXPIRATION || '7d';
    this.refreshMaxAgeMs = parseDurationMs(this.refreshExpiration);
    const jwtSecret =
      process.env.JWT_SECRET || 'default-dev-secret-change-in-production';
    this.mfaChallengeSecret = crypto
      .createHmac('sha256', jwtSecret)
      .update('mfa-challenge-token')
      .digest('hex');
  }

  async register(
    dto: RegisterDto,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<AuthResult> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
    });

    // Send verification email (non-blocking — does not fail registration)
    this.createAndSendVerificationEmail(user).catch(() => {});

    const { accessToken, refreshToken } = await this.generateTokens(
      user,
      requestMeta,
    );

    this.auditService
      .log({
        action: AuditAction.REGISTER,
        userId: user.id,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { email: dto.email },
      })
      .catch(() => {});

    return {
      accessToken,
      user: toSafeUser(user),
      cookie: this.buildRefreshCookie(refreshToken),
    };
  }

  async login(
    dto: LoginDto,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<AuthResult | MfaChallengeResult> {
    const user = await this.usersService.findByEmail(dto.email);

    // Timing attack protection: constant-time response when user not found
    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      this.auditService
        .log({
          action: AuditAction.LOGIN_FAILURE,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
          metadata: { email: dto.email, reason: 'user_not_found' },
        })
        .catch(() => {});
      throw new UnauthorizedException('Invalid credentials');
    }

    // Account lockout check with detailed response
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      this.auditService
        .log({
          action: AuditAction.LOGIN_FAILURE,
          userId: user.id,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
          metadata: { reason: 'account_locked' },
        })
        .catch(() => {});

      throw new ForbiddenException({
        message: 'Too many attempts. Account locked.',
        error: 'Forbidden',
        statusCode: 403,
        retryAfter: remainingSeconds,
        lockoutLevel: user.lockoutCount,
      });
    }

    // Expired lockout: reset failed attempts (but NOT lockoutCount)
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.usersService.resetFailedAttempts(user.id);
    }

    // OAuth-only account (no password set) — constant timing, NO lockout.
    // Rationale: there is no password to brute-force, locking would be a DoS
    // vector and would reveal the account is OAuth-only (enumeration).
    // IP-based throttler provides sufficient protection.
    if (!user.passwordHash) {
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      this.auditService
        .log({
          action: AuditAction.LOGIN_FAILURE,
          userId: user.id,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
          metadata: { reason: 'no_password_set' },
        })
        .catch(() => {});
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      const updated = await this.usersService.incrementFailedAttempts(user.id);

      if (updated.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        await this.usersService.lockAccount(user.id, user.lockoutCount);

        const lockoutMinutes = getLockoutDurationMinutes(user.lockoutCount);
        const lockoutSeconds = lockoutMinutes * 60;

        this.auditService
          .log({
            action: AuditAction.ACCOUNT_LOCKED,
            userId: user.id,
            ipAddress: ctx?.ipAddress,
            userAgent: ctx?.userAgent,
            metadata: {
              reason: 'max_failed_attempts',
              failedAttempts: MAX_FAILED_ATTEMPTS,
            },
          })
          .catch(() => {});

        throw new ForbiddenException({
          message: 'Too many attempts. Account locked.',
          error: 'Forbidden',
          statusCode: 403,
          retryAfter: lockoutSeconds,
          lockoutLevel: user.lockoutCount + 1,
        });
      }

      this.auditService
        .log({
          action: AuditAction.LOGIN_FAILURE,
          userId: user.id,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
          metadata: {
            reason: 'invalid_password',
            failedAttempts: updated.failedAttempts,
          },
        })
        .catch(() => {});

      throw new UnauthorizedException('Invalid credentials');
    }

    // Email verification check — LOCAL accounts must verify before login
    if (user.provider === Provider.LOCAL && !user.emailVerified) {
      this.auditService
        .log({
          action: AuditAction.LOGIN_FAILURE,
          userId: user.id,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
          metadata: { reason: 'email_not_verified' },
        })
        .catch(() => {});
      throw new ForbiddenException(
        'Please verify your email address before signing in. Check your inbox for the verification link.',
      );
    }

    if (user.failedAttempts > 0 || user.lockoutCount > 0) {
      await this.usersService.resetLockoutEscalation(user.id);
    }

    // MFA check — return challenge token instead of full auth
    if (user.mfaEnabled) {
      const mfaToken = this.jwtService.sign(
        { sub: user.id, type: 'mfa-challenge' },
        { expiresIn: '5m' as StringValue, secret: this.mfaChallengeSecret },
      );

      this.auditService
        .log({
          action: AuditAction.LOGIN_SUCCESS,
          userId: user.id,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
          metadata: { mfaChallengeIssued: true },
        })
        .catch(() => {});

      return { mfaRequired: true, mfaToken };
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user,
      requestMeta,
    );

    this.auditService
      .log({
        action: AuditAction.LOGIN_SUCCESS,
        userId: user.id,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
      })
      .catch(() => {});

    return {
      accessToken,
      user: toSafeUser(user),
      cookie: this.buildRefreshCookie(refreshToken),
    };
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
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
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
      { sub: user.id, email: user.email, role: user.role } satisfies JwtPayload,
      { expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue },
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

  async validateOAuthUser(
    profile: OAuthProfile,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<AuthResult> {
    const user = await this.usersService.findOrCreateByOAuth(profile);
    const { accessToken, refreshToken } = await this.generateTokens(
      user,
      requestMeta,
    );

    this.auditService
      .log({
        action: AuditAction.OAUTH_LOGIN,
        userId: user.id,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { provider: profile.provider },
      })
      .catch(() => {});

    return {
      accessToken,
      user: toSafeUser(user),
      cookie: this.buildRefreshCookie(refreshToken),
    };
  }

  generateOAuthCode(payload: {
    accessToken: string;
    user: SafeUser;
    cookie: CookieConfig;
  }): string {
    return this.oauthCodeStore.store(payload);
  }

  exchangeOAuthCode(code: string): {
    accessToken: string;
    user: SafeUser;
    cookie: CookieConfig;
  } {
    const payload = this.oauthCodeStore.exchange(code);
    if (!payload) {
      throw new UnauthorizedException(
        'Invalid or expired authorization code',
      );
    }
    return payload;
  }

  async logout(
    refreshToken: string,
    ctx?: RequestContext,
  ): Promise<CookieConfig> {
    try {
      const payload =
        this.jwtService.verify<RefreshTokenPayload>(refreshToken);
      await this.sessionsService.revokeSession(payload.sessionId, payload.sub);

      this.auditService
        .log({
          action: AuditAction.LOGOUT,
          userId: payload.sub,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
        })
        .catch(() => {});
    } catch {
      // Token is invalid/expired — just clear the cookie
    }

    return this.buildClearCookie();
  }

  async logoutAll(
    userId: string,
    ctx?: RequestContext,
  ): Promise<CookieConfig> {
    await this.sessionsService.revokeAllUserSessions(userId);

    this.auditService
      .log({
        action: AuditAction.LOGOUT,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { scope: 'all_sessions' },
      })
      .catch(() => {});

    return this.buildClearCookie();
  }

  async generateTokensForMfa(
    userId: string,
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): Promise<AuthResult> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { accessToken, refreshToken } = await this.generateTokens(
      user,
      requestMeta,
    );
    return {
      accessToken,
      user: toSafeUser(user),
      cookie: this.buildRefreshCookie(refreshToken),
    };
  }

  private async generateTokens(
    user: User,
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role } satisfies JwtPayload,
      { expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue },
    );

    const tokenFamily = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + this.refreshMaxAgeMs);

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

  // ── Email Verification ──

  async verifyEmail(token: string): Promise<{ status: 'success' | 'invalid' }> {
    const tokenHash = this.hashToken(token);

    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

    if (!verificationToken) {
      return { status: 'invalid' };
    }

    if (verificationToken.usedAt) {
      // Already used — still success if user is verified
      if (verificationToken.user.emailVerified) {
        return { status: 'success' };
      }
      return { status: 'invalid' };
    }

    if (verificationToken.expiresAt < new Date()) {
      return { status: 'invalid' };
    }

    // Mark token as used and user as verified
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      }),
    ]);

    return { status: 'success' };
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Rate limiting: check last token creation time
    const lastToken = await this.prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastToken) {
      const secondsSinceLastToken =
        (Date.now() - lastToken.createdAt.getTime()) / 1000;
      if (secondsSinceLastToken < RESEND_COOLDOWN_SECONDS) {
        throw new BadRequestException(
          'Please wait before requesting another email',
        );
      }
    }

    await this.createAndSendVerificationEmail(user);
  }

  // ── Password Reset ──

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);

    // Always return success to prevent email enumeration
    if (!user) {
      this.logger.log(
        `Forgot password requested for non-existent email: ${dto.email}`,
      );
      return;
    }

    // OAuth-only accounts cannot reset password
    if (!user.passwordHash && user.provider !== 'LOCAL') {
      this.logger.log(
        `Forgot password requested for OAuth account: ${dto.email}`,
      );
      return;
    }

    // Invalidate all existing unused reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    // Generate new reset token
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(plainToken);
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    await this.mailService.sendPasswordResetEmail(
      user.email,
      plainToken,
      user.firstName,
    );
  }

  async resetPassword(
    dto: ResetPasswordDto,
    ctx?: RequestContext,
  ): Promise<void> {
    const tokenHash = this.hashToken(dto.token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    // Mark token as used and update password
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
    ]);

    // Revoke all sessions (forces re-authentication)
    await this.sessionsService.revokeAllUserSessions(resetToken.userId);

    this.auditService
      .log({
        action: AuditAction.PASSWORD_CHANGE,
        userId: resetToken.userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { method: 'reset_token' },
      })
      .catch(() => {});
  }

  // ── Private helpers: email tokens ──

  private async createAndSendVerificationEmail(user: User): Promise<void> {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(plainToken);
    const expiresAt = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    await this.mailService.sendVerificationEmail(
      user.email,
      plainToken,
      user.firstName,
    );
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  buildRefreshCookie(refreshToken: string): CookieConfig {
    return {
      name: 'refresh_token',
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
      name: 'refresh_token',
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
}
