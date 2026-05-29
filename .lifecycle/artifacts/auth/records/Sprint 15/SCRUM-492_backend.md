---
schema: ai-specs/schemas/record.schema.yml
ticket: SCRUM-492
sprint: Sprint 15
scope: backend
module: auth
date: 2026-05-19
branch: feature/SCRUM-492-auth-backend
plan_path: ai-specs/changes/auth/plans/Sprint 15/SCRUM-492_backend.md
verify_path: ai-specs/changes/auth/plans/Sprint 15/SCRUM-492_verify.md
is_audit_fix: false
plan_followed: "yes"
pr: 330
merge_commit: 309c38f7561caabdf864f2aba6d2995f6420f011
framework_version: 0.15.0
commits:
  - hash: "d721393"
    message: "SCRUM-492: Token Engine v2 internal scaffolding (AUTH v2 Phase 1.1)"
    files:
      - nexacore-api/src/auth/auth.module.ts
      - nexacore-api/src/auth/interfaces/jwt-payload-v2.interface.ts
      - nexacore-api/src/auth/tests/token.service.v2.spec.ts
      - nexacore-api/src/auth/token.service.v2.ts
  - hash: "309c38f"
    message: "SCRUM-492: Token Engine v2 internal scaffolding (AUTH v2 Phase 1.1) (#330)"
    files:
      - nexacore-api/src/auth/auth.module.ts
      - nexacore-api/src/auth/interfaces/jwt-payload-v2.interface.ts
      - nexacore-api/src/auth/tests/token.service.v2.spec.ts
      - nexacore-api/src/auth/token.service.v2.ts
---

# Implementation Record: SCRUM-492 Token Engine v2 Internal Scaffolding (AUTH v2 Phase 1.1)

## Summary

First implementation ticket of **Phase 1** of the AUTH v2 + Tenancy v1 program. Introduces internal-only `TokenServiceV2` + `JwtPayloadV2` interface following the strangler pattern: zero production consumers in this ticket; v1 `TokenService` continues to serve all HTTP paths. Phase 1.2 (opaque refresh + SessionsServiceV2) and Phase 1.3 (JwtV2Strategy + first consumer) will wire consumers later.

- **Scope**: backend
- **Branch**: `feature/SCRUM-492-auth-backend`
- **Implementation date**: 2026-05-19

## Plan Reference

- Plan: `ai-specs/changes/auth/plans/Sprint 15/SCRUM-492_backend.md`
- Verify: `ai-specs/changes/auth/plans/Sprint 15/SCRUM-492_verify.md` (verdict **PASS · 0 deviations**)
- **Plan was followed**: Yes — step-for-step, no deviations.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `d721393` | SCRUM-492: Token Engine v2 internal scaffolding (AUTH v2 Phase 1.1) | 3 NEW + 1 MOD in `nexacore-api/src/auth/**` |
| `309c38f` | SCRUM-492: Token Engine v2 internal scaffolding (AUTH v2 Phase 1.1) (#330) | Squash merge to `main` |

**Diff size**: 4 files staged · +439 / -0 lines.

## Deviations from Plan

Implementation followed the plan exactly. Verify report imported **0 deviations** across all categories (Accepted-Trivial / Accepted-Quality / Accepted-Risk / Deferred / Pre-existing / Scope-Gap).

## Test Results

- **Test suites**: 84 passed, 0 failed.
- **Tests**: **1241 passed**, 0 failed (baseline 1223 + **18 net new**).
- **New tests for SCRUM-492** (`token.service.v2.spec.ts`, 18 cases):
  - 5 roundtrip (mint→verify): preserve fields, exactly 7 v2 keys + no v1 email/role, `iat ±2s`, `jti` uniqueness, `isPlatformAdmin=true` round-trip.
  - 5 parameterized `TenantRole` values (OWNER / ADMIN / MEMBER / VIEWER / CUSTOM) round-trip.
  - 7 rejection paths (wrong signature, expired, wrong issuer, **forged v1-shape payload** [correct signature, wrong shape], missing `isPlatformAdmin`, non-boolean `isPlatformAdmin`, generic-error-message invariant).
  - 1 cross-instance verify (mint in one TokenServiceV2 instance verifies in another with same JwtModule config).
- **Mock-free design**: real `JwtModule.register` + real `JwtService` over a deterministic test-only secret. Pure crypto; no DB, no Redis.
- **Coverage of `TokenServiceV2` body**: 100% (verified by reading: roundtrip exercises mint + verify + shape-guard happy path; rejection tests cover each `throw` branch; cross-instance test proves statelessness).
- **Build**: `nest build` exit 0 (zero TS errors, zero DI errors).
- **ESLint**: clean (1 Prettier auto-fix applied to spec file pre-commit).
- **CI Layer 4 Backend Tests**: **FAILED on coverage threshold only** — all 1241 tests passed but global coverage missed the 90% line/statement threshold by **0.21 pp** (89.79% < 90%). This is the same pre-existing coverage debt that affected SCRUM-487 (tracked by **SCRUM-490**, open in backlog). Operator authorized admin merge override (second of the wave). Branches + functions thresholds PASS.

## Bugs Found

None during implementation. Plan executed without surprises.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | AuthModule providers row annotation (`TokenServiceV2` [SCRUM-492] — internal-only, NOT exported); new Service Dependency Chains entry (`TokenServiceV2 → JwtService`); header `Last update` bumped to SCRUM-492; Changelog row added. |
| `ai-specs/changes/auth/programs/AUTH-v2.md` | §6 Current Phase State: new Phase 1.1 row marking complete with PR #330 / merge `309c38f`; Phase 1 status moved from `not_started` to `in_progress`; "Next milestone" pointer updated from "Phase 1" to "Phase 1.2 — opaque refresh + SessionsServiceV2". |
| `ai-specs/specs/data-model.md` | **Unchanged** — no Prisma schema changes (per plan §3 + verify §3). |
| `ai-specs/specs/api-spec.yml` | **Unchanged** — no HTTP endpoints added/modified/removed (per plan §3 + verify §3). |

## Lessons Learned

- **Smallest meaningful unit ≠ guaranteed organic CI green**. Phase 1.1 was deliberately the smallest ticket of the wave (4 files, +439 lines) to reduce risk, but the pre-existing main coverage gap (~89.72–89.85% vs 90% threshold) meant a small delta couldn't clear it organically. The +18 tests on new surface added covered lines and added production lines (interface + service body), and the net delta was insufficient. **Future plans should explicitly model the global coverage gap** when forecasting CI gate behavior in the §1 "Plan-time CI Gate Anticipation" table, not just predict per-file deltas.
- **Strangler-pattern invariant validated**: writing v2 alongside v1 with `TokenServiceV2` deliberately absent from `AuthModule.exports[]` means zero consumers exist in production code — verified by grep (`TokenServiceV2` references = declaration + provider entry + spec file only). This is the structural insurance that makes Phase 1.2/1.3 safe to revert in isolation.
- **Forged-v1-shape test is the load-bearing security assertion**: with v1 and v2 sharing the same `JWT_SECRET` (program decision §2.3.1 — pragma over key rotation in Phase 1), the only structural protection against a v1 token verifying as v2 (or vice versa) is the explicit shape-guard `isValidV2Payload`. The dedicated test (`rejects forged v1-shape payload (correct signature, wrong shape — missing tenantId)`) proves the second gate works. **Phase 1.3 must keep this invariant** when wiring JwtV2Strategy.
- **Cache-warm CI prediction failed**: plan §1 forecast "Layer 4 PASS" because per-ticket tests would pass. The forecast didn't model the global threshold gap. Future Phase 1.x tickets that depend on small deltas should bake coverage-gap reality into the prediction.

## Recommended Follow-ups

- **Promote SCRUM-490 (backend coverage debt sweep) to current sprint before Phase 1.2** (priority=HIGH, module=auth, type=tech-debt) — second consecutive admin override in the AUTH v2 wave (SCRUM-487 was first). Third would normalize the bypass; addressing the pre-existing 89.72% main coverage gap is the proactive control. SCRUM-490 already exists in backlog with the right scope.

## Rollback Playbook

### 12.1 Trigger conditions

No production runtime is exercised by this change — `TokenServiceV2` is wired only as a provider, has zero consumers, and is NOT in `AuthModule.exports[]`. The change is structurally inert until Phase 1.2/1.3 add consumers. **Therefore there are no symptom-based triggers**. The only conceivable rollback driver is "we want to walk back the v2 design direction" (program-level, not incident-driven).

### 12.2 Rollback steps (in execution order)

1. **Revert commit**: `git revert 309c38f` on a hotfix branch (e.g., `fix/SCRUM-492-rollback`), open PR, merge to `main`. Pure-additive change — revert is mechanical and conflict-free unless Phase 1.2 has already landed on top (in which case revert Phase 1.2 first; Phase 1.1 cannot be unwound without unwinding its consumers).
2. **Migration handling**: **N/A** — zero Prisma schema changes, zero migrations.
3. **Cache/state cleanup**: **N/A** — no Redis keys, no in-memory caches, no external state introduced.
4. **External provider state**: **N/A** — no OAuth registrations, no third-party webhooks, no external dependencies.
5. **Verification**: post-revert, run `nest build` (must compile clean) + `npx jest --maxWorkers=1 --forceExit` (must restore 1223/1223 baseline). Grep `nexacore-api/src/` for `TokenServiceV2` — should return 0 matches.

### 12.3 Estimated rollback time

- Happy path (revert + CI + merge): ~5 minutes total (no DB ops, no cache invalidation).
- Worst case (Phase 1.2 already on top): rollback Phase 1.2 first then Phase 1.1 — variable, depends on Phase 1.2 surface.

### 12.4 Known risks of rollback

**None** — the change is structurally inert. Reverting Phase 1.1 only walks back internal scaffolding that has zero consumers. No customer data loss, no client-side state inconsistency, no downstream integration broken.

## NOT-§15 Notes

PR #330 single-domain (all 4 staged files inside `src/auth/**`). No `prisma/schema.prisma` touch. No `src/audit/**` touch. Per `workflow-standards.mdc §15.3.3`, **no split-PR required**. CODEOWNERS auto-routed AUTH reviewers based on the `src/auth/**` touch pattern. Mandatory §12 Rollback Playbook included above per §15.3.3.
