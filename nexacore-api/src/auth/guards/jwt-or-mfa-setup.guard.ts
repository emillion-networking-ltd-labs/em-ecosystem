import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MfaSetupGuard } from './mfa-setup.guard';

/**
 * Composite guard: accepts either a standard JWT (already authenticated users)
 * OR an MFA setup token (ADMIN/SUPERADMIN during mandatory MFA onboarding).
 */
@Injectable()
export class JwtOrMfaSetupGuard implements CanActivate {
  private readonly jwtGuard: CanActivate;

  constructor(private readonly mfaSetupGuard: MfaSetupGuard) {
    this.jwtGuard = new (AuthGuard('jwt'))();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Try standard JWT first (most common path)
    try {
      const result = await this.jwtGuard.canActivate(context);
      if (result) return true;
    } catch {
      // JWT failed — try MFA setup token
    }

    // Try MFA setup token
    try {
      return await this.mfaSetupGuard.canActivate(context);
    } catch {
      throw new UnauthorizedException(
        'Valid access token or MFA setup token required',
      );
    }
  }
}
