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

/**
 * Guard that accepts an MFA setup token (issued during login when ADMIN/SUPERADMIN
 * doesn't have MFA enabled yet). Falls back to standard JWT for already-authenticated
 * users managing MFA from account settings.
 *
 * MFA setup tokens are scoped: they only authorize /auth/mfa/setup and /auth/mfa/verify-setup.
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
      throw new UnauthorizedException('Missing authorization token');
    }

    const token = authHeader.slice(7);

    // Try MFA setup token
    try {
      const { sub } = this.tokenService.verifyMfaSetupToken(token);
      const user = await this.usersService.findById(sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      request.user = toSafeUser(user);
      return true;
    } catch {
      // Not a valid setup token — will be caught by JwtAuthGuard in the OR guard
      throw new UnauthorizedException('Invalid or expired setup token');
    }
  }
}
