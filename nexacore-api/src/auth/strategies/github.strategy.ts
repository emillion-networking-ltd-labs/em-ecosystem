import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { OAuthAuthService } from '../oauth-auth.service';
import { OAuthStateStore, OAuthStateData } from '../stores/oauth-state.store';
import { Provider } from '../../users/enums/provider.enum';
import { ErrorMessages } from '../../common/constants/error-messages';
import {
  applyPkceAuthenticate,
  applyPkceAuthorizationParams,
} from './pkce-authenticate';
import { extractRequestMeta } from '../../common/utils/request-meta';

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

  async authenticate(req: any, options?: any): Promise<void> {
    return applyPkceAuthenticate(
      this,
      this.oauthStateStore,
      req,
      options,
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
      displayName?: string;
      photos?: { value: string }[];
    },
    done: (error: Error | null, user?: unknown) => void,
  ): Promise<void> {
    // Validate OAuth state parameter (CSRF protection) and retrieve action metadata
    const state = req.query?.state;
    if (!state) {
      done(new Error(ErrorMessages.auth.AUTHENTICATION_FAILED));
      return;
    }
    const stateData: OAuthStateData | null =
      await this.oauthStateStore.validate(state);
    if (!stateData) {
      done(new Error(ErrorMessages.auth.AUTHENTICATION_FAILED));
      return;
    }

    const email = profile.emails?.[0]?.value;
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

    const requestMeta = extractRequestMeta(req);

    const oauthProfile = {
      email,
      provider: Provider.GITHUB,
      providerId: profile.id,
      firstName,
      lastName,
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
      done(err as Error);
    }
  }
}
