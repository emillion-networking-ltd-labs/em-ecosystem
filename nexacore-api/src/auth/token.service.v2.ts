// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

/**
 * TokenServiceV2 — internal scaffolding for AUTH v2 + Tenancy v1.
 *
 * SCRUM-492 / AUTH v2 + Tenancy v1 — Phase 1.1.
 * See ai-specs/changes/auth/programs/AUTH-v2.md §4 (Phase 1) and the plan
 * at ai-specs/changes/auth/plans/Sprint 15/SCRUM-492_backend.md §5.
 *
 * Strangler-pattern foundation. Exposes a tenant-aware mint + verify pair
 * for the v2 access token shape (JwtPayloadV2). NO refresh tokens, NO
 * sessions, NO HTTP consumers — those land in Phase 1.2 / 1.3 / 2.
 *
 * Configuration is inherited from the application-level JwtModule
 * (auth.module.ts:55): secret, issuer, audience, algorithm, and access TTL
 * are all set there once and shared by every JwtService consumer. Reusing
 * the existing config means v1 and v2 tokens are cryptographically
 * mutually-verifiable; the differentiator is payload shape, not signature.
 *
 * Defense in depth on verify: jwtService.verify enforces signature +
 * expiry + issuer + audience + algorithm. On top of that we run an
 * explicit shape check to reject forged v1-shape payloads signed with
 * the shared JWT_SECRET. All failure modes throw the same exception with
 * the same message — no information leak between "wrong signature",
 * "expired", and "wrong shape".
 */

import { randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenantRole } from '@prisma/client';
import { ErrorMessages } from '../common/constants/error-messages';
import { JwtPayloadV2 } from './interfaces/jwt-payload-v2.interface';
import { isValidV2Payload } from './utils/jwt-payload-v2.guard';

export interface MintAccessTokenInput {
  userId: string;
  sessionId: string;
  tenantId: string;
  tenantRole: TenantRole;
  isPlatformAdmin: boolean;
}

@Injectable()
export class TokenServiceV2 {
  constructor(private readonly jwt: JwtService) {}

  /**
   * Mint a v2 access token. Inherits secret, issuer, audience, algorithm,
   * and expiresIn from the application-level JwtModule registration.
   * `iat` is auto-populated by JwtService.sign; `jti` is a fresh UUID per
   * call (revocation key).
   */
  mintAccessToken(input: MintAccessTokenInput): string {
    const payload = {
      sub: input.userId,
      jti: randomUUID(),
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      tenantRole: input.tenantRole,
      isPlatformAdmin: input.isPlatformAdmin,
    };
    return this.jwt.sign(payload);
  }

  /**
   * Verify a v2 access token. Two gates:
   *   1. Cryptographic: jwtService.verify enforces signature + expiry +
   *      issuer + audience + algorithm (all set in JwtModule).
   *   2. Shape: explicit type-guard rejects forged v1-shape payloads that
   *      pass gate 1 (same secret signs both).
   *
   * Any failure (wrong signature, expired, wrong issuer/audience, malformed
   * shape) → UnauthorizedException with the SAME message used by v1 paths,
   * preventing failure-mode enumeration.
   */
  verifyAccessToken(token: string): JwtPayloadV2 {
    let decoded: unknown;
    try {
      decoded = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
    if (!isValidV2Payload(decoded)) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
    return decoded;
  }
}
