import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthStateStore } from '../stores/oauth-state.store';

@Injectable()
export class GitHubAuthGuard extends AuthGuard('github') {
  constructor(private readonly oauthStateStore: OAuthStateStore) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    // Only generate state for the initiation endpoint, not the callback
    if (!request.query?.code) {
      return { state: this.oauthStateStore.generate() };
    }
    return {};
  }
}
