// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import { TenantRole } from '@prisma/client';

/**
 * v2 JWT payload — multi-tenant aware.
 *
 * SCRUM-492 / AUTH v2 + Tenancy v1 — Phase 1.1.
 * See AUTH-v2 program §2.3.
 *
 * Differences from v1 (JwtPayload in src/common/interfaces/jwt-payload.interface.ts):
 *   - REMOVED: email, role
 *   - ADDED:   tenantId, tenantRole, isPlatformAdmin
 *   - Required: sessionId, iat (no longer optional)
 *
 * Internal scaffolding only — no production consumers in this phase.
 * Strangler pattern: v1 continues; v2 lives in unit tests until later sub-phases
 * wire consumers (Phase 1.2 refresh + SessionsServiceV2, Phase 1.3 JwtV2Strategy,
 * Phase 2 AuthIntent endpoints).
 */
export interface JwtPayloadV2 {
  /** User id — global identity, stable across tenant context. */
  sub: string;

  /** Unique token identifier (revocation key — per-token deny-list anchor). */
  jti: string;

  /** Session id — per-session revocation anchor (Phase 1.2 wires SessionsServiceV2). */
  sessionId: string;

  /** Issued-at unix seconds — populated by JwtService.sign. */
  iat: number;

  /** Active tenant for this token. */
  tenantId: string;

  /** Caller's role within the active tenant (see Prisma TenantRole enum). */
  tenantRole: TenantRole;

  /**
   * Cross-tenant capability flag (mirror of User.isPlatformAdmin from SCRUM-489).
   * When true, RolesGuard / PermissionsGuard / MembershipsService capability checks
   * are bypassed at the consumer layer.
   */
  isPlatformAdmin: boolean;
}
