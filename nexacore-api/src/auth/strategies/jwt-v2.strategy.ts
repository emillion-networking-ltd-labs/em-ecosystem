// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

/**
 * JwtV2Strategy — Passport strategy for v2 access tokens.
 *
 * SCRUM-494 / AUTH v2 + Tenancy v1 Phase 1.3.
 *
 * Two-gate verification:
 *   - Gate 1 (crypto): Passport-jwt validates signature + iss/aud/alg + expiry
 *     using the shared JwtModule config (same secret as v1 — program §2.3.1).
 *   - Gate 2 (shape): isValidV2Payload guard rejects forged v1-shape payloads
 *     that pass crypto by virtue of sharing the JWT secret.
 *
 * On success: returns the typed JwtPayloadV2 (payload IS the canonical source
 * for tenantId / tenantRole / isPlatformAdmin — no user lookup, unlike v1).
 * On failure: throws UnauthorizedException(AUTHENTICATION_FAILED) — no enumeration.
 *
 * Strategy name 'jwt-v2' coexists with v1's default 'jwt' name.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadV2 } from '../interfaces/jwt-payload-v2.interface';
import { isValidV2Payload } from '../utils/jwt-payload-v2.guard';
import { ErrorMessages } from '../../common/constants/error-messages';
import { JWT_ISSUER, JWT_AUDIENCE } from '../constants/auth.constants';

@Injectable()
export class JwtV2Strategy extends PassportStrategy(Strategy, 'jwt-v2') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtSecret')!,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256'],
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(payload: unknown): Promise<JwtPayloadV2> {
    // Marked `async` so the synchronous shape-guard throw surfaces as a
    // Promise rejection — matches Passport-jwt's contract that all validate
    // failures look the same (no sync-vs-async leak via thrown shape).
    if (!isValidV2Payload(payload)) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
    return payload;
  }
}
