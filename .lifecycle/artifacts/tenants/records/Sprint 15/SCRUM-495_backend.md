---
schema: ai-specs/schemas/record.schema.yml
ticket: SCRUM-495
sprint: Sprint 15
scope: backend
module: tenants
date: 2026-05-21
branch: feature/SCRUM-495-tenants-backend
plan_path: ai-specs/changes/tenants/plans/Sprint 15/SCRUM-495_backend.md
verify_path: ai-specs/changes/tenants/plans/Sprint 15/SCRUM-495_verify.md
commits:
  - hash: ee3f1ca
    message: "SCRUM-495: AUTH v2 Phase 2.1 — Organization model + SubdomainTenantResolverMiddleware (D-007 + D-008 batched) (#334)"
pr: 334
merge_commit: ee3f1ca
is_audit_fix: false
plan_followed: "yes"
framework_version: 0.15.0
---

# Implementation Record: SCRUM-495 AUTH v2 Phase 2.1 — `Organization` model + `SubdomainTenantResolverMiddleware`

## Summary

First sub-phase of Phase 2 of the AUTH v2 + Tenancy v1 program. Batched D-007 (separate `Organization` from `Tenant`) and D-008 (subdomain → tenant binding at request boundary) per ORCH-DRAFT-001 Q8. Ships in one squash-merge.

- **Scope**: `backend`
- **Branch**: `feature/SCRUM-495-tenants-backend`
- **Implementation date**: 2026-05-21
- **Merge**: PR [#334](https://github.com/emillionnetworking-ltd-labs/em-ecosystem/pull/334), squash commit `ee3f1ca` on main.

## Plan Reference

- Plan: [`ai-specs/changes/tenants/plans/Sprint 15/SCRUM-495_backend.md`](../plans/Sprint%2015/SCRUM-495_backend.md) (schema-validated PASS).
- Verify report: [`ai-specs/changes/tenants/plans/Sprint 15/SCRUM-495_verify.md`](../plans/Sprint%2015/SCRUM-495_verify.md) (verdict **PASS · 3 Accepted-Trivial · schema-validated**).
- **Plan was followed**: **Yes** — all 13 steps DONE; 3 DONE-DEVIATED classified Accepted-Trivial in `/verify` (no design deviations, no scope gaps).

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `ee3f1ca` | SCRUM-495: AUTH v2 Phase 2.1 — Organization model + SubdomainTenantResolverMiddleware (D-007 + D-008 batched) (#334) | 20 files (+2001 / −105). 10 NEW production files + spec files + 6 MOD. See plan §2 for full blast-radius. |

(Single squash commit — feature branch had 1 working commit before merge.)

## Deviations from Plan

Imported from `/verify`'s classifications (per `/update-docs` Part 5 step 13 — do NOT reclassify):

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 1 | Add 4 new `AuditAction` enum values to `schema.prisma` + TS mirror + migration SQL | First pass added them to TS mirror + migration SQL `ALTER TYPE` only; `prisma generate` then errored in `audit.service.ts` (Prisma-generated `AuditAction` union missing the new members) | Prisma enum values require the enum block in `schema.prisma` in addition to migration SQL — single-line edit, no design impact | Accepted-Trivial | — |
| 11e | `tenants.service.spec.ts` MOD to assert default-org row | Also required adding `organization.create` to mocked Prisma object + `subdomain` field to `makeTenant()` fixture factory | Mock-plumbing follow-on for the new `$transaction` namespace; not a behavior deviation | Accepted-Trivial | — |
| 12 | Build + lint + jest verification | ESLint flagged 1 prettier trailing-comma in `tenants.service.spec.ts:131`; auto-fixed by `eslint --fix` | Standard prettier formatting | Accepted-Trivial | — |

## Test Results

- **Overall coverage**: 91.03% statements / 91.03% lines / 81.12% branches / 88.05% functions
- **Unit tests**: **1357 passed / 0 failed** (37 net new on 1320 baseline)
- **Integration tests**: covered by the same jest run (TenantsModule integration spec passing unchanged)
- **Manual verification**: not performed — backend-only ticket with full unit coverage; e2e suite defaults to `Host: localhost` which exercises the middleware's skip-path branch
- **Tests skipped**: none

Per-file coverage on new + modified files:

| File | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| `organizations.service.ts` | 97.24% | 79.16% | 100% | 97.24% |
| `subdomain-tenant-resolver.middleware.ts` | 94.24% | 72.72% | 100% | 94.24% |
| `organizations.controller.ts` | 99.06% | 31.57% | 100% | 99.06% |
| `tenant-context.interceptor.ts` (rewritten) | 100% | 92% | 77.77% | 100% |

Coverage margin observation: global shrunk from main baseline 91.29% to 91.03% (−0.26 pp) due to deliberately-unasserted LRU/TTL/rate-limit branches in the new middleware. Margin to threshold +1.03 pp. Documented as observation in verify report, not a deviation.

## Bugs Found

No bugs found during implementation. The implementation surfaced one design conflict at `/plan` time (Open Decision #6 — middleware vs interceptor scope-nesting), which was resolved by the validator-not-binder rewrite. That is documented as a planned behavior change in the plan + verify report, not a bug discovered during development.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Header bump (Last update SCRUM-495, 2026-05-21, coverage 91.03%). TenantsModule row updated with new providers/middleware/controller. NEW row: Controller Guard Chains → OrganizationsController. Global Interceptors → TenantContextInterceptor entry rewritten for 2-dep validator-not-binder semantics. Test Mock Requirements → 4 new rows (OrganizationsController/OrganizationsService/SubdomainTenantResolverMiddleware/TenantContextInterceptor). Service Dependency Chains → 4 new entries (OrganizationsService, SubdomainTenantResolverMiddleware, TenantContextInterceptor v2, TenantsService.findBySubdomain). Changelog → new row for SCRUM-495. |
| `ai-specs/specs/api-spec.yml` | NEW `Organizations` tag. 4 new paths: `GET /tenants/{tenantId}/organizations`, `GET /tenants/{tenantId}/organizations/{orgId}`, `POST /tenants/{tenantId}/organizations`, `POST /organizations/{orgId}/members`. |
| `ai-specs/specs/data-model.md` | NEW entities: `Organization` (§26) + `OrganizationMembership` (§27). NEW enum `OrganizationRole`. UPDATED `Tenant` (§22) with `subdomain` field. UPDATED `AuditLog` (§3) with `organizationId` nullable field. UPDATED `AuditAction` enum with 4 new values (ORGANIZATION_CREATED, ORGANIZATION_MEMBER_ADDED, ORGANIZATION_MEMBER_REMOVED, SUBDOMAIN_RESOLUTION_FAILED). |
| `ai-specs/changes/auth/programs/AUTH-v2.md` | §6 Phase 2.1 row marked **complete** with merge commit + PR + verify outcome. |

## Lessons Learned

**What went well**:
- The validator-not-binder rewrite of `TenantContextInterceptor` (Open Decision #6) was identified at `/plan` time, not at `/develop` time. This avoided a costly `AsyncLocalStorage` scope-nesting bug that would have shadowed the middleware's subdomain binding. Lesson reinforced: when introducing a new request-boundary primitive, audit every existing interceptor/guard that touches the same context.
- Reserved-subdomain collision pre-check (Open Decision #3) returned 0 rows on the dev DB — proceeded with no manual rename steps in the migration. The pre-check itself cost ~2 minutes and would have saved hours if it had returned anything.
- One-shot pre-push pass (after one transient `MODULE_NOT_FOUND` from concurrent `npm ci` runs that I had triggered with two simultaneous push attempts — operator error, not framework error).

**What was harder than expected**:
- Prisma enum 3-location pitfall (Accepted-Trivial #1): adding enum values to the migration SQL `ALTER TYPE` and the TS mirror is not enough — the `enum AuditAction { ... }` block in `schema.prisma` MUST also be updated for `prisma generate` to produce a matching TS union. This was a 5-minute cost but a clean reproducer for future plans.
- `tenants.service.spec.ts` mock plumbing (Accepted-Trivial #2): the `$transaction` namespace expansion forced both a new `organization.create` mock AND a `subdomain` field in the tenant fixture. Standard Prisma-mock follow-on; flagged for plan template improvement.

**Recommendations for similar tickets**:
- Prisma schema/migration tickets: write a 3-location checklist into the plan template (`schema.prisma` enum block + migration SQL `ALTER TYPE` + TS mirror enum).
- Tickets that extend an existing `$transaction`: list every namespace touched (Prisma mock must cover all of them) AND verify any fixture factory hydrates the new fields.
- Module-level caches (LRU + TTL) in spec coverage: branches for eviction-at-size and TTL-expiry are easier to verify by inspection than by assertion when the cache is intentionally shared across runs. Per-file coverage will sit a few points below 100% — acceptable.

## Recommended Follow-ups

- **Promote Prisma-enum 3-location rule into `/plan` template** (priority=LOW, module=framework, type=doc) — caught by Accepted-Trivial #1 in this ticket. Adding a one-line checklist item to the Codebase State Snapshot template would prevent regression.
- **Add direct unit tests for `SubdomainTenantResolverMiddleware` LRU eviction + TTL expiry** (priority=LOW, module=tenants, type=test) — currently verified by inspection; per-file coverage at 94.24% vs 95% target. Low priority because the branches are well-understood and the global threshold has comfortable margin.

## Rollback Playbook

### 12.1 Trigger conditions

- p95 latency > 500 ms on any `acme.platform.com` tenant-scoped request (the middleware's LRU cache hot path).
- Error rate > 1% on `/health` or `/metrics` (skip-path regression — middleware should never touch these).
- Regression in `tenants.integration.spec.ts` under jest CI (TenantsService default-org `$transaction` extension may break in environments without prior tenant rows).
- Spike in `SUBDOMAIN_RESOLUTION_FAILED` audit volume — possible reserved-subdomain blocklist misfire or backfilled-subdomain mismatch.
- Cross-tenant data leak observed (defense-in-depth invariant violated: subdomain middleware AND Prisma `$extends` should BOTH have to fail for a leak to occur).

### 12.2 Rollback steps (in execution order)

1. **Revert merge commit on a hotfix branch**:
   ```
   git checkout -b hotfix/revert-scrum-495 main
   git revert -m 1 ee3f1ca
   git push -u origin hotfix/revert-scrum-495
   gh pr create --base main --title "Revert SCRUM-495" --body "Trigger: <symptom>"
   gh pr merge --squash --delete-branch
   ```

2. **Migration `down`** (manual — `prisma migrate resolve` does not auto-down hand-written migrations):
   - Drop `organization_memberships` (FK → organizations, users)
   - Drop `organizations` (FK → tenants)
   - Drop type `OrganizationRole`
   - `ALTER TABLE tenants DROP COLUMN subdomain;` (data loss: backfilled subdomains gone, but `slug` source remains — no critical loss)
   - `ALTER TABLE audit_logs DROP COLUMN organizationId;` (data loss: any new audit rows with non-null `organizationId` lose that metadata)
   - `ALTER TYPE "AuditAction" DROP VALUE 'ORGANIZATION_CREATED', 'ORGANIZATION_MEMBER_ADDED', 'ORGANIZATION_MEMBER_REMOVED', 'SUBDOMAIN_RESOLUTION_FAILED';` (Postgres ≥12; otherwise enum value removal requires recreating the enum)
   - Mark migration as rolled back: `npx prisma migrate resolve --rolled-back 20260521152802_phase_2_1_organization_and_subdomain`

3. **Cache/state cleanup**:
   - In-process LRU cache in `SubdomainTenantResolverMiddleware` — invalidated by process restart (no external cache to flush).
   - No Redis keys to invalidate (cache is in-process per-instance).
   - No OAuth registrations or external state added by this change.

4. **External provider state**:
   - None — no OAuth, no webhooks, no third-party services involved.

5. **Verification**:
   - `curl -fsS https://api.platform.com/health` returns 200.
   - `curl -fsS https://acme.platform.com/health` returns 200 (skip-path still works).
   - Production logs show no `Tenant.subdomain does not exist` errors from Prisma.
   - `git diff main -- src/auth/` is empty (rollback did not touch v1 surface — invariant preserved).

### 12.3 Estimated rollback time

- Happy path (revert only, leave migration in place since DB columns are nullable / forward-compatible additions): **~5 minutes** (CI + deploy of revert PR). Forward-compatibility holds because the revert removes all code references; the new columns and tables become unused but do not break anything.
- Full migration `down` required (only if schema state actively breaks something): **+15 minutes** (manual DB ops + verification). Most cases will NOT need step 2 — the additive nature of the migration means leaving the new tables/columns in place is safe.

### 12.4 Known risks of rollback

- **Default-org rows orphaned**: after `TenantsService.create()` is reverted, any tenant created during the SCRUM-495 deployment window will retain its default `Organization` row but no code path will reference it. Cleanup deferred until next migration; not a customer-visible issue.
- **Audit history continuity**: if step 2 (enum value removal) runs, any audit rows with the 4 new action values become invalid. Mitigation: skip step 2 unless schema state is the cause of the rollback — the enum values are forward-compatible additions.
- **No downstream consumers**: this is a foundational sub-phase. Phase 2.2 (AuthIntent) and Phase 2.3 (Dashboard wiring) have not yet shipped, so no other code or external clients depend on the new endpoints. Safe to roll back without coordination.
