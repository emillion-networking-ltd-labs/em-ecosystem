/**
 * Tenant context error classes.
 *
 * SCRUM-488 / AUTH v2 + Tenancy v1 — Phase 0.2.
 * See ai-specs/changes/auth/programs/AUTH-v2.md §2.4.
 *
 * These errors signal coding-time invariant violations of the tenant-filter
 * middleware. They are bare {@link Error} subclasses (NOT NestJS
 * HttpException) because in the vast majority of cases hitting them is a
 * programming bug, not a recoverable user-facing condition. The interceptor
 * is responsible for translating the one user-facing case (an authenticated
 * user with zero active memberships) into a {@link ForbiddenException} at
 * the request boundary; everything else flows through the global
 * HttpExceptionFilter as a 500.
 */

export class TenantContextMissingError extends Error {
  constructor(message = 'Tenant context required for this operation') {
    super(message);
    this.name = 'TenantContextMissingError';
  }
}

export class CrossTenantViolationError extends Error {
  constructor(message = 'Cross-tenant access denied') {
    super(message);
    this.name = 'CrossTenantViolationError';
  }
}

export class BypassWithoutReasonError extends Error {
  constructor(message = 'Tenant filter bypass requires a reason') {
    super(message);
    this.name = 'BypassWithoutReasonError';
  }
}
