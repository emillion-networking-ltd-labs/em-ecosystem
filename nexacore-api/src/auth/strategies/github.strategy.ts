import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
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
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly oauthAuthService: OAuthAuthService,
    private readonly oauthStateStore: OAuthStateStore,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('oauth.githubClientId')!,
      clientSecret: configService.get<string>('oauth.githubClientSecret')!,
      callbackURL: configService.get<string>('oauth.githubCallbackUrl')!,
      scope: ['user:email'],
      passReqToCallback: true,
    });
  }

  authorizationParams(options: Record<string, string>): Record<string, string> {
    return applyPkceAuthorizationParams(options, { login: '' });
  }

  // Passport's authenticate() base signature is synchronous void; we override
  // with an async variant because PKCE state lookup hits Redis. Outcomes are
  // still reported via Passport's success/fail/error callbacks installed on
  // `this` by AuthGuard, so Passport itself never awaits the Promise we
  // return — the async return type is purely for typed in-method awaits.
  // The two suppressions document this passport+TS friction at the
  // contractual boundary between framework and override (well-known in
  // @nestjs/passport + passport-* OAuth2 strategies).
  /* eslint-disable @typescript-eslint/no-misused-promises, @typescript-eslint/unbound-method */
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
  /* eslint-enable @typescript-eslint/no-misused-promises, @typescript-eslint/unbound-method */

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
      emails?: { value: string; verified?: boolean }[];
      id: string;
      displayName?: string;
      photos?: { value: string }[];
    },
    done: (error: Error | null, user?: unknown) => void,
  ): Promise<void> {
    const primaryEmail = profile.emails?.[0];
    const email = primaryEmail?.value;
    if (!email) {
      done(new Error('No email provided by GitHub'));
      return;
    }

    // GitHub gives displayName as a single string — split into first/last
    let firstName: string | undefined;
    let lastName: string | undefined;
    if (profile.displayName) {
      const parts = profile.displayName.split(' ');
      firstName = parts[0];
      lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
    }

    await validateOAuthCallback(
      this.oauthStateStore,
      this.oauthAuthService,
      req,
      {
        email,
        provider: Provider.GITHUB,
        providerId: profile.id,
        firstName,
        lastName,
        avatarUrl: profile.photos?.[0]?.value,
        emailVerified: primaryEmail?.verified === true,
      },
      done,
    );
  }
}
