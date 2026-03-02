import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthStateStore } from '../stores/oauth-state.store';

@Injectable()
export class GitHubAuthGuard extends AuthGuard('github') {
  constructor(private readonly oauthStateStore: OAuthStateStore) {
    super();
  }

  async getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    // Only generate state + PKCE for the initiation endpoint, not the callback
    if (!request.query?.code) {
      const { state, codeChallenge } = await this.oauthStateStore.generate();
      return {
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      };
    }
    return {};
  }
}
