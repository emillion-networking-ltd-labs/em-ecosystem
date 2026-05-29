---
schema: ai-specs/schemas/record.schema.yml
ticket: SCRUM-489
sprint: Sprint 15
scope: backend
module: auth
date: 2026-05-19
branch: feature/SCRUM-489-auth-backend
plan_path: ai-specs/changes/auth/plans/Sprint 15/SCRUM-489_backend.md
verify_path: ai-specs/changes/auth/plans/Sprint 15/SCRUM-489_verify.md
is_audit_fix: false
plan_followed: "yes"
pr: 328
merge_commit: b906ed0a1e3749a588bc91ccf023013bb673456a
framework_version: 0.15.0
commits:
  - hash: "868bb79"
    message: "SCRUM-489: User.isPlatformAdmin + Role refactor (AUTH v2 Phase 0.3)"
    files:
      - nexacore-api/prisma/migrations/20260519115702_user_platform_admin/migration.sql
      - nexacore-api/prisma/schema.prisma
      - nexacore-api/src/auth/guards/permissions.guard.ts
      - nexacore-api/src/auth/guards/roles.guard.ts
      - nexacore-api/src/auth/tests/permissions.guard.spec.ts
      - nexacore-api/src/auth/tests/roles.guard.spec.ts
      - nexacore-api/src/users/entities/user.entity.ts
      - nexacore-api/src/users/tests/platform-admin.spec.ts
      - nexacore-api/src/users/tests/users.service.spec.ts
      - nexacore-api/src/users/users.controller.ts
      - nexacore-api/src/users/users.service.ts
  - hash: b906ed0
    message: "SCRUM-489: User.isPlatformAdmin + Role refactor (AUTH v2 Phase 0.3) (#328)"
    files:
      - nexacore-api/prisma/migrations/20260519115702_user_platform_admin/migration.sql
      - nexacore-api/prisma/schema.prisma
      - nexacore-api/src/auth/guards/permissions.guard.ts
      - nexacore-api/src/auth/guards/roles.guard.ts
      - nexacore-api/src/auth/tests/permissions.guard.spec.ts
      - nexacore-api/src/auth/tests/roles.guard.spec.ts
      - nexacore-api/src/users/entities/user.entity.ts
      - nexacore-api/src/users/tests/platform-admin.spec.ts
      - nexacore-api/src/users/tests/users.service.spec.ts
      - nexacore-api/src/users/users.controller.ts
      - nexacore-api/src/users/users.service.ts
---

# Implementation Record: SCRUM-489 User.isPlatformAdmin + Role Refactor (AUTH v2 Phase 0.3)

## Summary

AUTH v2 Phase 0.3 — final ticket of Phase 0. Splits the conflated `Role.SUPERADMIN` enum value into two distinct primitives: a new `User.isPlatformAdmin: boolean` flag carrying cross-tenant capability semantics, and the existing `User.role` enum kept transitional for tenant-scoped Role-enum machinery. Mitigates program doc §8 risk MT-4 ("Role global = god-mode cross-tenant"). 6 capability call sites migrate to the new flag; 6 role-machinery / tenant-scoped sites stay on `user.role` until Phase 1 retires it after JWT v2.

- **Scope**: backend
- **Branch**: `feature/SCRUM-489-auth-backend` (deleted after merge)
- **Date**: 2026-05-19 (single-session implementation + verify + merge)
- **CI outcome**: **one-shot green** — all 12 checks PASS on first push. Third consecutive one-shot green for the AUTH v2 Phase 0 sequence (SCRUM-488 + SCRUM-489 both clean; SCRUM-487 needed admin override for pre-existing coverage debt).

## Plan Reference

- **Plan**: `ai-specs/changes/auth/plans/Sprint 15/SCRUM-489_backend.md`
- **Verify**: `ai-specs/changes/auth/plans/Sprint 15/SCRUM-489_verify.md` (verdict **PASS**, **0 deviations**)
- **Plan followed**: Yes — all 7 in-scope plan steps DONE step-for-step (Step 0 branch → Step 7 quality gates). Documentation step N+1 deferred-by-design to this record.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `868bb79` | SCRUM-489: User.isPlatformAdmin + Role refactor (AUTH v2 Phase 0.3) | 11 files: schema.prisma, 1 migration, user.entity.ts, roles.guard.ts, permissions.guard.ts, users.service.ts, users.controller.ts, 3 spec MODs, 1 spec NEW (platform-admin.spec.ts) |
| `b906ed0` | SCRUM-489: User.isPlatformAdmin + Role refactor (AUTH v2 Phase 0.3) (#328) | Squash-merge commit on `main` |

## Deviations from Plan

**Implementation followed the plan exactly.** Zero deviations across all categories.

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|

No rows. Verified by `/verify` step 2 + grep gate at `/develop` step 7: exactly 1 live `Role.SUPERADMIN` production reference in capability-relevant files (the L804 enum-pathway KEEP per D-D), all other call sites migrated.

## Test Results

| Suite | Result | Notes |
|-------|--------|-------|
| Backend jest (full project) | **1174/1174 pass**, 78 suites, 0 failures | +9 net new over the 1165 baseline (SCRUM-488 left it at 1165). |
| New spec `platform-admin.spec.ts` | 9/9 pass | Default-false on construction + `toSafeUser` propagation (true / false / role-independence) + migration backfill invariant (shape-level) + capability-vs-role boundary (4 cases). |
| `roles.guard.spec.ts` (MOD) | 4 bypass tests updated + pass | Mocks switched to `{role: SUPERADMIN, isPlatformAdmin: true}`. `SUPERADMIN_BYPASS` audit log assertion unchanged (enum value preserved per D-G). |
| `permissions.guard.spec.ts` (MOD) | 1 bypass test updated + pass | Same pattern. |
| `users.service.spec.ts` (MOD) | 3 SUPERADMIN target tests updated; 1 NEW boundary test ("role=SUPERADMIN + isPlatformAdmin=false → modification ALLOWED") | The boundary test is the forward-compatibility proof: capability gates, not legacy role. |
| `nest build` | Exit 0 | — |
| ESLint on all 9 touched files | Clean after `--fix` (5 Prettier formatting auto-fixed) | — |
| Migration smoke | `prisma migrate status` → "up to date" (26 migrations) | Same-transaction ADD COLUMN + UPDATE backfill applied cleanly. |
| CI Layer 1 (Secrets) | PASS | — |
| CI Layer 2 (Deps — api + dashboard) | PASS | — |
| CI Layer 3 (SAST — backend + frontend) | PASS | — |
| CI Layer 4 (Backend Tests) | **PASS** | Coverage cleared the 90% line threshold organically — second consecutive one-shot green. |
| CI Layer 4 (Frontend Tests) | PASS | — |
| CI Layer 5 (Build — backend + frontend) | PASS | — |
| CI Security Gate (All Checks) | PASS | — |

### Manual verification

| Scenario | Result |
|----------|--------|
| Migration applied to dev DB | Verified — `prisma migrate deploy` succeeded; status clean; backfill `UPDATE` ran in same transaction as `ADD COLUMN` |
| Capability-gate semantics | Verified by `roles.guard.spec.ts` + `permissions.guard.spec.ts` (bypass fires on `isPlatformAdmin: true`) |
| Forward boundary semantics | Verified by NEW boundary test in `users.service.spec.ts` (capability gates, not role) |
| Grep gate | Exactly 1 live `Role.SUPERADMIN` reference in capability-relevant production files (L804 enum-pathway KEEP per D-D) |
| Type widening propagated correctly | Verified by `nest build` clean — `adminUpdateUser` signature widened + `users.controller` request-user union widened |

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | (Part 2 of this record) Guard Dependency Map updated — RolesGuard + PermissionsGuard bypass triggers on `User.isPlatformAdmin`, not legacy `Role.SUPERADMIN`. `adminUpdateUser` parameter shape widened. 2026-05-19 changelog row for SCRUM-489. |
| `ai-specs/specs/data-model.md` | (Part 3) User entity gains `isPlatformAdmin: boolean` field. `SUPERADMIN_BYPASS` AuditAction description refined to clarify the trigger criterion moved from legacy role to capability flag while the enum value name stays for log-history compatibility. |
| `ai-specs/changes/auth/programs/AUTH-v2.md` | (Part 3) §6 Current Phase State — Phase 0.3 marked **complete**; corrected the description from the SCRUM-488 misprediction ("Tenant API surface") to the actual scope ("User.isPlatformAdmin + Role refactor"). Surfaced a placeholder for the HTTP-surface follow-up (no Jira ticket yet). **Phase 0 marked COMPLETE** as a milestone. |
| `ai-specs/specs/api-spec.yml` | **No change** — zero HTTP endpoints introduced or modified. |

## Lessons Learned

- **Capability-vs-role split is a 12-line refactor, not a 1200-line one.** The conflated `Role.SUPERADMIN` semantic carried two distinct concepts; once they were separated at the boundary (interface + entity + migration), the 12 call sites split cleanly into 6 capability gates and 6 role-machinery gates. The decision tree (D-D) made every site's disposition self-evident.
- **Preserve audit-log enum values across semantic refactors.** Renaming `SUPERADMIN_BYPASS` to `PLATFORM_ADMIN_BYPASS` would have been more accurate to the new trigger criterion but would have broken historical log queries (Postgres enum value rename is brittle). Keep the name, document the semantic shift in `data-model.md`. This is a general principle worth promoting for any future "rename an existing audit action to reflect new semantics" temptation.
- **Grep gates make semantic refactors mechanically verifiable.** The "exactly 1 live `Role.SUPERADMIN` production reference" gate at `/develop` step 7 + `/verify` step 4e gives an objective mechanical pass/fail. Future refactors of this shape (split a conflated concept into two distinct ones) should declare their grep gate at `/plan` time as part of the acceptance criteria.
- **Forward-compatibility tests guard against silent re-conflation.** The NEW boundary test ("role=SUPERADMIN + isPlatformAdmin=false → modification ALLOWED") doesn't exercise a current production path — every existing SUPERADMIN has `isPlatformAdmin=true` post-backfill. But it asserts the contract for the post-Phase-1 world where the legacy role enum value may persist on some users while capability has been revoked. Without this test, a future code change that "helpfully" adds `|| user.role === Role.SUPERADMIN` to a guard's bypass condition would silently re-conflate the concepts. The test catches it.
- **Phase 0 is feasible in a single day with disciplined sequencing.** SCRUM-487 (Phase 0.1) + SCRUM-488 (Phase 0.2) + SCRUM-489 (Phase 0.3) all merged on 2026-05-19. The combination of (a) tight ticket scope, (b) plan-time CI gate anticipation, and (c) `/verify` mechanical gates produced 2 consecutive one-shot CI greens after the initial coverage-debt overhead on SCRUM-487. Worth documenting as the operating model for future multi-phase programs.

## Recommended Follow-ups

- **AUTH v2 Phase 1 — Token Engine v2 (JWT v2 payload)** (priority=HIGH, module=auth, type=feature) — natural next phase. JWT payload gains `tenantId`, `tenantRole`, `isPlatformAdmin` per program doc §2.3. Eliminates the per-request DB hit in `TenantContextInterceptor` (membership lookup) and the per-request DB hit in this ticket's bypass paths (`req.user.isPlatformAdmin` becomes a payload read). RolesGuard + PermissionsGuard contracts stay; only the type union source changes.
- **Tenant HTTP surface — TenantsController + InvitationsService + `/tenant/switch`** (priority=HIGH, module=tenants, type=feature) — Phase 0.4 (or 1.x). Previously mislabeled as Phase 0.3 in AUTH-v2.md §6 (corrected by this record's `/update-docs`). First production exercise of the SCRUM-488 middleware end-to-end through the HTTP layer; ships the `acceptInvitation`, `createInvitation`, `revokeInvitation`, `expireInvitation`, `listMembers`, `switchTenant` flows. No Jira ticket exists yet — operator decision on when to create.
- **Phase 1 audit-action enum rename evaluation** (priority=LOW, module=audit, type=tech-debt) — once Phase 1 retires the legacy `Role.SUPERADMIN` enum value, evaluate whether the `SUPERADMIN_BYPASS` audit action should also be renamed to `PLATFORM_ADMIN_BYPASS` for full semantic consistency. Decision involves the cost of breaking historical log queries vs. the clarity gain. Document the decision in an ADR.
- **Cross-tenant alerting in `suspicious-login.service.ts`** (priority=MEDIUM, module=security, type=feature) — today the alert query is `role: { in: [ADMIN, SUPERADMIN] }`. Once Phase 1 retires `SUPERADMIN`, this query naturally migrates to include `OR isPlatformAdmin = true` to notify platform admins of cross-tenant suspicious activity. Worth a small follow-up when the legacy role is removed.
- **ESLint rule: forbid `user.role === Role.SUPERADMIN` in capability-decision sites** (priority=LOW, module=auth, type=tech-debt) — would mechanically prevent re-conflation. Complex to scope correctly (must whitelist the enum-pathway gate at `users.service.ts:804` and the role-machinery sites in `permissions.service.ts`). Lower priority than Phase 1 since Phase 1 retires the enum value entirely.

## Rollback Playbook

### 12.1 Trigger conditions

- Authentication failures spike on the `/users` admin endpoints (suggests the `adminUpdateUser` parameter widening type contract broke a consumer).
- 403 `ForbiddenException` rate rises on endpoints previously serving SUPERADMIN users (suggests `isPlatformAdmin` is not being populated correctly somewhere in the chain — e.g. `toSafeUser` missing the new line OR JwtStrategy returning a stale shape).
- `SUPERADMIN_BYPASS` audit log frequency drops to zero (suggests the bypass condition is no longer triggering — the post-migration backfill may not have set `isPlatformAdmin=true` for legitimate SUPERADMIN users).

### 12.2 Rollback steps (in execution order)

1. **Revert merge commit**: `git revert -m 1 b906ed0` to a hotfix branch from `main`, then merge.
2. **Migration handling**:
   - The schema migration is **additive** (`ADD COLUMN ... DEFAULT false` + `UPDATE ... WHERE role = 'SUPERADMIN'`). The column can stay dormant after the code revert — no code references `isPlatformAdmin` after the revert. To physically remove (optional, NOT recommended):
     ```sql
     ALTER TABLE "users" DROP COLUMN "isPlatformAdmin";
     ```
     This destroys the backfill data — irreversible. Leave the column in place unless paranoid.
   - **DO NOT revert the backfill UPDATE.** The data sits idle but does no harm; reverting would require a second-pass UPDATE keyed on `role`, which we already have. Skip.
3. **Cache/state cleanup**:
   - In-memory caches: none. The `User` entity is fetched fresh on every JWT validation.
   - Redis: no keys owned by this ticket. The TokenDenyList + OAuth state stores are untouched.
4. **External provider state**: None.
5. **Verification**:
   - `nest build` clean post-revert.
   - `npx jest --maxWorkers=1 --forceExit` — should drop back to 1165/1165 (the +9 new tests revert with the spec files).
   - Smoke E2E: hit `GET /auth/me` with a SUPERADMIN JWT → response succeeds with role=SUPERADMIN; hit `GET /admin` → bypass fires via legacy `role === SUPERADMIN` path.

### 12.3 Estimated rollback time

- Happy path (revert + redeploy): ~5 minutes (CI Layer 1-5 must run on the revert branch).
- Schema cleanup (DROP COLUMN, NOT recommended): +1 minute manual DB op + verification.

### 12.4 Known risks of rollback

**None.** Reverting takes the system back to the pre-SCRUM-489 behavior — bypass on legacy `role === Role.SUPERADMIN`. No customer-visible state was created. No external consumer reads `isPlatformAdmin` (Phase 1 work). The frontend dashboard would lose access to the new field in `/auth/me` responses, but the dashboard does not yet read it.
