// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from '../token.service';
import { UsersService } from '../../users/users.service';
import { toSafeUser } from '../../users/entities/user.entity';
import { ErrorMessages } from '../../common/constants/error-messages';

/**
 * Guard that accepts an MFA setup token (issued during login when ADMIN/SUPERADMIN
 * doesn't have MFA enabled yet). Falls back to standard JWT for already-authenticated
 * users managing MFA from account settings.
 *
 * MFA setup tokens are scoped: they only authorize /auth/mfa/setup and /auth/mfa/verify-setup.
 *
 * EM-07: all failure paths emit a single generic message — attacker cannot
 * discriminate "missing header" vs "user not found" vs "expired token".
 */
@Injectable()
export class MfaSetupGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader: string | undefined = request.headers?.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    const token = authHeader.slice(7);

    // Try MFA setup token
    try {
      const { sub } = this.tokenService.verifyMfaSetupToken(token);
      const user = await this.usersService.findById(sub);
      if (!user) {
        throw new UnauthorizedException(
          ErrorMessages.auth.AUTHENTICATION_FAILED,
        );
      }
      request.user = toSafeUser(user);
      return true;
    } catch {
      // Not a valid setup token — single generic error regardless of failure cause
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
  }
}
