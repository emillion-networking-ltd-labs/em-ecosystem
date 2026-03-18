import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordBreachService } from './password-breach.service';
import { TrustedDeviceService } from './trusted-device.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { RequestContext } from '../audit/interfaces/audit-log-entry.interface';
import { LoginSecurityService } from './login-security.service';
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
import { pseudonymizeEmail } from '../common/utils/pseudonymize-email';
import {
  BCRYPT_ROUNDS,
  MAX_FAILED_ATTEMPTS,
  DUMMY_PASSWORD_HASH,
  MIN_LOGIN_DURATION_MS,
  getLockoutDurationMinutes,
} from './constants/auth.constants';

@Injectable()
export class LoginService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordBreachService: PasswordBreachService,
    private readonly trustedDeviceService: TrustedDeviceService,
    private readonly loginSecurityService: LoginSecurityService,
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

      this.loginSecurityService.sendRegistrationAttemptNotification(
        existingUser.email,
        existingUser.firstName,
      );

      this.loginSecurityService.logAudit(
        AuditAction.REGISTER,
        ctx,
        existingUser.id,
        { email: pseudonymizeEmail(dto.email), outcome: 'existing_email' },
      );

      return { message: ErrorMessages.auth.CHECK_EMAIL };
    }

    const isBreached = await this.passwordBreachService.isBreached(
      dto.password,
    );
    if (isBreached) {
      throw new BadRequestException(ErrorMessages.auth.PASSWORD_BREACHED);
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

    this.loginSecurityService.logAudit(AuditAction.REGISTER, ctx, user.id, {
      email: pseudonymizeEmail(dto.email),
      outcome: 'new_account',
    });

    return { message: ErrorMessages.auth.CHECK_EMAIL };
  }

  private async executeLogin(
    dto: LoginDto,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
    fingerprint?: string,
  ): Promise<AuthResult | MfaChallengeResult | MfaSetupRequiredResult> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      this.loginSecurityService.logAudit(
        AuditAction.LOGIN_FAILURE,
        ctx,
        undefined,
        { email: pseudonymizeEmail(dto.email), reason: 'user_not_found' },
      );
      throw new UnauthorizedException(ErrorMessages.auth.INVALID_CREDENTIALS);
    }

    // Layer 1 timing defense (H-12): Equalize response time for locked-account path
    // by running bcrypt before checkAccountLockout throws, matching user-not-found path timing.
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
    }

    this.checkAccountLockout(user, ctx);

    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.usersService.resetFailedAttempts(user.id);
    }

    await this.validateCredentials(dto, user, requestMeta, ctx);
    this.checkEmailVerification(user, ctx);

    if (user.failedAttempts > 0 || user.lockoutCount > 0) {
      await this.usersService.resetLockoutEscalation(user.id);
    }

    if (user.mfaEnabled) {
      return this.handleMfaLogin(user, requestMeta, ctx, fingerprint);
    }

    if (
      (user.role === Role.ADMIN || user.role === Role.SUPERADMIN) &&
      !user.mfaEnabled
    ) {
      return this.handleMfaSetupRequired(user, ctx);
    }

    return this.handleLoginSuccess(user, requestMeta, ctx);
  }

  /**
   * Public login method with timing attack mitigation.
   * Wraps executeLogin() with a min-duration floor to ensure all code paths
   * (success, MFA required, MFA setup, failures, lockout) take ≥ MIN_LOGIN_DURATION_MS.
   *
   * This addresses:
   * - H-12 (account lockout timing leak): Ensures locked path doesn't return early
   * - EM-04 (login path timing variance): Equalizes post-validation path execution times
   */
  async login(
    dto: LoginDto,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
    fingerprint?: string,
  ): Promise<AuthResult | MfaChallengeResult | MfaSetupRequiredResult> {
    const start = Date.now();
    let result:
      | AuthResult
      | MfaChallengeResult
      | MfaSetupRequiredResult
      | undefined;
    let error: unknown;

    try {
      result = await this.executeLogin(dto, requestMeta, ctx, fingerprint);
    } catch (err) {
      error = err;
    }

    // Layer 2 timing defense (EM-04): Apply min-duration floor to all paths
    const elapsed = Date.now() - start;
    if (elapsed < MIN_LOGIN_DURATION_MS) {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, MIN_LOGIN_DURATION_MS - elapsed),
      );
    }

    if (error !== undefined) throw error as Error;
    return result!;
  }

  private checkAccountLockout(user: User, ctx?: RequestContext): void {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      this.loginSecurityService.logAudit(
        AuditAction.LOGIN_FAILURE,
        ctx,
        user.id,
        { reason: 'account_locked' },
      );
      throw new UnauthorizedException(ErrorMessages.auth.INVALID_CREDENTIALS);
    }
  }

  private checkEmailVerification(user: User, ctx?: RequestContext): void {
    if (user.passwordHash && !user.emailVerified) {
      this.loginSecurityService.logAudit(
        AuditAction.LOGIN_FAILURE,
        ctx,
        user.id,
        { reason: 'email_not_verified' },
      );
      this.emailVerificationService
        .createAndSendVerificationEmail(user)
        .catch(() => {});
      throw new UnauthorizedException(ErrorMessages.auth.INVALID_CREDENTIALS);
    }
  }

  private async validateCredentials(
    dto: LoginDto,
    user: User,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<void> {
    if (!user.passwordHash) {
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      this.loginSecurityService.logAudit(
        AuditAction.LOGIN_FAILURE,
        ctx,
        user.id,
        { reason: 'no_password_set' },
      );
      throw new UnauthorizedException(ErrorMessages.auth.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      await this.handleInvalidPassword(user, requestMeta, ctx);
    }
  }

  private async handleInvalidPassword(
    user: User,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<never> {
    const updated = await this.usersService.incrementFailedAttempts(user.id);

    if (updated.failedAttempts > MAX_FAILED_ATTEMPTS) {
      await this.usersService.lockAccount(user.id, user.lockoutCount);
      const lockoutMinutes = getLockoutDurationMinutes(user.lockoutCount);
      this.loginSecurityService.sendAccountLockedEmail(
        user.email,
        updated.failedAttempts,
        lockoutMinutes,
        user.firstName,
      );
      this.loginSecurityService.logAudit(
        AuditAction.ACCOUNT_LOCKED,
        ctx,
        user.id,
        { reason: 'max_failed_attempts', failedAttempts: MAX_FAILED_ATTEMPTS },
      );
      throw new UnauthorizedException(ErrorMessages.auth.INVALID_CREDENTIALS);
    }

    this.loginSecurityService.logAudit(
      AuditAction.LOGIN_FAILURE,
      ctx,
      user.id,
      { reason: 'invalid_password', failedAttempts: updated.failedAttempts },
    );

    this.loginSecurityService.checkSuspiciousLoginFailure(user.id, requestMeta);

    throw new UnauthorizedException(ErrorMessages.auth.INVALID_CREDENTIALS);
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
        return this.completeTrustedDeviceLogin(user, requestMeta, ctx);
      }
    }

    const mfaToken = this.tokenService.signMfaChallengeToken(user.id);
    this.loginSecurityService.logAudit(
      AuditAction.LOGIN_SUCCESS,
      ctx,
      user.id,
      {
        mfaChallengeIssued: true,
      },
    );
    return { mfaRequired: true, mfaToken };
  }

  private async completeTrustedDeviceLogin(
    user: User,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<AuthResult> {
    const { accessToken, refreshToken, sessionId } =
      await this.tokenService.generateTokens(user, requestMeta);

    this.loginSecurityService.logAudit(
      AuditAction.LOGIN_SUCCESS,
      ctx,
      user.id,
      {
        mfaSkipped: true,
        trustedDevice: true,
      },
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
      accessToken,
      user: toSafeUser(user),
      cookie: this.tokenService.buildRefreshCookie(refreshToken),
    };
  }

  private handleMfaSetupRequired(
    user: User,
    ctx?: RequestContext,
  ): MfaSetupRequiredResult {
    this.loginSecurityService.logAudit(
      AuditAction.LOGIN_SUCCESS,
      ctx,
      user.id,
      {
        mfaSetupRequired: true,
        role: user.role,
      },
    );

    const setupToken = this.tokenService.signMfaSetupToken(user.id);

    return {
      mfaSetupRequired: true,
      setupToken,
      message: ErrorMessages.mfa.SETUP_REQUIRED,
    };
  }

  private async handleLoginSuccess(
    user: User,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<AuthResult | MfaChallengeResult> {
    const { accessToken, refreshToken, sessionId } =
      await this.tokenService.generateTokens(user, requestMeta);

    const travelResult = await this.loginSecurityService.checkImpossibleTravel(
      user,
      requestMeta,
    );
    if (travelResult?.isAnomalous) {
      if (travelResult.actionTaken === 'blocked') {
        this.loginSecurityService.handleTravelBlock(
          travelResult,
          user.id,
          requestMeta,
        );
      }
      if (travelResult.actionTaken === 'challenged' && user.mfaEnabled) {
        const mfaChallengeToken = this.tokenService.signMfaChallengeToken(
          user.id,
        );
        return { mfaRequired: true, mfaToken: mfaChallengeToken };
      }
    }

    this.loginSecurityService.logAudit(AuditAction.LOGIN_SUCCESS, ctx, user.id);

    this.loginSecurityService
      .notifyIfNewDevice(user, sessionId, requestMeta)
      .catch(() => {});
    this.loginSecurityService.checkSuspiciousLoginSuccess(user, requestMeta);

    return {
      accessToken,
      user: toSafeUser(user),
      cookie: this.tokenService.buildRefreshCookie(refreshToken),
    };
  }
}
