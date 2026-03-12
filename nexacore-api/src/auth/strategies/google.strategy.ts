import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { OAuthAuthService } from '../oauth-auth.service';
import { OAuthStateStore, OAuthStateData } from '../stores/oauth-state.store';
import { Provider } from '../../users/enums/provider.enum';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly oauthAuthService: OAuthAuthService,
    private readonly oauthStateStore: OAuthStateStore,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('oauth.googleClientId')!,
      clientSecret: configService.get<string>('oauth.googleClientSecret')!,
      callbackURL: configService.get<string>('oauth.googleCallbackUrl')!,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  // Forward PKCE code_challenge to the authorization URL
  authorizationParams(options: Record<string, string>): Record<string, string> {
    const params: Record<string, string> = {};
    if (options.code_challenge) {
      params.code_challenge = options.code_challenge;
      params.code_challenge_method = options.code_challenge_method || 'S256';
    }
    return params;
  }

  // Inject code_verifier into the token exchange on callback
  async authenticate(req: any, options?: any): Promise<void> {
    if (req.query?.code && req.query?.state) {
      const codeVerifier = await this.oauthStateStore.getCodeVerifier(
        req.query.state,
      );
      if (codeVerifier) {
        const oauth2 = (this as any)._oauth2;
        const originalFn = oauth2.getOAuthAccessToken;
        oauth2.getOAuthAccessToken = function (
          code: string,
          params: Record<string, string>,
          callback: (...args: any[]) => void,
        ) {
          params.code_verifier = codeVerifier;
          oauth2.getOAuthAccessToken = originalFn; // restore immediately
          return originalFn.call(oauth2, code, params, callback);
        };
      }
    }
    return (super.authenticate as Function).call(this, req, options);
  }

  async validate(
    req: {
      query: { state?: string };
      ip?: string;
      socket?: { remoteAddress?: string };
      headers?: Record<string, string | string[]>;
    },
    _accessToken: string,
    _refreshToken: string,
    profile: {
      emails?: { value: string }[];
      id: string;
      name?: { givenName?: string; familyName?: string };
      photos?: { value: string }[];
    },
    done: VerifyCallback,
  ): Promise<void> {
    // Validate OAuth state parameter (CSRF protection) and retrieve action metadata
    const state = req.query?.state;
    if (!state) {
      done(new Error(ErrorMessages.auth.AUTHENTICATION_FAILED), undefined);
      return;
    }
    const stateData: OAuthStateData | null =
      await this.oauthStateStore.validate(state);
    if (!stateData) {
      done(new Error(ErrorMessages.auth.AUTHENTICATION_FAILED), undefined);
      return;
    }

    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('No email provided by Google'), undefined);
      return;
    }

    const requestMeta = {
      ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
      userAgent: (req.headers?.['user-agent'] as string | undefined) || null,
    };

    const oauthProfile = {
      email,
      provider: Provider.GOOGLE,
      providerId: profile.id,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      avatarUrl: profile.photos?.[0]?.value,
    };

    try {
      if (stateData.action === 'link' && stateData.userId) {
        const result = await this.oauthAuthService.validateOAuthLink(
          stateData.userId,
          oauthProfile,
          requestMeta,
        );
        done(null, result);
      } else {
        const result = await this.oauthAuthService.validateOAuthUser(
          oauthProfile,
          requestMeta,
          requestMeta,
        );
        done(null, result);
      }
    } catch (err) {
      done(err as Error, undefined);
    }
  }
}
