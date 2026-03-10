import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { ErrorMessages } from '../../common/constants/error-messages';

/**
 * Validates the JWT from Authorization header or ?token= query param,
 * then sets req.oauthAction='link' and req.user = { id } so the subsequent
 * OAuth guard can embed these in the OAuth state parameter.
 *
 * Query param is needed because browser redirects (window.location.href)
 * cannot carry Authorization headers.
 */
@Injectable()
export class OAuthLinkGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Extract token from Authorization header or query param
    let token: string | undefined;
    const authHeader = request.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (request.query?.token) {
      token = request.query.token as string;
    }

    if (!token) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      request.user = { id: payload.sub };
      request.oauthAction = 'link';
      return true;
    } catch {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
  }
}
