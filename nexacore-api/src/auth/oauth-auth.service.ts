import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { OAuthCodeStore } from './stores/oauth-code.store';
import { TokenService } from './token.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { RequestContext } from '../audit/interfaces/audit-log-entry.interface';
import { SuspiciousLoginService } from '../security/suspicious-login.service';
import { OAuthProfile } from '../common/interfaces/oauth-profile.interface';
import { SafeUser, toSafeUser } from '../users/entities/user.entity';
import { AuthResult, CookieConfig } from './interfaces/auth.interfaces';
import { ErrorMessages } from '../common/constants/error-messages';

@Injectable()
export class OAuthAuthService {
  private readonly logger = new Logger(OAuthAuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly oauthCodeStore: OAuthCodeStore,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
    private readonly suspiciousLoginService: SuspiciousLoginService,
  ) {}

  async validateOAuthUser(
    profile: OAuthProfile,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<AuthResult> {
    const { user, action } =
      await this.usersService.findOrCreateByOAuth(profile);

    // Reset lockout on successful OAuth login (proves account ownership)
    if (user.failedAttempts > 0 || user.lockoutCount > 0) {
      await this.usersService.resetLockoutEscalation(user.id);
    }

    const { accessToken, refreshToken, sessionId } =
      await this.tokenService.generateTokens(user, requestMeta);

    const travelResult = await this.tokenService.checkImpossibleTravel(
      { ...user, mfaEnabled: user.mfaEnabled ?? false },
      requestMeta,
    );
    if (travelResult?.isAnomalous && travelResult.actionTaken === 'blocked') {
      this.tokenService.handleTravelBlock(travelResult, user.id, requestMeta);
    }

    const auditActionMap: Record<string, AuditAction> = {
      login: AuditAction.OAUTH_LOGIN,
      linked: AuditAction.OAUTH_LINKED,
      created: AuditAction.OAUTH_REGISTER,
    };

    this.auditService
      .log({
        action: auditActionMap[action] || AuditAction.OAUTH_LOGIN,
        userId: user.id,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { provider: profile.provider },
      })
      .catch(() => {});

    this.tokenService
      .notifyIfNewDevice(user, sessionId, requestMeta)
      .catch(() => {});
    this.tokenService.checkSuspiciousLoginSuccess(user, requestMeta);

    return {
      accessToken,
      user: toSafeUser(user),
      cookie: this.tokenService.buildRefreshCookie(refreshToken),
      oauthAction: action,
    };
  }

  async validateOAuthLink(
    userId: string,
    profile: OAuthProfile,
    ctx: { ipAddress: string; userAgent?: string | null },
  ): Promise<AuthResult> {
    await this.usersService.linkOAuthProvider(userId, profile, {
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent ?? null,
    });
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens(user, ctx);

    return {
      accessToken,
      user: toSafeUser(user),
      cookie: this.tokenService.buildRefreshCookie(refreshToken),
      oauthAction: 'linked',
    };
  }

  async generateOAuthCode(payload: {
    accessToken: string;
    user: SafeUser;
    cookie: CookieConfig;
    oauthAction?: 'login' | 'created' | 'linked';
  }): Promise<string> {
    return this.oauthCodeStore.store(payload);
  }

  async exchangeOAuthCode(code: string): Promise<{
    accessToken: string;
    user: SafeUser;
    cookie: CookieConfig;
    oauthAction?: 'login' | 'created' | 'linked';
  }> {
    const payload = await this.oauthCodeStore.exchange(code);
    if (!payload) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
    return payload;
  }
}
