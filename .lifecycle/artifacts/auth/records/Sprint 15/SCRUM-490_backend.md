---
schema: ai-specs/schemas/record.schema.yml
ticket: SCRUM-490
sprint: Sprint 15
scope: backend
module: auth
date: 2026-05-19
branch: feature/SCRUM-490-backend
plan_path: ai-specs/changes/auth/plans/Sprint 15/SCRUM-490_backend.md
verify_path: ai-specs/changes/auth/plans/Sprint 15/SCRUM-490_verify.md
is_audit_fix: false
plan_followed: "yes"
pr: 331
merge_commit: 6d80f66fa74eb38fee4af7ecd1629741e6d53bb0
framework_version: 0.15.0
commits:
  - hash: "6907a4f"
    message: "SCRUM-490: Backend coverage debt sweep (clear 90% jest threshold)"
    files:
      - nexacore-api/src/tenants/tests/invitation-response.dto.spec.ts
      - nexacore-api/src/tenants/tests/member-response.dto.spec.ts
      - nexacore-api/src/users/tests/admin-update-user.dto.spec.ts
      - nexacore-api/src/users/tests/change-email.dto.spec.ts
      - nexacore-api/src/users/tests/change-password.dto.spec.ts
      - nexacore-api/src/users/tests/delete-account.dto.spec.ts
      - nexacore-api/src/users/tests/list-security-activity-query.dto.spec.ts
      - nexacore-api/src/users/tests/unlink-oauth.dto.spec.ts
      - nexacore-api/src/users/tests/update-profile.dto.spec.ts
  - hash: "6d80f66"
    message: "SCRUM-490: Backend coverage debt sweep (clear 90% jest threshold) (#331)"
    files:
      - nexacore-api/src/tenants/tests/invitation-response.dto.spec.ts
      - nexacore-api/src/tenants/tests/member-response.dto.spec.ts
      - nexacore-api/src/users/tests/admin-update-user.dto.spec.ts
      - nexacore-api/src/users/tests/change-email.dto.spec.ts
      - nexacore-api/src/users/tests/change-password.dto.spec.ts
      - nexacore-api/src/users/tests/delete-account.dto.spec.ts
      - nexacore-api/src/users/tests/list-security-activity-query.dto.spec.ts
      - nexacore-api/src/users/tests/unlink-oauth.dto.spec.ts
      - nexacore-api/src/users/tests/update-profile.dto.spec.ts
---

# Implementation Record: SCRUM-490 Backend Coverage Debt Sweep (raise main above 90% line)

## Summary

Tech-debt ticket created during /commit of SCRUM-487 (Phase 0.1) and finally landed after SCRUM-492 (Phase 1.1) triggered a second admin override. Adds 9 new spec files exercising validation-decorator DTOs (7) and pure-shape response DTOs (2) that previously had 0–37% coverage. Closes the pre-existing global coverage gap on `main`: statements + lines **89.79% → 91.00%** (+1.21pp, +1.0pp margin above the 90% jest threshold). Zero production source code modified. Unblocks AUTH v2 Phase 1.2 for organic CI green.

- **Scope**: backend
- **Branch**: `feature/SCRUM-490-backend`
- **Implementation date**: 2026-05-19

## Plan Reference

- Plan: `ai-specs/changes/auth/plans/Sprint 15/SCRUM-490_backend.md`
- Verify: `ai-specs/changes/auth/plans/Sprint 15/SCRUM-490_verify.md` (verdict **PASS · 0 deviations**)
- **Plan was followed**: Yes — step-for-step, including conditional Steps 10–11 which were correctly triggered by the Step 9 STOP rule (post-Step-8 coverage was 90.32%, 0.18pp under the plan's 90.5% margin).

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `6907a4f` | SCRUM-490: Backend coverage debt sweep (clear 90% jest threshold) | 9 NEW `*.spec.ts` files across `nexacore-api/src/users/tests/` + `nexacore-api/src/tenants/tests/` |
| `6d80f66` | SCRUM-490: Backend coverage debt sweep (clear 90% jest threshold) (#331) | Squash merge to `main` |

**Diff size**: 9 NEW files · +452 / -0 lines · **zero production source files modified**.

## Deviations from Plan

Implementation followed the plan exactly. Verify report imported **0 deviations** across all categories (Accepted-Trivial / Accepted-Quality / Accepted-Risk / Deferred / Pre-existing / Scope-Gap). The conditional branch (Steps 10–11 for tenant response DTOs) was correctly triggered by the Step 9 STOP rule.

## Test Results

- **Test suites**: 93 passed (84 baseline + 9 new), 0 failed.
- **Tests**: **1279 passed** (1241 baseline + **38 net new**), 0 failed.
- **Coverage (global)**:
  - **statements 91.00%** (≥ 90% threshold ✅; +1.0pp margin)
  - **lines      91.00%** (≥ 90% threshold ✅; +1.0pp margin)
  - branches    82.99%   (≥ 80% threshold ✅)
  - functions   87.88%   (≥ 85% threshold ✅)
- **Per-target file coverage**: all 9 target DTOs at **100% statements / 100% lines** (branches reflect @ApiProperty argument literals for the 2 tenant response DTOs).
- **Build**: `nest build` exit 0.
- **ESLint**: clean on all 9 new spec files.
- **Manual verification**: CI Layer 4 (Backend Tests) passed on first push to PR #331 — **one-shot green, all 11 checks SUCCESS**. No admin override needed.

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Header `Last update` bumped to SCRUM-490; new Changelog row documenting the coverage clearance and wave unblock. |
| `ai-specs/changes/auth/programs/AUTH-v2.md` | §6 Current Phase State: Phase 1.1 row appended with "Coverage threshold cleared by SCRUM-490 (PR #331, merge `6d80f66`) — Phase 1.2 unblocked for organic CI green"; Next milestone footer updated to remove the SCRUM-490 blocker note. |
| `ai-specs/specs/data-model.md` | **Unchanged** — no Prisma schema changes. |
| `ai-specs/specs/api-spec.yml` | **Unchanged** — no HTTP endpoint changes. |

## Lessons Learned

- **The 0.5pp stop-rule margin was the right call**. Post-Step-8 coverage hit 90.32% — a strict "≥90%" reading would have stopped there, but the 90.5% margin requirement pushed me to add the two tenant response DTO specs. Final coverage 91.00% gives the wave +1.0pp of buffer; if I'd stopped at 90.32%, ordinary CI variance (build cache differences, jest worker count) could've put the next PR back into override-land. **Defensive margins on CI gates are not paranoia, they're the gate's actual cost of variance**.
- **Tests-only diffs are massively undervalued**. SCRUM-490 took ~30 min end-to-end (enrich → plan → develop → verify → commit) yet unblocked the entire remainder of AUTH v2 Phase 1. The wave will pay this back many times over (Phase 1.2 + 1.3 + 2 + 3 + 4 + 5 + 6 = ~10+ more PRs, each of which would have risked admin override without this sweep).
- **`plainToInstance + validate` is the single most leveraged test idiom in the repo**. Pure-decorator DTOs at 5–22 LOC reach 100% coverage with 30–50 lines of test code. Future tech-debt tickets touching unspecced validation DTOs should default to this pattern.
- **Wave-pattern observation**: 4 of 6 wave tickets landed one-shot CI green (SCRUM-488 + 489 + 491 + 490). The 2 overrides (SCRUM-487 + 492) both targeted the same Layer 4 coverage gap — not the ticket's actual scope. Wave-level patterns matter more than per-ticket patterns when diagnosing CI failures.

## Recommended Follow-ups

- **Promote SCRUM-490 stop-rule discipline into the `/plan` skill template** (priority=MEDIUM, module=framework, type=doc) — every plan touching `nexacore-api` tests should include an explicit coverage-margin target in the CI Gate Anticipation table when the baseline is within 1pp of any threshold. Lesson learned from SCRUM-487 + SCRUM-492 needing override; SCRUM-490's plan got it right by accident more than by template.

## Rollback Playbook

### 12.1 Trigger conditions

Tests-only diff — **no production runtime is exercised by this change**. The 9 new files run only under jest invocation. There are no symptom-based triggers for rollback. The only conceivable rollback driver is "we want to walk back a specific spec assertion" (e.g. a test starts flaking under future code changes) — that becomes a targeted edit, not a full revert.

### 12.2 Rollback steps (in execution order)

1. **Revert commit**: `git revert 6d80f66` on a hotfix branch, open PR, merge to `main`. Pure-additive change — revert is mechanical and conflict-free. **Consequence**: CI Layer 4 will fail again on the next non-coverage-padding PR (89.79% < 90%). If revert is desired, plan to ship a replacement coverage sweep immediately.
2. **Migration handling**: **N/A** — zero Prisma schema changes, zero migrations.
3. **Cache/state cleanup**: **N/A** — no Redis keys, no caches, no external state.
4. **External provider state**: **N/A** — no OAuth registrations, no webhooks.
5. **Verification**: post-revert, `npx jest --maxWorkers=1 --forceExit` should report 1241 tests passing AND coverage threshold failing (which is the pre-SCRUM-490 baseline). If those don't match, revert went wrong.

### 12.3 Estimated rollback time

- Happy path (revert + CI + merge): ~5 minutes total.
- **Caveat**: reverting puts main back below 90% threshold immediately. Any PR open against main at the time of revert would suddenly fail Layer 4. Plan accordingly.

### 12.4 Known risks of rollback

**The main risk is putting `main` back below the jest 90% threshold**, which would re-introduce the wave-wide override pressure. No customer data is at stake. No client-side state. No downstream integration.

## NOT-§15 verification

PR #331 multi-domain non-AUTH: 9 staged files split across `nexacore-api/src/users/tests/` (7) and `nexacore-api/src/tenants/tests/` (2). Zero `src/auth/**` touch, zero `src/audit/**` touch, zero `prisma/schema.prisma` touch. Per `workflow-standards.mdc §15.3.3`, **no split-PR required** (single-domain non-AUTH). CODEOWNERS routed reviewers based on `src/users/**` + `src/tenants/**` touch patterns.
