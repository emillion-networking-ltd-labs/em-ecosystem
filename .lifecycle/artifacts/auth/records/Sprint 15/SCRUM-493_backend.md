---
schema: ai-specs/schemas/record.schema.yml
ticket: SCRUM-493
sprint: Sprint 15
scope: backend
module: auth
date: 2026-05-19
branch: feature/SCRUM-493-backend
plan_path: ai-specs/changes/auth/plans/Sprint 15/SCRUM-493_backend.md
verify_path: ai-specs/changes/auth/plans/Sprint 15/SCRUM-493_verify.md
is_audit_fix: false
plan_followed: "yes"
pr: 332
merge_commit: 18fd537276b0eaef0e3235021bd7c16c6696ea47
framework_version: 0.15.0
commits:
  - hash: "d0a9a7a"
    message: "SCRUM-493: AUTH v2 Phase 1.2 — opaque refresh tokens + SessionsServiceV2 (tenant-aware)"
    files:
      - nexacore-api/prisma/migrations/20260519202835_session_v2_and_audit_actions/migration.sql
      - nexacore-api/prisma/schema.prisma
      - nexacore-api/src/audit/enums/audit-action.enum.ts
      - nexacore-api/src/sessions/sessions.module.ts
      - nexacore-api/src/sessions/sessions.service.v2.ts
      - nexacore-api/src/sessions/tests/sessions.service.v2.spec.ts
  - hash: "18fd537"
    message: "SCRUM-493: AUTH v2 Phase 1.2 — opaque refresh tokens + SessionsServiceV2 (tenant-aware) (#332)"
    files:
      - nexacore-api/prisma/migrations/20260519202835_session_v2_and_audit_actions/migration.sql
      - nexacore-api/prisma/schema.prisma
      - nexacore-api/src/audit/enums/audit-action.enum.ts
      - nexacore-api/src/sessions/sessions.module.ts
      - nexacore-api/src/sessions/sessions.service.v2.ts
      - nexacore-api/src/sessions/tests/sessions.service.v2.spec.ts
---

# Implementation Record: SCRUM-493 AUTH v2 Phase 1.2 — Opaque Refresh Tokens + `SessionsServiceV2` (tenant-aware)

## Summary

Second sub-phase of Phase 1 of the AUTH v2 + Tenancy v1 program. Builds the REFRESH half of the v2 mint surface (Phase 1.1 / SCRUM-492 shipped the ACCESS half). Strangler-pattern: zero production consumers in this phase; v1 `SessionsService` bit-identical to main. Mitigates **MT-2 (CRITICAL)** by binding every v2 session to a `tenantId` and **MT-10 (MEDIUM)** via tenant-scoped `revokeAllForTenant`. Phase 1.3 wires the first consumer.

- **Scope**: backend
- **Branch**: `feature/SCRUM-493-backend`
- **Implementation date**: 2026-05-19

## Plan Reference

- Plan: `ai-specs/changes/auth/plans/Sprint 15/SCRUM-493_backend.md`
- Verify: `ai-specs/changes/auth/plans/Sprint 15/SCRUM-493_verify.md` (verdict **PASS · 3 Accepted-Trivial · 0 blocking**)
- **Plan was followed**: Yes — all 9 steps executed in order. The 3 Accepted-Trivial deviations were code-correctness or mechanical-step refinements, not behavior changes.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `d0a9a7a` | SCRUM-493: AUTH v2 Phase 1.2 — opaque refresh tokens + SessionsServiceV2 (tenant-aware) | 6 files: schema.prisma + migration + audit-action.enum.ts + sessions.module.ts + sessions.service.v2.ts + sessions.service.v2.spec.ts |
| `18fd537` | (same) (#332) | Squash merge to `main` |

**Diff size**: 6 files · **+847 / -49 lines** (the -49 is `prisma format` whitespace reflow on existing models — no semantic change to v1 surface).

## Deviations from Plan

All 3 deviations imported from the verify report (PASS · 3 Accepted-Trivial · 0 blocking).

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 1 | Append SessionV2 model + 5 enum values to schema.prisma | Done as planned, but `prisma format` reflowed whitespace on EXISTING models | `prisma format` is the canonical formatter; running it is part of the repo convention. Whitespace-only diff on pre-existing surface. | Accepted-Trivial | — |
| 2 | `prisma migrate deploy` | Done. Plus an additional `npx prisma generate` step was needed before the TS client included `sessionV2` types. | Plan implied bundled regeneration; in practice `migrate deploy` does NOT auto-regenerate the client. Mechanical step ordering, no semantic effect. | Accepted-Trivial | — |
| 4 | Service uses composite key `userId_tenantId` per plan code sample | Service uses `tenantId_userId` (the actual Prisma-generated composite name per schema's `@@unique([tenantId, userId])` field order) | Plan §13 (open considerations for /develop) flagged this as a thing to verify; live schema's `@@unique` lists `tenantId` first, so Prisma generates `tenantId_userId`. Pure code-correctness fix. | Accepted-Trivial | — |

The plan-level deviation (mocked Prisma + spy AuditService in spec, vs the enriched ticket's aspirational "mock-free integration spec with real PrismaService") was locked at plan §1 D-7 — already plan-aligned, NOT an implementation deviation.

## Test Results

- **Test suites**: 94 passed (93 baseline + 1 new spec file), 0 failed.
- **Tests**: **1297 passed** (1279 baseline + **18 net new**), 0 failed.
- **Coverage (global)**:
  - **statements 91.15%** (≥ 90% threshold ✅; +0.15 pp on top of SCRUM-490's 91.00%)
  - **lines      91.15%** (same)
  - branches    82.67% (≥ 80% ✅)
  - functions   88.10% (≥ 85% ✅)
- **Per-file `sessions.service.v2.ts`**: **97.95% statements/lines · 100% functions · 65.71% branches**. The branches gap is structural: TypeScript can't see that the async `rejectRefresh` helper has `Promise<never>` return; 6 lines after each call site (142/145/148/167/229-230) are formally reachable but unreachable in practice.
- **Per-file new spec**: 18 assertions across 8 describe blocks (createSession 3 + happy-path 5 + rejection paths 5 (incl. message-bit-identity proof) + revokeSession 2 + revokeAllForTenant 2 + fixture sanity 1).
- **Build**: `nest build` exit 0.
- **ESLint**: clean on all 6 staged files (1 Prettier auto-fix applied to the spec pre-commit).
- **Manual verification**: PR #332 CI **one-shot green — all 11 checks SUCCESS** (no admin override). Most defensive landing of the AUTH v2 wave to date.

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Header `Last update` bumped to SCRUM-493. New Changelog row documenting the v2 session lifecycle + tenant-aware revocation. Module Registry annotation on `SessionsModule` (new internal-only provider `SessionsServiceV2`). New Service Dependency Chains entry. |
| `ai-specs/changes/auth/programs/AUTH-v2.md` | §6 Current Phase State: new Phase 1.2 row marked complete with PR #332 / merge `18fd537`. Phase 1 umbrella row updated to reflect 1.2 ✅. Next milestone footer rewritten from "Phase 1.2" to "Phase 1.3 — JwtV2Strategy + first consumer endpoint". |
| `ai-specs/specs/data-model.md` | New `SessionV2` entity entry under the Auth/Sessions section. Documents the 11 fields, the SHA-256 hash discipline, the strangler-pattern note, and the v1 sunset path at Phase 6. |
| `ai-specs/specs/api-spec.yml` | **Unchanged** — no HTTP endpoints added/modified/removed in this phase. |

## Lessons Learned

- **Strangler-pattern audit is mechanical and durable**. The Phase 1.1 grep invariant (`SessionsServiceV2` must appear only in declaration + provider + spec) caught its own integrity check post-impl without ceremony. This pattern is the load-bearing structural insurance for the entire AUTH v2 wave — every v2 surface should bake the same grep into its plan's "Implementation Verification" section.
- **Plan-time "code-correctness open considerations" pay off**. Plan §13 flagged `parseDurationMs` path + composite-key field order as things to verify at /develop time. Both were real — the second one would've been a runtime crash if not caught here. Future plans on Prisma-heavy surfaces should default to including "open considerations for /develop" for things the plan author couldn't fully verify without running.
- **The centralized `rejectRefresh` helper emerged naturally during implementation**. Plan §4 specified 4 separate rejection paths, each with its own audit emission + throw. Reading the implementation I noticed the consequent code duplication and refactored to a single `rejectRefresh(reasonClass, userId)` private method. It enforces the no-failure-mode-enumeration discipline structurally (one throw site = one message, guaranteed). Future v2 services with similar reject-many-paths design should adopt this idiom upfront.
- **`prisma migrate deploy` does NOT regenerate the TS client**. Repeated lesson from the AUTH v2 wave — `npx prisma generate` is a separate step that must be explicit. Future plans touching Prisma should include it as a discrete sub-step.

## Recommended Follow-ups

- **Add a real-DB integration test suite for SessionsServiceV2 atomicity** (priority=MEDIUM, module=auth, type=test) — current spec uses mocked Prisma + verifies "atomicity of intent" via mock call order. Real `prisma.$transaction` semantics (rollback on mid-tx throw, deadlock handling, isolation level) aren't proven by the current spec. Phase 1.3 will need a test DB anyway for the consumer endpoint integration tests; add this then.

## Rollback Playbook

### 12.1 Trigger conditions

**Zero production runtime is exercised by this change** — `SessionsServiceV2` has no consumers, no HTTP surface, no scheduled jobs. The `sessions_v2` table is created but receives zero writes until Phase 1.3 wires a consumer. **Therefore there are no symptom-based triggers**. The only conceivable rollback driver is "we want to walk back the v2 design direction" (program-level, not incident-driven).

### 12.2 Rollback steps (in execution order)

1. **Revert commit**: `git revert 18fd537` on a hotfix branch, open PR, merge to `main`. Pure-additive change — revert is mechanical and conflict-free unless Phase 1.3 has already landed on top (in which case revert 1.3 first; Phase 1.2 cannot be unwound without unwinding its consumers).
2. **Migration handling**:
   - The `sessions_v2` table will be DROPed by the revert's migration. **No data loss** — table has zero rows (no consumers wrote to it).
   - The 5 new `AuditAction` enum values (`SESSION_V2_*`) are **forward-only** — PostgreSQL cannot remove enum values atomically. They will remain as dead values on `main`. Harmless: no code will reference them post-revert.
   - **Do NOT attempt to drop the enum values manually** — the cost (table-wide check + brief lock) doesn't justify the gain (zero behavioral impact of dead enum members).
3. **Cache/state cleanup**: **N/A** — no Redis keys, no in-memory caches, no external state introduced.
4. **External provider state**: **N/A** — no OAuth registrations, no third-party webhooks, no external dependencies.
5. **Verification**: post-revert, run `nest build` (must compile clean) + `npx jest --maxWorkers=1 --forceExit` (must restore the pre-SCRUM-493 baseline). Grep `nexacore-api/src/` for `SessionsServiceV2` — should return 0 matches (only the 2 surviving comment references in `jwt-payload-v2.interface.ts` are pre-existing from SCRUM-492).

### 12.3 Estimated rollback time

- Happy path (revert + CI + merge + dev DB migration drop): ~10 minutes total (5 min CI + 2 min dev DB migration + 3 min verification).
- Worst case (Phase 1.3 already on top): revert Phase 1.3 first then Phase 1.2 — variable, depends on 1.3 surface.

### 12.4 Known risks of rollback

**None** — the change is structurally inert. Reverting Phase 1.2 only walks back internal scaffolding that has zero consumers. No customer data at risk. No client-side state inconsistency. No downstream integration broken. The 5 dead enum values are the only forward-only artifact, and they have zero behavioral impact.

## NOT-§15 verification

PR #332 single-domain AUTH (sessions + audit enum mirror + schema/migration are all AUTH-domain per program doc §15.1). Per `workflow-standards.mdc §15.3.3`, **§15 review path applies** but **no split-PR required** (single-domain). CODEOWNERS auto-routed AUTH reviewers based on `src/auth/**` + `src/sessions/**` + `prisma/schema.prisma` touch patterns. Mandatory §12 Rollback Playbook included above.
