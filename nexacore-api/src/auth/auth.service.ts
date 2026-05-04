import { Injectable } from '@nestjs/common';
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
import { RequestContext } from '../audit/interfaces/audit-log-entry.interface';
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
  constructor(
    private readonly loginService: LoginService,
    private readonly tokenService: TokenService,
    private readonly oauthAuthService: OAuthAuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
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
    oauthAction?: 'login' | 'created' | 'linked' | 'auto-verified';
  }): Promise<string> {
    return this.oauthAuthService.generateOAuthCode(payload);
  }

  async exchangeOAuthCode(code: string): Promise<{
    accessToken: string;
    user: SafeUser;
    cookie: CookieConfig;
    oauthAction?: 'login' | 'created' | 'linked' | 'auto-verified';
  }> {
    return this.oauthAuthService.exchangeOAuthCode(code);
  }

  // ── Session Management ──

  async logout(
    refreshToken: string,
    ctx?: RequestContext,
  ): Promise<CookieConfig> {
    return this.tokenService.logout(refreshToken, ctx);
  }

  async logoutAll(userId: string, ctx?: RequestContext): Promise<CookieConfig> {
    return this.tokenService.logoutAll(userId, ctx);
  }

  /**
   * SCRUM-347 follow-up: password-gated logoutAll. Same end state as
   * logoutAll() but requires a fresh password proof — defense against a
   * session-hijacker locking the legitimate user out of all their sessions.
   */
  async logoutAllWithReauth(
    userId: string,
    password: string,
    ctx?: RequestContext,
  ): Promise<CookieConfig> {
    return this.tokenService.logoutAllWithReauth(userId, password, ctx);
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
