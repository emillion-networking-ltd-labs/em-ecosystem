/**
 * auditAndRunBypass — audit-on-decision helper for tenant-filter bypass.
 *
 * SCRUM-488 / AUTH v2 + Tenancy v1 — Phase 0.2.
 *
 * Production code that needs to opt out of the tenant filter (e.g. future
 * platform-admin endpoints once `User.isPlatformAdmin` exists in Phase 1)
 * MUST call this helper. The audit log entry is written FIRST, then the
 * supplied fn runs inside a TenantContext.runWithBypass scope.
 *
 * Per D-G in the SCRUM-488 plan: auditing happens at the BYPASS DECISION
 * site, not inside the Prisma extension — keeps the extension free of
 * cross-module DI cycles (AuditService -> PrismaService -> AuditService).
 *
 * Audit failures do NOT block the bypass call. AuditService.log() swallows
 * its own errors internally, so this helper inherits that contract.
 */

import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { TenantContext } from '../context/tenant-context';

export interface BypassRequestContext {
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function auditAndRunBypass<T>(
  audit: AuditService,
  reason: string,
  ctx: BypassRequestContext,
  fn: () => T | Promise<T>,
): Promise<T> {
  await audit.log({
    action: AuditAction.TENANT_FILTER_BYPASS,
    userId: ctx.userId ?? null,
    ipAddress: ctx.ipAddress ?? null,
    userAgent: ctx.userAgent ?? null,
    metadata: { reason },
  });
  return await TenantContext.runWithBypass(reason, fn);
}
