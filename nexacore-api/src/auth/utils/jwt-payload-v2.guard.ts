// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import { JwtPayloadV2 } from '../interfaces/jwt-payload-v2.interface';

/**
 * Type guard for JwtPayloadV2. Pure function, no DI.
 *
 * Two-gate verification for v2 access tokens (SCRUM-492 Phase 1.1 + SCRUM-494 Phase 1.3):
 *   - Gate 1 (crypto): handled by JwtService.verify (TokenServiceV2.verifyAccessToken)
 *     or Passport-jwt (JwtV2Strategy). Validates signature + iss/aud/alg + expiry.
 *   - Gate 2 (shape): THIS guard rejects forged v1-shape payloads that pass crypto
 *     by virtue of sharing the JWT secret with v1.
 *
 * Extracted from TokenServiceV2's previously-private isValidV2Payload (SCRUM-494)
 * to become the single source of truth — consumed by BOTH TokenServiceV2.verifyAccessToken
 * AND JwtV2Strategy.validate. NEVER duplicate the field list elsewhere.
 */
export function isValidV2Payload(p: unknown): p is JwtPayloadV2 {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.sub === 'string' &&
    typeof o.jti === 'string' &&
    typeof o.sessionId === 'string' &&
    typeof o.iat === 'number' &&
    typeof o.tenantId === 'string' &&
    typeof o.tenantRole === 'string' &&
    typeof o.isPlatformAdmin === 'boolean'
  );
}
