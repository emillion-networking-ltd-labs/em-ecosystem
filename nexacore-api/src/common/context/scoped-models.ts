/**
 * Tenant-scoped model registry.
 *
 * SCRUM-488 / AUTH v2 + Tenancy v1 — Phase 0.2.
 *
 * Single source of truth for which Prisma model names participate in the
 * tenant-filter Client Extension. Adding a Phase 0.3 / Phase 1 model is a
 * ONE-LINE append here — no extension code changes required.
 *
 * Phase 0.2 set: the three Phase-0.1 tenant-scoped entities that ship with
 * a real tenantId column today. Session / AuditLog / TrustedDevice land
 * here in Phase 0.3 or Phase 1 alongside the migrations that introduce
 * their tenantId columns (per program doc §2.2).
 */
export const SCOPED_MODELS = [
  'TenantSettings',
  'TenantMembership',
  'TenantInvitation',
] as const;

export type TenantScopedModel = (typeof SCOPED_MODELS)[number];

export function isScopedModel(model: string): boolean {
  return (SCOPED_MODELS as readonly string[]).includes(model);
}
