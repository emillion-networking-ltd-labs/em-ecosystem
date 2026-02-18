import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';
import { Provider } from '../../users/enums/provider.enum';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { emails?: { value: string }[]; id: string },
    done: (error: Error | null, user?: Record<string, unknown>) => void,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('No email provided by GitHub'));
      return;
    }

    const result = await this.authService.validateOAuthUser({
      email,
      provider: Provider.GITHUB,
      providerId: profile.id,
    });

    done(null, result);
  }
}
