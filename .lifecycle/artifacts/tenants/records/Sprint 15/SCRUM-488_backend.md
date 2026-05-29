---
schema: ai-specs/schemas/record.schema.yml
ticket: SCRUM-488
sprint: Sprint 15
scope: backend
module: tenants
date: 2026-05-19
branch: feature/SCRUM-488-tenants-backend
plan_path: ai-specs/changes/tenants/plans/Sprint 15/SCRUM-488_backend.md
verify_path: ai-specs/changes/tenants/plans/Sprint 15/SCRUM-488_verify.md
is_audit_fix: false
plan_followed: "yes"
pr: 327
merge_commit: c88fa88cd38f9bc8ab38298c966ced39898a1cbb
framework_version: 0.15.0
commits:
  - hash: "3859404"
    message: "SCRUM-488: Prisma tenant-filter middleware (AUTH v2 Phase 0.2)"
    files:
      - nexacore-api/prisma/migrations/20260519105759_add_tenant_filter_bypass_audit_action/migration.sql
      - nexacore-api/prisma/schema.prisma
      - nexacore-api/src/app.module.ts
      - nexacore-api/src/audit/enums/audit-action.enum.ts
      - nexacore-api/src/common/constants/error-messages.ts
      - nexacore-api/src/common/context/scoped-models.ts
      - nexacore-api/src/common/context/tenant-context.errors.ts
      - nexacore-api/src/common/context/tenant-context.ts
      - nexacore-api/src/common/context/tests/tenant-context.errors.spec.ts
      - nexacore-api/src/common/context/tests/tenant-context.spec.ts
      - nexacore-api/src/common/interceptors/audit-bypass.helper.ts
      - nexacore-api/src/common/interceptors/tenant-context.interceptor.ts
      - nexacore-api/src/common/interceptors/tests/audit-bypass.helper.spec.ts
      - nexacore-api/src/common/interceptors/tests/tenant-context.interceptor.spec.ts
      - nexacore-api/src/prisma/prisma.module.ts
      - nexacore-api/src/prisma/prisma.service.ts
      - nexacore-api/src/prisma/tenant-filter.extension.ts
      - nexacore-api/src/prisma/tests/tenant-filter.extension.spec.ts
      - nexacore-api/src/tenants/tenants.service.ts
      - nexacore-api/src/tenants/tests/tenants.service.spec.ts
  - hash: c88fa88
    message: "SCRUM-488: Prisma tenant-filter middleware (AUTH v2 Phase 0.2) (#327)"
    files:
      - nexacore-api/prisma/migrations/20260519105759_add_tenant_filter_bypass_audit_action/migration.sql
      - nexacore-api/prisma/schema.prisma
      - nexacore-api/src/app.module.ts
      - nexacore-api/src/audit/enums/audit-action.enum.ts
      - nexacore-api/src/common/constants/error-messages.ts
      - nexacore-api/src/common/context/scoped-models.ts
      - nexacore-api/src/common/context/tenant-context.errors.ts
      - nexacore-api/src/common/context/tenant-context.ts
      - nexacore-api/src/common/context/tests/tenant-context.errors.spec.ts
      - nexacore-api/src/common/context/tests/tenant-context.spec.ts
      - nexacore-api/src/common/interceptors/audit-bypass.helper.ts
      - nexacore-api/src/common/interceptors/tenant-context.interceptor.ts
      - nexacore-api/src/common/interceptors/tests/audit-bypass.helper.spec.ts
      - nexacore-api/src/common/interceptors/tests/tenant-context.interceptor.spec.ts
      - nexacore-api/src/prisma/prisma.module.ts
      - nexacore-api/src/prisma/prisma.service.ts
      - nexacore-api/src/prisma/tenant-filter.extension.ts
      - nexacore-api/src/prisma/tests/tenant-filter.extension.spec.ts
      - nexacore-api/src/tenants/tenants.service.ts
      - nexacore-api/src/tenants/tests/tenants.service.spec.ts
---

# Implementation Record: SCRUM-488 Prisma Tenant-Filter Middleware (AUTH v2 Phase 0.2)

## Summary

Phase 0.2 of the AUTH v2 + Tenancy v1 program. Ships the **non-negotiable defense-in-depth** primitive for multi-tenancy defined in program doc §2.4: every Prisma query against a registered scoped model is automatically constrained to the current tenant via a Prisma Client Extension; the active tenant comes from an `AsyncLocalStorage` slot populated by a global NestJS interceptor; opting out requires an explicit scope-based `runWithBypass(reason, fn)` audited at the decision site (interceptor / `auditAndRunBypass` helper), not at the query site.

- **Scope**: backend
- **Branch**: `feature/SCRUM-488-tenants-backend` (deleted after merge)
- **Date**: 2026-05-19 (single-session implementation + verify + merge)
- **CI outcome**: **one-shot green** — all 12 checks pass on first push (no admin override required; the +94 tests organically pushed line coverage above the 90% threshold that SCRUM-487 could not clear).

## Plan Reference

- **Plan**: `ai-specs/changes/tenants/plans/Sprint 15/SCRUM-488_backend.md`
- **Verify**: `ai-specs/changes/tenants/plans/Sprint 15/SCRUM-488_verify.md` (verdict **PASS**, 1 Accepted-Trivial deviation)
- **Plan followed**: Yes — all 11 plan steps DONE or DONE-DEVIATED (Trivial). Documentation step (N+1) deferred-by-design to this record per plan.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `3859404` | SCRUM-488: Prisma tenant-filter middleware (AUTH v2 Phase 0.2) | 20 files: 6 NEW src files + 5 NEW specs + 1 NEW migration + 5 MOD src files + 1 MOD spec + schema.prisma |
| `c88fa88` | SCRUM-488: Prisma tenant-filter middleware (AUTH v2 Phase 0.2) (#327) | Squash-merge commit on `main` (one-shot CI green — no admin override) |

## Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 4 | Closure body inside `Prisma.defineExtension({ query: { $allModels: { $allOperations } } })` callback | Extracted `handleTenantFilteredQuery(input)` as a separately-exported pure function; `$allOperations` callback now delegates to it | `Prisma.defineExtension` returns an opaque wrapper in Prisma 7 (function-shaped, not inspectable). Unit-testing the closure required this extraction. Behavior unchanged; tests stronger. | Accepted-Trivial | — |

Total deviations: 1 (Accepted-Trivial only). Zero Accepted-Quality, Accepted-Risk, Deferred, Pre-existing, or Scope-Gap.

## Test Results

| Suite | Result | Notes |
|-------|--------|-------|
| Backend jest (full project) | **1165/1165 pass**, 77 suites, 0 failures | +94 net new over the 1071 baseline (SCRUM-487 left it at 1071). |
| `nest build` | Exit 0 | Clean — no DI, no TS errors. |
| ESLint on all 11 touched files | Clean after `--fix` + 5 manual `void` operators for intentional ALS-scope returns | — |
| Migration smoke | `prisma migrate status` → "Database schema is up to date!" (25 migrations) | New enum value `TENANT_FILTER_BYPASS` reflected in generated client. |
| CI Layer 1 (Secrets) | PASS | — |
| CI Layer 2 (Deps — api + dashboard) | PASS | — |
| CI Layer 3 (SAST — backend + frontend) | PASS | — |
| CI Layer 4 (Backend Tests) | **PASS** | **Pre-existing 89.85% < 90% line threshold cleared organically** by +94 high-leverage tests on heavily-testable infra. No admin override needed. |
| CI Layer 4 (Frontend Tests) | PASS | — |
| CI Layer 5 (Build — backend + frontend) | PASS | — |
| CI Security Gate (All Checks) | PASS | — |

### Manual verification

| Scenario | Result |
|----------|--------|
| Migration applied to dev DB | Verified — `prisma migrate deploy` succeeded; status clean |
| TenantContext propagation across `await` + RxJS | Verified by `tenant-context.spec.ts` + `tenant-context.interceptor.spec.ts` |
| Scoped-model + active context injects `tenantId` | Verified by `handleTenantFilteredQuery` suite |
| Cross-tenant manual `where.tenantId` mismatch throws | Verified by `injectTenantId` suite (each of 10 read ops) |
| Bypass scope skips filter | Verified by extension spec |
| Unauthenticated request runs in bypass without audit | Verified by interceptor spec |

## Bugs Found

No bugs found during implementation. The single deviation is purely a testability refactor (Accepted-Trivial).

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | (Part 2 of this record) Added TenantContextInterceptor to Global Interceptors; updated PrismaModule note about factory provider + `OnApplicationShutdown` lifecycle; extended Service Dependency Chains for TenantsService + new method `findFirstActiveMembership`; added 2026-05-19 changelog row for SCRUM-488. |
| `ai-specs/specs/data-model.md` | (Part 3) Added `TENANT_FILTER_BYPASS` to the `AuditAction [IMPLEMENTED]` enum table with rationale + SCRUM-488 origin note. |
| `ai-specs/changes/auth/programs/AUTH-v2.md` | (Part 3) §6 Current Phase State: Phase 0.2 marked **complete**; Phase 0.3 (HTTP surface) surfaced as next milestone. |
| `ai-specs/specs/api-spec.yml` | **No change** — no HTTP endpoints introduced in Phase 0.2 (per plan; surface is internal-only). |

## Lessons Learned

- **One-shot CI green is achievable when the test surface is dense.** SCRUM-487 needed an admin override for the same Layer 4 gate; SCRUM-488 cleared it organically because the infrastructure shipped (`TenantContext`, `injectTenantId`, the extension's inner handler, the interceptor) is heavily branch-rich and fully unit-testable. Lesson for the program: prefer ticket sequencing that lands testable-infrastructure tickets BEFORE coverage debt becomes structurally blocking.
- **Prisma 7 Client Extensions are testable, but only if you extract.** `Prisma.defineExtension` returns an opaque function wrapper; the closure inside cannot be exercised directly. Refactor: lift the body into a named pure function and have the closure delegate. We will reuse this pattern in any future extensions (audit log redaction, soft-delete, etc.).
- **The `useFactory` provider pattern for PrismaModule is consumer-transparent.** No consumer of `PrismaService` needed updating — the 13 production importers and 7 spec mocks all compile and pass unchanged. The class declaration stays as a type+token shell while NestJS resolves to the factory-produced extended client. Trade-off: `onModuleDestroy` on the class no longer fires (factory bypasses class instantiation); `OnApplicationShutdown` on the module owns disconnect.
- **Bypass-on-decision (D-G) beats bypass-as-arg.** Auditing at the `runWithBypass` entry site keeps the Prisma extension free of DI cycles and gives semantically correct audit records (one entry per decision, not one entry per derived query). Worth promoting to a generic "audit at the decision boundary, not the effect boundary" principle for future privilege-elevation primitives.
- **AsyncLocalStorage > NestJS REQUEST-scope.** Avoiding REQUEST-scope cascade preserved the singleton perf profile (115 service classes in NexaCore — would have cascaded heavily). ALS is a one-line cost and propagates across `await`, RxJS pipelines, and `setImmediate` without any runtime hooks.

## Recommended Follow-ups

- **AUTH v2 Phase 0.3 — Tenant HTTP surface (controllers + invitations flow)** (priority=HIGH, module=tenants, type=feature) — natural next phase. Ship `TenantsController` (CRUD over the Tenant entity), `TenantInvitationsController` (create / accept / revoke / expire flows), and the `/tenant/switch` endpoint. Will exercise the middleware in production for the first time.
- **AUTH v2 Phase 1 — Token Engine v2 (JWT v2 payload)** (priority=HIGH, module=auth, type=feature) — replace the per-request membership lookup in the interceptor with a JWT payload read; carries `tenantId`, `tenantRole`, `isPlatformAdmin`. Eliminates one DB hit per authenticated request.
- **Postgres RLS evaluation as defense-in-depth** (priority=MEDIUM, module=tenants, type=feature) — evaluate per `program doc §2.4`. The Prisma extension is the application-layer guarantee; RLS would add a database-layer guarantee that fails closed even if the extension is bypassed (e.g. raw SQL). Worth scoping after Phase 1.
- **TENANT_FILTER_BYPASS audit log alerting** (priority=MEDIUM, module=audit, type=feature) — any production `auditAndRunBypass` call should fire a SecOps signal (Slack / PagerDuty / email). Today the audit row lives in the table; nobody watches it. Land this before Phase 1 introduces the first production bypass paths (platform-admin endpoints).
- **Mutation tests for `injectTenantId`** (priority=LOW, module=tenants, type=test) — current unit tests cover happy + violation paths exhaustively but rely on input/output equality. A Stryker-style mutation pass would harden the boundary against silent regressions when adding new operations to the registry.

## Rollback Playbook

### 12.1 Trigger conditions

- Production p95 latency on authenticated endpoints rises >50ms after deploy (one extra DB hit per request becomes visible).
- Error rate on any tenant-scoped Prisma operation rises >0.5% with `TenantContextMissingError` or `CrossTenantViolationError` in logs (indicates a code path is hitting the Prisma extension without going through the interceptor — bug, not legitimate use case).
- 403 `ForbiddenException` rate rises on previously-200 endpoints (indicates `findFirstActiveMembership` returning null where it shouldn't — bootstrap migration corruption or membership-deactivation bug).

### 12.2 Rollback steps (in execution order)

1. **Revert merge commit**: `git revert -m 1 c88fa88` to a hotfix branch from `main`, then merge.
2. **Migration handling**:
   - Enum-extension migration is **forward-only and additive**. No code references `TENANT_FILTER_BYPASS` after the revert (the extension + helper are gone), so the value sits dormant in the enum. Safe to leave in place. To physically remove (NOT recommended unless paranoid):
     ```sql
     -- Postgres does not support DROP VALUE from an enum directly.
     -- Workaround: rename + recreate the enum. Heavy, avoid unless required.
     ```
   - The bootstrap migration from SCRUM-487 is untouched by this rollback.
3. **Cache/state cleanup**:
   - No Redis keys or in-memory caches owned by Phase 0.2 to clear.
   - In-flight requests may hold ALS slots; they drain naturally on completion.
4. **External provider state**: None.
5. **Verification**:
   - `curl -H "Authorization: Bearer <valid-token>" https://<api>/auth/me` returns 200 (interceptor gone; original behavior restored).
   - `nest build` clean post-revert.
   - jest 1071/1071 pass (back to pre-SCRUM-488 baseline).

### 12.3 Estimated rollback time

- Happy path (revert + redeploy): ~5 minutes (CI Layer 1-5 must complete on the revert branch).
- No DB rollback required (additive enum + no schema columns added).

### 12.4 Known risks of rollback

**None.** The change is purely additive at the schema level + a new request-pipeline component. Reverting removes the component cleanly. No customer-visible state was created. No client code outside NexaCore depends on the new error responses (interceptor's `ForbiddenException` would simply not happen post-revert; affected users see their original behavior).
