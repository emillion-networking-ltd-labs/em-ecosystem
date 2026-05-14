// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MfaSetupGuard } from './mfa-setup.guard';
import { ErrorMessages } from '../../common/constants/error-messages';

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

    // Try MFA setup token. EM-07: single generic error regardless of failure cause.
    try {
      return await this.mfaSetupGuard.canActivate(context);
    } catch {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
  }
}
