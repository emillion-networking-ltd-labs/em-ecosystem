import { ExecutionContext, Injectable, Type } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthStateStore, OAuthAction } from '../stores/oauth-state.store';

export function createOAuthAuthGuard(strategyName: string): Type<any> {
  @Injectable()
  class OAuthAuthGuard extends AuthGuard(strategyName) {
    constructor(private readonly oauthStateStore: OAuthStateStore) {
      super();
    }

    async getAuthenticateOptions(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest();
      if (!request.query?.code) {
        const action: OAuthAction = request.oauthAction || 'login';
        const userId: string | undefined = request.user?.id;
        const { state, codeChallenge } = await this.oauthStateStore.generate(
          action,
          userId,
        );
        return {
          state,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        };
      }
      return {};
    }
  }

  return OAuthAuthGuard;
}
