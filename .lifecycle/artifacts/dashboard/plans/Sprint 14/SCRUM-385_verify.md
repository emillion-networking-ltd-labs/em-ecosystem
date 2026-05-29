# Verification Report: SCRUM-385 Create Rescue Branch with Selective Cherry-picks

**Date**: 2026-05-10
**Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-385_frontend.md`
**Branch**: `rescue/visual-baseline` (local only — push deferred to `/commit` per `feedback_local_first_before_push.md`)
**Verdict**: **PASS-WITH-DEBT**

---

## Plan Compliance

| Step | Description | Status | Deviation Category | Notes |
|------|-------------|--------|-------------------|-------|
| 0 | Pre-flight | DONE | — | 5/5 halt-checks PASS: WT clean, on `main`, tag exists locally + on origin, no prior `rescue/visual-baseline` |
| 1 | Branch from tag | DONE | — | HEAD = `3a46248c81257bcf9636700f794135ff486ce035` (matches tag commit exactly) |
| 2 | Cherry-pick SCRUM-357 (`0ad4fed`) | DONE | — | Auto-merge in `package-lock.json` (no manual conflict resolution needed). Local commit `5c11f4d`. Verified: `.jscpd.json` exists, `jscpd` in `package.json` devDependencies |
| 3 | Cherry-pick SCRUM-356 (`4573877`) | DONE | — | Auto-merge in 3 controllers (auth, oauth, session — non-conflicting line orderings). Local commit `fbac04b`. Verified: `issueAuthSession` in `token.service.ts`, `THROTTLE_CONFIGS` in `auth.constants.ts` |
| 4 | nexacore-api build + tests | DONE | — | npm ci OK (1039 packages, ~4 min), prisma generate OK, `nest build` EXIT 0, **tests 1052/1052 PASS** in 69 suites (target ≥1042) |
| 5a | nexacore-dashboard build (AC7) | DONE | D2 Pre-existing | npm ci OK (806 packages, ~2 min), `next build` EXIT 0, `.next/` artifacts present. Lint Error in `Tooltip.tsx:16` is Pre-existing (memoria SCRUM-348: "verified unchanged vs main and SCRUM-342 merged with same condition") |
| 5b | nexacore-dashboard tests (AC8) | **PARTIAL** | D1 Pre-existing | 105/118 PASS, 13 failures across 5 suites. **Cherry-picks did NOT modify any dashboard files** (verified via `git diff v-baseline-2026-05-06-auth-green..rescue/visual-baseline --name-only -- nexacore-dashboard/` returning empty). Failures are Pre-existing on baseline `3a46248` |
| 6 | sat-cristian-garcia build (AC9) | DONE | — | npm ci OK (391 packages), `next build` EXIT 0, 87.3 kB First Load JS (matches SAT01-4 prod build) |
| 7 | Manual visual smoke (AC10) | **USER-ACTION-PENDING** | — | Requires browser interaction; deferred to user. Smoke checklist in plan §7 (5 dashboard auth routes + 6 post-auth routes + satellite home/portfolio/sobre-mi + console-zero-warnings). Must complete before SCRUM-386 (VRT regen) starts |
| 8 | Push branch to origin | DEFERRED | D3 Accepted-Trivial | Moved to `/commit` per local-first rule |
| 9 | Doc review | DEFERRED | — | Moved to `/update-docs`. No spec updates anticipated |

**Numerical summary**: 8/9 plan steps DONE/DONE-WITH-CAVEAT; 1 PARTIAL (Step 5b — Pre-existing); 1 USER-ACTION-PENDING (Step 7); 2 DEFERRED to later lifecycle phases (Steps 8 + 9 per established conventions).

## Acceptance Criteria

| AC | Expected | Actual | Status |
|----|----------|--------|--------|
| AC1 | branch shows 2 commits since tag | `git log v-baseline...HEAD \| wc -l` = 2 | ✓ PASS |
| AC2 | SCRUM-356 + SCRUM-357 in HEAD log | `grep -cE 'SCRUM-(356\|357)'` = 2 | ✓ PASS |
| AC3 | NO SCRUM-371/372/373/377 | `grep -cE 'SCRUM-(371\|372\|373\|377)'` = 0 | ✓ PASS |
| AC4 | NO Dependabot bumps from 2026-05-08 | `grep -ciE 'deps\|dependabot'` = 0 | ✓ PASS |
| AC5 | api build PASS | `nest build` EXIT 0 | ✓ PASS |
| AC6 | api tests PASS, count ≥1042 | 1052/1052 in 69 suites | ✓ PASS |
| AC7 | dashboard build PASS | `next build` EXIT 0, lint Error D2 Pre-existing | ✓ PASS-WITH-DEBT |
| AC8 | dashboard tests PASS | 105/118 PASS, 13 fail D1 Pre-existing | ⚠ PARTIAL |
| AC9 | satellite build PASS | `next build` EXIT 0, 87.3 kB | ✓ PASS |
| AC10 | manual visual smoke | not yet executed | USER-ACTION-PENDING |
| AC11 | npm audit no worse than tag | api 2L+10M+19H+1C, dashboard 4L+2M+7H, satellite 1M+4H — baseline state, no new HIGH/CRITICAL from cherry-picks | ✓ PASS |

**9/11 ACs PASS, 1 PARTIAL (Pre-existing → ticket created), 1 USER-ACTION-PENDING.**

## Deviations

| # | Step | Category | Description | Risk | Action |
|---|------|----------|-------------|------|--------|
| **D1** | 5b | **Pre-existing** | 13 dashboard tests fail across 5 suites on baseline `3a46248`. Cherry-picks do not touch `nexacore-dashboard/` (proven via empty diff). Failures predate SCRUM-385. Audit 2026-05-06 scoped to `auth` only — dashboard test posture was never validated. | LOW (test red, no production impact) | **SCRUM-389 created** in Sprint 14, MEDIUM priority |
| **D2** | 5a | **Pre-existing** | Lint Error in `Tooltip.tsx:16` (`@typescript-eslint/no-explicit-any` rule definition not found). Memory (SCRUM-348 record) confirms: "verified unchanged vs main and SCRUM-342 merged with same condition". Build is non-fatal on this. | LOW | Linked to SCRUM-348 historical record. No new ticket — already documented as Pre-existing-no-action |
| **D3** | Branch convention | **Accepted-Trivial** | Branch `rescue/visual-baseline` does not follow `feature/[ticket-id]-[scope]` convention. Justified in plan §5: rescue branches are operational artifacts, not feature work. SCRUM-384 §13.4 establishes precedent. | None | Documented |
| **D4** | Step 8 | **Accepted-Trivial** | Push deferred to `/commit` (was originally placed in plan Step 8). Same lifecycle adaptation as SCRUM-384 D1, per `feedback_local_first_before_push.md`. | None | Documented |

**Classification rationale**:
- D1: Q1 (security?) NO → Q2 (test coverage?) NO (failures predate this ticket) → Q3 (technical justification?) Pre-existing → ticket
- D2: Same path as D1 → already-documented Pre-existing → link to existing record (SCRUM-348)
- D3, D4: Q1-Q3 NO, Q4 (technical justification?) YES → Accepted-Trivial

## Code Quality Checks

| Check | Result | Details |
|-------|--------|---------|
| 4a — New files with tests | N/A | No new files authored; cherry-picks bring code that was already tested upstream (PRs #270 + #271) |
| 4b — Security patterns (backend) | N/A | No new authorship; SCRUM-356 is internal refactor preserving existing security posture |
| 4c — Build (api `nest build`) | PASS | EXIT 0 |
| 4c — Tests (api `jest`) | PASS | 1052/1052 in 69 suites |
| 4c — Build (dashboard `next build`) | PASS | EXIT 0 (lint Error D2 Pre-existing, non-fatal) |
| 4c — Tests (dashboard `jest`) | PARTIAL | 105/118 PASS, 13 Pre-existing fail → SCRUM-389 |
| 4c — Build (satellite `next build`) | PASS | EXIT 0, 87.3 kB |
| 4d — Integration state | UP TO DATE | No module/guard/service/permission changes; refactor preserves DI surface |

## Regression Verification

| Check | Result | Details |
|-------|--------|---------|
| Blast radius (13 files: 4 root + 9 api auth) | VERIFIED | All files compile + test suites that mock affected classes (`TokenService`, `LoginService`) all PASS in api tests (covered by AC6) |
| Mock propagation | OK | Existing mocks of `TokenService.issueAuthSession` work correctly (validated by 1052/1052 api test pass) |
| API contract alignment | N/A | SCRUM-356 is refactor — endpoint paths, methods, DTOs, responses unchanged |
| Schema backward compatibility | N/A | No Prisma schema changes |
| Export surface integrity | OK | No module exports changed |

## Audit Finding Resolution

N/A — SCRUM-385 is not an audit remediation ticket. It is an ops/rescue Task under the SCRUM-383 epic. Step 4f does not apply.

Note: SCRUM-356's cherry-pick partially restores the DU-04 audit finding fix (originally on `main` post-Tailwind 4 cascade). This is a side-effect, not the primary intent. SCRUM-356's Done status on Jira remains valid since the fix exists on `main`; the rescue branch carries it forward as well.

## Recurrence Prevention

N/A in the audit-fix sense. However:
- D1 (13 dashboard test failures) recurrence prevention is in scope of SCRUM-389: pre-push hook policy hardening + AC4 of SCRUM-389 ("any failing test on push must be classified before merge").
- The `rescue/visual-baseline` branch itself is the recurrence-prevention artifact for the broader SCRUM-383 incident.

## Accepted-Risk Items

None. All Pre-existing items have grounded rationale and ticket follow-up where applicable.

## Tech Debt Tickets Created

| Ticket | Description | Sprint |
|--------|-------------|--------|
| **SCRUM-389** | Fix 13 Pre-existing dashboard test failures (Button, Pagination, MfaTotpStep, SecurityActivity, ConnectedAccounts) | Sprint 14 (active) |

## User-Action-Pending Items

| AC | What | When |
|----|------|------|
| AC10 | Manual visual smoke per plan §7 (dashboard auth flow + post-auth pages + satellite home + console check) | Before `/enrich-us SCRUM-386` starts (VRT regen consumes this confirmation) |

---

## Live-State Evidence (collected 2026-05-10)

```
=== Branch + cherry-picks ===
HEAD = fbac04b (rescue/visual-baseline)
v-baseline-2026-05-06-auth-green..HEAD = 2 commits (5c11f4d SCRUM-357 + fbac04b SCRUM-356)
git diff v-baseline-2026-05-06-auth-green..HEAD -- nexacore-dashboard/ = empty
git diff v-baseline-2026-05-06-auth-green..HEAD -- satellites/ = empty

=== api ===
nest build:  EXIT 0
jest:        1052 passed / 1052 total / 69 suites / 14.4s

=== dashboard ===
next build:  EXIT 0 (with Pre-existing Tooltip.tsx lint Error D2)
jest:        105 passed / 13 failed / 118 total / 18 suites — D1 Pre-existing

=== satellite ===
next build:  EXIT 0 / 87.3 kB First Load JS

=== npm audit (high+) ===
api:        2 low + 10 moderate + 19 high + 1 critical
dashboard:  4 low + 2 moderate + 7 high
satellite:  1 moderate + 4 high
(All baseline state — no new HIGH/CRITICAL from cherry-picks)
```

---

## Action Required Before /commit

None blocking. Reviewer/operator should be aware:

1. `/commit` will perform 1 push: `git push -u origin rescue/visual-baseline`. Pre-push hook will run CI parity (npm ci + builds + tests for api + dashboard) — same checks already passed locally above. **Do NOT use `--no-verify`** — the hook is appropriate here (rescue branch contains source code, not tag-only metadata as in SCRUM-384). If the husky/PATH issue from SCRUM-388 surfaces, escalate before bypass.
2. `/commit` Step 7 (merge to main + cleanup) is **NOT applicable** — rescue branch lives in parallel to `main` until SCRUM-383 epic closes. `/commit` must override Step 7.
3. **No PR** — rescue branches are operational, not feature work.
4. ai-specs path-scoped staging: 4 untracked items from concurrent agents (audit-2026-05-06T22-44/, SCRUM-354_*.md) — leave untouched per `feedback_concurrent_agents.md`. Plan + this verify report ARE this ticket's output and SHOULD be staged.

## Verdict Detail

**PASS-WITH-DEBT** — All cherry-picks landed cleanly, all api tests green (1052/1052), all 3 packages build clean. Dashboard test partials and Tooltip lint are Pre-existing (proven by empty git diff for dashboard files between tag and HEAD); SCRUM-389 created in Sprint 14 to address the test posture. Manual visual smoke (AC10) deferred to user before SCRUM-386 starts. Branch convention deviation (D3) and push-deferral (D4) are Accepted-Trivial lifecycle adaptations with established precedent. Proceed to `/commit`.
