import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';
import { OAuthStateStore } from '../stores/oauth-state.store';
import { Provider } from '../../users/enums/provider.enum';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthStateStore: OAuthStateStore,
  ) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
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
      displayName?: string;
      photos?: { value: string }[];
    },
    done: (error: Error | null, user?: unknown) => void,
  ): Promise<void> {
    // Validate OAuth state parameter (CSRF protection)
    const state = req.query?.state;
    if (!state || !(await this.oauthStateStore.validate(state))) {
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

    const requestMeta = {
      ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
      userAgent:
        (req.headers?.['user-agent'] as string | undefined) || null,
    };

    try {
      const result = await this.authService.validateOAuthUser(
        {
          email,
          provider: Provider.GITHUB,
          providerId: profile.id,
          firstName,
          lastName,
          avatarUrl: profile.photos?.[0]?.value,
        },
        requestMeta,
        requestMeta,
      );
      done(null, result);
    } catch (err) {
      done(err as Error);
    }
  }
}
