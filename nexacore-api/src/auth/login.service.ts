import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordBreachService } from './password-breach.service';
import { TrustedDeviceService } from './trusted-device.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { RequestContext } from '../audit/interfaces/audit-log-entry.interface';
import { ImpossibleTravelService } from '../geolocation/impossible-travel.service';
import { SuspiciousLoginService } from '../security/suspicious-login.service';
import { MailService } from '../mail/mail.service';
import { User, toSafeUser } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  AuthResult,
  RegisterResult,
  MfaChallengeResult,
  MfaSetupRequiredResult,
} from './interfaces/auth.interfaces';
import { ErrorMessages } from '../common/constants/error-messages';
import {
  BCRYPT_ROUNDS,
  MAX_FAILED_ATTEMPTS,
  DUMMY_PASSWORD_HASH,
  getLockoutDurationMinutes,
} from './constants/auth.constants';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordBreachService: PasswordBreachService,
    private readonly trustedDeviceService: TrustedDeviceService,
    private readonly impossibleTravelService: ImpossibleTravelService,
    private readonly suspiciousLoginService: SuspiciousLoginService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
  ) {}

  async register(
    dto: RegisterDto,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<RegisterResult> {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      // CWE-203 / OWASP ASVS V2.1.1: timing protection — consume ~same
      // time as bcrypt.hash() so response latency doesn't reveal email existence
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);

      // Notify existing user of registration attempt (non-blocking)
      this.mailService
        .sendRegistrationAttemptNotification(
          existingUser.email,
          existingUser.firstName,
        )
        .catch(() => {});

      this.logAuditEvent(AuditAction.REGISTER, ctx, existingUser.id, {
        email: dto.email,
        outcome: 'existing_email',
      });

      return { message: ErrorMessages.auth.CHECK_EMAIL };
    }

    const isBreached = await this.passwordBreachService.isBreached(
      dto.password,
    );
    if (isBreached) {
      throw new BadRequestException(
        'This password has appeared in a data breach. Please choose a different password.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
    });

    // Send verification email (non-blocking — does not fail registration)
    this.emailVerificationService
      .createAndSendVerificationEmail(user)
      .catch(() => {});

    this.logAuditEvent(AuditAction.REGISTER, ctx, user.id, {
      email: dto.email,
      outcome: 'new_account',
    });

    return { message: ErrorMessages.auth.CHECK_EMAIL };
  }

  async login(
    dto: LoginDto,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
    fingerprint?: string,
  ): Promise<AuthResult | MfaChallengeResult | MfaSetupRequiredResult> {
    const user = await this.usersService.findByEmail(dto.email);

    // Timing attack protection: constant-time response when user not found
    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      this.logAuditEvent(AuditAction.LOGIN_FAILURE, ctx, undefined, {
        email: dto.email,
        reason: 'user_not_found',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Account lockout check — CWE-203: same exception type and message as
    // non-existing account to prevent enumeration
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      this.logAuditEvent(AuditAction.LOGIN_FAILURE, ctx, user.id, {
        reason: 'account_locked',
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Expired lockout: reset failed attempts (but NOT lockoutCount)
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.usersService.resetFailedAttempts(user.id);
    }

    await this.validateCredentials(dto, user, requestMeta, ctx);

    // Email verification check — CWE-203: same exception type and message as
    // all other login failures to prevent account state enumeration
    if (user.passwordHash && !user.emailVerified) {
      this.logAuditEvent(AuditAction.LOGIN_FAILURE, ctx, user.id, {
        reason: 'email_not_verified',
      });
      // Silently re-send verification email (fire-and-forget)
      this.emailVerificationService
        .createAndSendVerificationEmail(user)
        .catch(() => {});
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.failedAttempts > 0 || user.lockoutCount > 0) {
      await this.usersService.resetLockoutEscalation(user.id);
    }

    // MFA check — skip if device is trusted, otherwise return challenge token
    if (user.mfaEnabled) {
      return this.handleMfaLogin(user, requestMeta, ctx, fingerprint);
    }

    // OWASP ASVS V2.7.2: Admin/SUPERADMIN must have MFA enabled
    if (
      (user.role === Role.ADMIN || user.role === Role.SUPERADMIN) &&
      !user.mfaEnabled
    ) {
      return this.handleMfaSetupRequired(user, ctx);
    }

    return this.handleLoginSuccess(user, requestMeta, ctx);
  }

  private async validateCredentials(
    dto: LoginDto,
    user: User,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<void> {
    // OAuth-only account (no password set) — constant timing, NO lockout.
    if (!user.passwordHash) {
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      this.logAuditEvent(AuditAction.LOGIN_FAILURE, ctx, user.id, {
        reason: 'no_password_set',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      const updated = await this.usersService.incrementFailedAttempts(user.id);

      if (updated.failedAttempts > MAX_FAILED_ATTEMPTS) {
        await this.usersService.lockAccount(user.id, user.lockoutCount);

        const lockoutMinutes = getLockoutDurationMinutes(user.lockoutCount);
        this.mailService
          .sendAccountLockedEmail(
            user.email,
            updated.failedAttempts,
            lockoutMinutes,
            user.firstName,
          )
          .catch(() => {});

        this.logAuditEvent(AuditAction.ACCOUNT_LOCKED, ctx, user.id, {
          reason: 'max_failed_attempts',
          failedAttempts: MAX_FAILED_ATTEMPTS,
        });

        throw new UnauthorizedException('Invalid credentials');
      }

      this.logAuditEvent(AuditAction.LOGIN_FAILURE, ctx, user.id, {
        reason: 'invalid_password',
        failedAttempts: updated.failedAttempts,
      });

      this.checkSuspiciousLoginFailure(user.id, requestMeta);

      throw new UnauthorizedException('Invalid credentials');
    }
  }

  private async handleMfaLogin(
    user: User,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
    fingerprint?: string,
  ): Promise<AuthResult | MfaChallengeResult> {
    if (fingerprint) {
      const isTrusted = await this.trustedDeviceService.isTrustedDevice(
        user.id,
        fingerprint,
      );
      if (isTrusted) {
        const { accessToken, refreshToken, sessionId } =
          await this.tokenService.generateTokens(user, requestMeta);

        this.logAuditEvent(AuditAction.LOGIN_SUCCESS, ctx, user.id, {
          mfaSkipped: true,
          trustedDevice: true,
        });

        const travelResult = await this.tokenService.checkImpossibleTravel(
          user,
          requestMeta,
        );
        if (
          travelResult?.isAnomalous &&
          travelResult.actionTaken === 'blocked'
        ) {
          this.tokenService.handleTravelBlock(
            travelResult,
            user.id,
            requestMeta,
          );
        }

        this.tokenService
          .notifyIfNewDevice(user, sessionId, requestMeta)
          .catch(() => {});
        this.tokenService.checkSuspiciousLoginSuccess(user, requestMeta);

        return {
          accessToken,
          user: toSafeUser(user),
          cookie: this.tokenService.buildRefreshCookie(refreshToken),
        };
      }
    }

    const mfaToken = this.tokenService.signMfaChallengeToken(user.id);

    this.logAuditEvent(AuditAction.LOGIN_SUCCESS, ctx, user.id, {
      mfaChallengeIssued: true,
    });

    return { mfaRequired: true, mfaToken };
  }

  private handleMfaSetupRequired(
    user: User,
    ctx?: RequestContext,
  ): MfaSetupRequiredResult {
    this.logAuditEvent(AuditAction.LOGIN_SUCCESS, ctx, user.id, {
      mfaSetupRequired: true,
      role: user.role,
    });

    return {
      mfaSetupRequired: true,
      message:
        'MFA setup is required for administrator accounts. Please enable MFA to continue.',
    };
  }

  private async handleLoginSuccess(
    user: User,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<AuthResult | MfaChallengeResult> {
    const { accessToken, refreshToken, sessionId } =
      await this.tokenService.generateTokens(user, requestMeta);

    const travelResult = await this.tokenService.checkImpossibleTravel(
      user,
      requestMeta,
    );
    if (travelResult?.isAnomalous) {
      if (travelResult.actionTaken === 'blocked') {
        this.tokenService.handleTravelBlock(travelResult, user.id, requestMeta);
      }
      if (travelResult.actionTaken === 'challenged' && user.mfaEnabled) {
        const mfaChallengeToken = this.tokenService.signMfaChallengeToken(
          user.id,
        );
        return { mfaRequired: true, mfaToken: mfaChallengeToken };
      }
    }

    this.logAuditEvent(AuditAction.LOGIN_SUCCESS, ctx, user.id);

    this.tokenService
      .notifyIfNewDevice(user, sessionId, requestMeta)
      .catch(() => {});
    this.tokenService.checkSuspiciousLoginSuccess(user, requestMeta);

    return {
      accessToken,
      user: toSafeUser(user),
      cookie: this.tokenService.buildRefreshCookie(refreshToken),
    };
  }

  private checkSuspiciousLoginFailure(
    userId: string | undefined,
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): void {
    if (!userId) return;
    this.suspiciousLoginService
      .analyzeLoginFailure({
        userId,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent ?? null,
      })
      .catch(() => {});
  }

  private logAuditEvent(
    action: AuditAction,
    ctx?: { ipAddress?: string | null; userAgent?: string | null },
    userId?: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.auditService
      .log({
        action,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        ...(metadata && { metadata }),
      })
      .catch(() => {});
  }
}
