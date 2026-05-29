---
schema: ai-specs/schemas/record.schema.yml
ticket: SCRUM-487
sprint: Sprint 15
scope: backend
module: tenants
date: 2026-05-19
branch: feature/SCRUM-487-tenants-backend
plan_path: ai-specs/changes/tenants/plans/Sprint 15/SCRUM-487_backend.md
verify_path: ai-specs/changes/tenants/plans/Sprint 15/SCRUM-487_verify.md
is_audit_fix: false
plan_followed: "yes"
pr: 326
merge_commit: 1f4aa16b382d59f897acc79db80518b5f1c7c15f
framework_version: 0.15.0
commits:
  - hash: 6eeb396
    message: "SCRUM-487: tenant models + bootstrap migration (AUTH v2 Phase 0.1)"
    files:
      - nexacore-api/prisma/migrations/20260519084738_tenancy_primitives_phase_0/migration.sql
      - nexacore-api/prisma/migrations/20260519084838_bootstrap_default_tenants/migration.sql
      - nexacore-api/prisma/schema.prisma
      - nexacore-api/src/app.module.ts
      - nexacore-api/src/common/constants/error-messages.ts
      - nexacore-api/src/tenants/dto/create-tenant.dto.ts
      - nexacore-api/src/tenants/dto/update-tenant.dto.ts
      - nexacore-api/src/tenants/tenants.module.ts
      - nexacore-api/src/tenants/tenants.service.ts
      - nexacore-api/src/tenants/tests/tenants.service.spec.ts
  - hash: 487d477
    message: "test(SCRUM-487): add DTO validation tests to push coverage above pre-existing threshold"
    files:
      - nexacore-api/src/tenants/tests/tenants.dto.spec.ts
  - hash: 1f4aa16
    message: "[SCRUM-487] Tenant models + bootstrap migration (AUTH v2 Phase 0.1) (#326)"
    files:
      - nexacore-api/prisma/migrations/20260519084738_tenancy_primitives_phase_0/migration.sql
      - nexacore-api/prisma/migrations/20260519084838_bootstrap_default_tenants/migration.sql
      - nexacore-api/prisma/schema.prisma
      - nexacore-api/src/app.module.ts
      - nexacore-api/src/common/constants/error-messages.ts
      - nexacore-api/src/tenants/dto/create-tenant.dto.ts
      - nexacore-api/src/tenants/dto/update-tenant.dto.ts
      - nexacore-api/src/tenants/tenants.module.ts
      - nexacore-api/src/tenants/tenants.service.ts
      - nexacore-api/src/tenants/tests/tenants.dto.spec.ts
      - nexacore-api/src/tenants/tests/tenants.service.spec.ts
---

# Implementation Record: SCRUM-487 Tenant Models + Bootstrap Migration

## Summary

Phase 0.1 of the AUTH v2 + Tenancy v1 program. Introduces the four foundational multi-tenant primitives (`Tenant`, `TenantSettings`, `TenantMembership`, `TenantInvitation`) plus the `TenantStatus` / `TenantRole` / `MembershipStatus` enums, a hand-written structural migration, and a forward-only idempotent bootstrap migration that retro-creates a "Personal Workspace" tenant + OWNER membership for every existing user. The `TenantsService` (4 CRUD methods) is registered as a `@Global()` provider so downstream phases (0.2 → 1 → ...) can inject it without per-module wiring.

- **Scope**: backend
- **Branch**: `feature/SCRUM-487-tenants-backend` (deleted after merge)
- **Date**: 2026-05-19 (single-session implementation + verify + merge)
- **Coverage outcome**: pushed pre-existing main coverage from 89.72% → 89.85% (still 0.15pp below the 90% threshold — see Deviations).

## Plan Reference

- **Plan**: `ai-specs/changes/tenants/plans/Sprint 15/SCRUM-487_backend.md`
- **Verify**: `ai-specs/changes/tenants/plans/Sprint 15/SCRUM-487_verify.md` (verdict **PASS**, 2 Accepted-Trivial deviations imported below)
- **Plan followed**: Yes — all 11 plan steps DONE or DONE-DEVIATED (Trivial). Documentation step (N+1) explicitly deferred-by-design to `/update-docs` per plan.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `6eeb396` | SCRUM-487: tenant models + bootstrap migration (AUTH v2 Phase 0.1) | 10 files: schema.prisma, 2 migrations, src/tenants/** (7), app.module.ts, error-messages.ts |
| `487d477` | test(SCRUM-487): add DTO validation tests to push coverage above pre-existing threshold | `tenants.dto.spec.ts` (NEW, 13 tests, 78 lines) |
| `1f4aa16` | [SCRUM-487] Tenant models + bootstrap migration (AUTH v2 Phase 0.1) (#326) | Squash-merge commit on `main` (admin override — see Deviations §3) |

## Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 0 | Branch from `origin/main` | Branched from local `main` initially (had 3 unpushed operator commits unrelated to SCRUM-487). Operator chose Option A: pushed the 3 commits to origin first, then re-created branch from updated `origin/main` (`fa17777`). | Local `main` had drifted from `origin/main` at the time `/develop` Step 0 ran. | Accepted-Trivial | — |
| 2 | `prisma migrate dev` | Hand-wrote the structural migration SQL byte-equivalent to Prisma's expected output; applied via `prisma migrate deploy` (no shadow DB). | DB user lacks CREATE DATABASE permission → Prisma P3014 blocks shadow-DB creation required by `migrate dev`. | Accepted-Trivial | — |
| /commit-time | CI Layer 4 (Backend Tests) PASS | Layer 4 FAILED on coverage threshold (89.85% < 90% line target). Verified `main` itself is at 89.72% (also failing the same gate) — SCRUM-487 **improved** coverage by +0.13pp. Pre-existing condition; not introduced by this ticket. Operator chose Option A: admin merge override + create follow-up. | Project-wide coverage was below threshold prior to this ticket; `main` cannot pass its own CI gate. | Pre-existing | **[SCRUM-490](https://emillionnetworking-ltd-labs.atlassian.net/browse/SCRUM-490)** (to be created — backend coverage debt sweep) |

Total deviations: 3 (2 Accepted-Trivial imported from `/verify`, 1 Pre-existing surfaced at `/commit`). Zero Scope-Gap, zero Accepted-Risk, zero Accepted-Quality.

## Test Results

| Suite | Result | Notes |
|-------|--------|-------|
| Backend jest (full project) | **1071/1071 pass**, 71 suites, 0 failures | Run as `npx jest --maxWorkers=1 --forceExit` at `/verify` time. |
| Tenants unit tests | **25/25 pass** | 12 in `tenants.service.spec.ts` (all 4 methods × happy + error paths, P2002/P2025 mapping) + 13 in `tenants.dto.spec.ts` (slug regex, max-length, required fields, status enum, PartialType behavior). |
| `nest build` | Exit 0 | Clean — no DI, no TS errors. |
| ESLint on `src/tenants/**` | Clean after auto-fix + 1 manual fix (unused imports `ConflictException`, `NotFoundException` removed from service spec) | — |
| CI Layer 1 (Secrets) | PASS | — |
| CI Layer 2 (Deps — api + dashboard) | PASS | — |
| CI Layer 3 (SAST — backend + frontend) | PASS | — |
| CI Layer 4 (Backend Tests) | **FAIL** (coverage 89.85% < 90%) | Pre-existing — see Deviations. |
| CI Layer 4 (Frontend Tests) | PASS | — |
| CI Layer 5 (Frontend Build) | PASS | — |
| CI Layer 5 (Backend Build) | SKIPPED (gated on Layer 4) | Build itself was green at `/verify` time. |
| Migration smoke (dev DB) | 2 users → 2 tenants → 2 settings → 2 memberships; **0 users without membership** | Bootstrap idempotence verified by LEFT JOIN guards. |

## Bugs Found

No bugs found during implementation. The two deviations recorded above are environmental/technique-level, not behavioral.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Added TenantsModule entry to Module Registry + Service Dependency Chains (Phase 0.1 surface). Added Changelog row for 2026-05-19. |
| `ai-specs/specs/data-model.md` | Added Tenant, TenantSettings, TenantMembership, TenantInvitation entity definitions + TenantStatus / TenantRole / MembershipStatus enums. |
| `ai-specs/changes/auth/programs/AUTH-v2.md` | §6 Current Phase State updated: Phase 0.1 marked COMPLETE; next milestone = Phase 0.2 (tenant-scoped service access middleware + RLS evaluation). |
| `ai-specs/specs/api-spec.yml` | **No change** — no HTTP endpoints introduced in Phase 0.1 (per plan; surface lives entirely as injectable service for now). |

## Lessons Learned

- **Hand-rolled migrations are viable when shadow DB is blocked.** Producing SQL byte-equivalent to Prisma's expected `migrate dev` output, then applying via `migrate deploy`, is a clean fallback when the DB role lacks CREATE DATABASE. Worth keeping the recipe handy for the rest of AUTH v2 / Tenancy v1.
- **Bootstrap migrations should be idempotent from day one.** The three-step `INSERT ... SELECT ... LEFT JOIN ... WHERE m.id IS NULL` pattern makes re-running the migration a no-op, which is critical for environments that get reseeded or for partial-rollback scenarios.
- **Pre-existing CI debt surfaces at the worst moment.** The 89.72% baseline on `main` was hidden until SCRUM-487's PR re-ran the same gate. Adding `tenants.dto.spec.ts` (13 tests, +0.13pp) improved the metric but didn't clear it. Lesson for the program: schedule a coverage-debt sweep **before** Phase 1 ships its first real surface, otherwise every Phase-1 PR will require an admin override.
- **`@Global()` for foundational services pays off.** Avoiding per-module `imports: [TenantsModule]` wiring upstream of the eventual tenant-scoping middleware means the next phases can inject `TenantsService` directly without churn.
- **The state machine kept us honest.** Refusing `/commit` until `/verify` validated with `schema_validated=true` caught the bootstrap idempotence check explicitly, rather than letting it become a "I'll verify it later" item.

## Recommended Follow-ups

- **Backend coverage debt sweep — raise full-project coverage above 90% line / 80% branch thresholds** (priority=HIGH, module=auth, type=tech-debt) — main is currently at 89.72% line; every PR that doesn't add a coverage-net-positive set of tests will require admin override. Tracked as **SCRUM-490** (to be created against current sprint or AUTH v2 Phase 0.x backlog).
- **Tenant invitation flow — controller + service + email send + token validation** (priority=MEDIUM, module=tenants, type=feature) — `TenantInvitation` model is in place but has no service methods yet. Phase 0.x will add the create/accept/expire flow + email integration once the email module's tenant-context helper lands.
- **TenantsService method coverage for `update()` empty-data and `findById` with includes** (priority=LOW, module=tenants, type=test) — currently 12 service tests cover the happy paths + P2002/P2025; edge cases like `update({})` and `findById` with related-record includes are not exercised. Worth adding when the service grows beyond Phase 0.1's minimal CRUD.

## Rollback Playbook

### Trigger conditions

- Bootstrap migration produced unexpected memberships (e.g. duplicate OWNERs, mismatched user→tenant pairing). Detectable by: `SELECT u.id FROM users u LEFT JOIN tenant_memberships m ON m.user_id = u.id WHERE m.id IS NULL` returning > 0 rows.
- Downstream Phase 0.2 work needs to be reverted and the tenant primitives are entangling the rollback.
- `Tenant`, `TenantMembership`, `TenantSettings`, or `TenantInvitation` schema discovered to be wrong shape before any Phase-1 code consumes them (window narrows fast — high-priority rollback signal).

### Rollback steps (in execution order)

1. **Revert merge commit**: `git revert -m 1 1f4aa16` on a hotfix branch from `main`, then merge.
2. **Migration handling**:
   - The bootstrap migration (`20260519084838_bootstrap_default_tenants`) is **forward-only and idempotent**. No `down` SQL is shipped. To roll back data:
     ```sql
     DELETE FROM tenant_memberships;
     DELETE FROM tenant_settings;
     DELETE FROM tenants;
     ```
     Safe because at Phase 0.1 there is no other code reading these tables (zero consumers). NOT safe to run if any Phase 0.2+ code is in production.
   - The structural migration (`20260519084738_tenancy_primitives_phase_0`) can be undone by:
     ```sql
     DROP TABLE tenant_invitations CASCADE;
     DROP TABLE tenant_memberships CASCADE;
     DROP TABLE tenant_settings CASCADE;
     DROP TABLE tenants CASCADE;
     DROP TYPE "TenantStatus";
     DROP TYPE "TenantRole";
     DROP TYPE "MembershipStatus";
     ```
     Then remove the migration folders and the User.memberships reverse relation from `schema.prisma`, and regenerate the Prisma client.
3. **Cache/state cleanup**: None. `TenantsService` is stateless; no Redis keys, no in-memory caches, no external state created by Phase 0.1.
4. **External provider state**: None.
5. **Verification**:
   ```sql
   SELECT COUNT(*) FROM tenants;           -- expect 0 (after data rollback) or err (after structural rollback)
   SELECT COUNT(*) FROM tenant_memberships; -- same
   ```
   Backend: `nest build` clean + `npm test` green after schema.prisma is reverted and Prisma client regenerated.

### Estimated rollback time

- Happy path (data rollback only — Phase 0.1 still wanted but bootstrap was wrong): ~5 minutes (3 DELETE statements + smoke).
- Full structural rollback (revert merge + drop tables + revert schema.prisma): ~15 minutes (CI + manual DB ops + verification).

### Known risks of rollback

**None** at Phase 0.1 — no production data depends on these tables yet, no users see any change in behavior, no API endpoints reference them. The rollback window stays cheap until the first Phase-1 consumer ships.

## Audit Finding Verification

Not applicable. SCRUM-487 is a foundational feature ticket (AUTH v2 Phase 0.1), not an audit remediation ticket. No audit check ID, no "Instances to Fix" table, no grep gate.

(Per `/verify` Step 4f, this section is omitted for non-audit tickets. The record's frontmatter has `is_audit_fix: false`, which the schema honors.)
