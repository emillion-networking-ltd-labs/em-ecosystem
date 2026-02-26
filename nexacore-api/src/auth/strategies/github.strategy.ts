import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';
import { OAuthStateStore } from '../stores/oauth-state.store';
import { Provider } from '../../users/enums/provider.enum';

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
    if (!state || !this.oauthStateStore.validate(state)) {
      done(new Error('Invalid or expired OAuth state parameter'));
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
