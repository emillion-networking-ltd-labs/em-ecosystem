import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuthLinkCodeStore } from '../stores/oauth-link-code.store';
import { ErrorMessages } from '../../common/constants/error-messages';

/**
 * Validates a short-lived, single-use link code from the ?code= query param,
 * then sets req.oauthAction='link' and req.user = { id } so the subsequent
 * OAuth guard can embed these in the OAuth state parameter.
 *
 * The link code is obtained by calling POST /auth/link/code with a valid JWT
 * in the Authorization header. This avoids passing JWTs in URLs (OWASP V8.3.1).
 */
@Injectable()
export class OAuthLinkGuard implements CanActivate {
  constructor(private readonly oauthLinkCodeStore: OAuthLinkCodeStore) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const code = request.query?.code as string | undefined;
    if (!code) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    const userId = await this.oauthLinkCodeStore.consume(code);
    if (!userId) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    request.user = { id: userId };
    request.oauthAction = 'link';
    return true;
  }
}
