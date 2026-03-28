import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { OAuthAuthService } from '../oauth-auth.service';
import { OAuthStateStore } from '../stores/oauth-state.store';
import { Provider } from '../../users/enums/provider.enum';
import {
  applyPkceAuthenticate,
  applyPkceAuthorizationParams,
} from './pkce-authenticate';
import { validateOAuthCallback } from './oauth-validate.helper';

interface PassportOAuth2Internals {
  _oauth2: { getOAuthAccessToken: (...args: unknown[]) => void };
}

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

  authorizationParams(options: Record<string, string>): Record<string, string> {
    return applyPkceAuthorizationParams(options);
  }

  async authenticate(
    req: { query?: { code?: string; state?: string } },
    options?: Record<string, unknown>,
  ): Promise<void> {
    return applyPkceAuthenticate(
      this as unknown as PassportOAuth2Internals,
      this.oauthStateStore,
      req,
      options ?? {},
      super.authenticate,
    );
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
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('No email provided by Google'), undefined);
      return;
    }

    await validateOAuthCallback(
      this.oauthStateStore,
      this.oauthAuthService,
      req,
      {
        email,
        provider: Provider.GOOGLE,
        providerId: profile.id,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        avatarUrl: profile.photos?.[0]?.value,
        emailVerified: true, // Google always verifies email ownership
      },
      done as (error: Error | null, user?: unknown) => void,
    );
  }
}
