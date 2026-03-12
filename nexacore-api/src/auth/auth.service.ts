import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionsService } from '../sessions/sessions.service';
import {
  TokenDenyListService,
  ACCESS_TOKEN_TTL_SECONDS,
} from './token-deny-list.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { RequestContext } from '../audit/interfaces/audit-log-entry.interface';
import { LoginService } from './login.service';
import { TokenService } from './token.service';
import { OAuthAuthService } from './oauth-auth.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OAuthProfile } from '../common/interfaces/oauth-profile.interface';
import { SafeUser } from '../users/entities/user.entity';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import {
  CookieConfig,
  AuthResult,
  RegisterResult,
  MfaChallengeResult,
  MfaSetupRequiredResult,
} from './interfaces/auth.interfaces';

// Re-export interfaces for backward compatibility
export type {
  CookieConfig,
  AuthResult,
  RegisterResult,
  MfaChallengeResult,
  MfaSetupRequiredResult,
} from './interfaces/auth.interfaces';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly loginService: LoginService,
    private readonly tokenService: TokenService,
    private readonly oauthAuthService: OAuthAuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly sessionsService: SessionsService,
    private readonly tokenDenyListService: TokenDenyListService,
    private readonly auditService: AuditService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Registration & Login ──

  async register(
    dto: RegisterDto,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<RegisterResult> {
    return this.loginService.register(dto, requestMeta, ctx);
  }

  async login(
    dto: LoginDto,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
    fingerprint?: string,
  ): Promise<AuthResult | MfaChallengeResult | MfaSetupRequiredResult> {
    return this.loginService.login(dto, requestMeta, ctx, fingerprint);
  }

  // ── Token Lifecycle ──

  async refreshTokens(
    refreshToken: string,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<{ accessToken: string; cookie: CookieConfig }> {
    return this.tokenService.refreshTokens(refreshToken, requestMeta, ctx);
  }

  async generateTokensForMfa(
    userId: string,
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): Promise<AuthResult> {
    return this.tokenService.generateTokensForMfa(userId, requestMeta);
  }

  buildRefreshCookie(refreshToken: string): CookieConfig {
    return this.tokenService.buildRefreshCookie(refreshToken);
  }

  buildClearCookie(): CookieConfig {
    return this.tokenService.buildClearCookie();
  }

  // ── OAuth ──

  async validateOAuthUser(
    profile: OAuthProfile,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<AuthResult> {
    return this.oauthAuthService.validateOAuthUser(profile, requestMeta, ctx);
  }

  async validateOAuthLink(
    userId: string,
    profile: OAuthProfile,
    ctx: { ipAddress: string; userAgent?: string | null },
  ): Promise<AuthResult> {
    return this.oauthAuthService.validateOAuthLink(userId, profile, ctx);
  }

  async generateOAuthCode(payload: {
    accessToken: string;
    user: SafeUser;
    cookie: CookieConfig;
    oauthAction?: 'login' | 'created' | 'linked';
  }): Promise<string> {
    return this.oauthAuthService.generateOAuthCode(payload);
  }

  async exchangeOAuthCode(code: string): Promise<{
    accessToken: string;
    user: SafeUser;
    cookie: CookieConfig;
    oauthAction?: 'login' | 'created' | 'linked';
  }> {
    return this.oauthAuthService.exchangeOAuthCode(code);
  }

  // ── Session Management (direct implementations) ──

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

    return this.tokenService.buildClearCookie();
  }

  async logoutAll(userId: string, ctx?: RequestContext): Promise<CookieConfig> {
    await this.sessionsService.revokeAllUserSessions(userId);
    this.tokenDenyListService
      .denyAllForUser(userId, ACCESS_TOKEN_TTL_SECONDS)
      .catch(() => {});

    this.auditService
      .log({
        action: AuditAction.LOGOUT,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { scope: 'all_sessions' },
      })
      .catch(() => {});

    return this.tokenService.buildClearCookie();
  }

  // ── Email Verification ──

  async verifyEmail(token: string): Promise<{ status: 'success' | 'invalid' }> {
    return this.emailVerificationService.verifyEmail(token);
  }

  async verifyEmailChange(
    token: string,
    ctx?: RequestContext,
  ): Promise<{ status: 'success' | 'invalid' }> {
    return this.emailVerificationService.verifyEmailChange(token, ctx);
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    return this.emailVerificationService.resendVerificationEmail(userId);
  }

  async resendVerificationByEmail(email: string): Promise<void> {
    return this.emailVerificationService.resendVerificationByEmail(email);
  }

  // ── Password Reset ──

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    return this.passwordResetService.forgotPassword(dto);
  }

  async resetPassword(
    dto: ResetPasswordDto,
    ctx?: RequestContext,
  ): Promise<void> {
    return this.passwordResetService.resetPassword(dto, ctx);
  }

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    return this.passwordResetService.validateResetToken(token);
  }
}
