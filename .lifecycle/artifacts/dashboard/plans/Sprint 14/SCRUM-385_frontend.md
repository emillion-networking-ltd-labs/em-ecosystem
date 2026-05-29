# Frontend Implementation Plan: SCRUM-385 Create Rescue Branch with Selective Cherry-picks

> **Scope adaptation note**: This is an **ops/rescue ticket** under the SCRUM-383 visual baseline rescue epic. The work is git operations (branch + cherry-pick) followed by full-stack verification (api + dashboard + satellite builds/tests + manual visual smoke). It is filed under `dashboard/` because the rescue concerns dashboard visual state, and labeled `_frontend` to match the SCRUM-380 / SCRUM-384 precedent. Sections that apply only to greenfield code work (DTOs, ApiClient methods, new components) are marked `N/A — ops/rescue ticket` rather than padded.

## 1. Header

- **Ticket**: SCRUM-385 (Sprint 14, id=477)
- **Parent epic**: SCRUM-383 (Visual baseline rescue post-Tailwind 4 regression)
- **Issue type**: Task
- **Priority**: Medium
- **Module**: dashboard (rescue parent)
- **Predecessor**: SCRUM-384 (tag `v-baseline-2026-05-06-auth-green` — must exist on origin)
- **Successors**: SCRUM-386 (VRT regen, consumes the rescue branch), SCRUM-387 (reopen majors, references the rescue tag)

## 2. Codebase State Snapshot

- **Date**: 2026-05-10
- **Last completed ticket**: SCRUM-384 (Tag baseline + §13.4 policy)
- **Integration state verified**: Yes — `integration-state.md` unchanged since SCRUM-326 (audit module + auth module last touched 2026-04-21); SCRUM-356 cherry-pick reorganises auth code internally but does not change module boundaries, guard chains, or DI surface (refactor-only of duplicated post-token-issuance flow into `TokenService.issueAuthSession`).

**Files verified against live code (read at plan-time, 2026-05-10)**:
- `em-ecosystem-code` HEAD = `6399bb8` (post-Tailwind 4) — start point of `main`, NOT used as branch base.
- Tag `v-baseline-2026-05-06-auth-green` → commit `3a46248c81257bcf9636700f794135ff486ce035` (annotated, pushed to origin per SCRUM-384) — used as branch base.
- Cherry-pick target SCRUM-357 = commit `0ad4fed` — 4 files: `.husky/pre-commit`, `.jscpd.json`, `package.json`, `package-lock.json`. Adds jscpd as devDependency.
- Cherry-pick target SCRUM-356 = commit `4573877` — 9 files, all under `nexacore-api/src/auth/`: `account.controller.ts`, `auth.controller.ts`, `constants/auth.constants.ts`, `login.service.ts`, `mfa.controller.ts`, `oauth.controller.ts`, `passkey.controller.ts`, `session.controller.ts`, `token.service.ts`.

**Constructor signatures verified**: SCRUM-356 modifies `TokenService` and `LoginService` to call a new `TokenService.issueAuthSession()` method. The constructors of these services are NOT modified by SCRUM-356 (verified via the 9-file diff list — only `*.ts` source under `auth/`, no module file). DI graph unchanged.

**Methods verified to exist** (in the SCRUM-356 commit, NOT in the tag baseline):
- `TokenService.issueAuthSession(user, requestMeta, preGenerated?)` — new method introduced by SCRUM-356.
- Existing methods on `TokenService` and `LoginService` are refactored internally to delegate to `issueAuthSession`. Public API of these services (method names, signatures) is unchanged.

**Guard dependency chain verified**: No `@UseGuards()` changes in SCRUM-356/357. Guards inherit from baseline `3a46248`.

**Discrepancies with integration-state.md**: None. Both cherry-picks are refactor / tooling, not architectural.

## 3. Regression Impact Analysis

> Note: SCRUM-385's *intent* IS regression mitigation — restoring the visually-correct trunk state. This section documents the additive blast radius of the 2 cherry-picks ON TOP of the tag baseline.

**Blast radius (cherry-pick deltas vs `3a46248`)**:
| File | Source | Risk if cherry-pick fails |
|------|--------|---------------------------|
| `.husky/pre-commit` | SCRUM-357 | LOW — adds jscpd hook step. Worst case: hook errors out on commits, which we don't do on rescue branch (cherry-pick only) |
| `.jscpd.json` | SCRUM-357 | NONE — config file, only loaded by jscpd CLI/hook |
| `package.json` | SCRUM-357 | LOW — adds `jscpd` to devDependencies. Tooling only, no runtime impact |
| `package-lock.json` | SCRUM-357 | MEDIUM — npm/node version sensitivity; may diverge from authoring environment |
| `nexacore-api/src/auth/account.controller.ts` | SCRUM-356 | LOW — internal call rewrite (`issueAuthSession()`) |
| `nexacore-api/src/auth/auth.controller.ts` | SCRUM-356 | LOW — same |
| `nexacore-api/src/auth/constants/auth.constants.ts` | SCRUM-356 | LOW — adds `THROTTLE_CONFIGS` constants; existing constants untouched |
| `nexacore-api/src/auth/login.service.ts` | SCRUM-356 | MEDIUM — login flow rewrite to delegate to `TokenService.issueAuthSession`. Auth-critical path. Tests + manual smoke must validate |
| `nexacore-api/src/auth/mfa.controller.ts` | SCRUM-356 | LOW — uses `THROTTLE_CONFIGS.mfa` |
| `nexacore-api/src/auth/oauth.controller.ts` | SCRUM-356 | LOW — uses `THROTTLE_CONFIGS.oauth` + new helper |
| `nexacore-api/src/auth/passkey.controller.ts` | SCRUM-356 | LOW — uses `THROTTLE_CONFIGS.sensitiveAction` |
| `nexacore-api/src/auth/session.controller.ts` | SCRUM-356 | LOW — uses `THROTTLE_CONFIGS.userSettings` |
| `nexacore-api/src/auth/token.service.ts` | SCRUM-356 | MEDIUM — adds `issueAuthSession`. Tests must validate the new method's behaviour matches the original inline code from `login.service.ts:323-348` and `token.service.ts:198-223` |

**Breaking changes identified**: None — both cherry-picks are refactor-only (SCRUM-356) or additive tooling (SCRUM-357). No public API surface changes. No module export changes.

**API contract impact**: None — endpoint paths, methods, DTOs, and response schemas unchanged by both cherry-picks (refactor preserves observable behaviour).

**Schema migration impact**: None — no Prisma schema changes in either cherry-pick.

**Test impact assessment**: The existing test suite at `3a46248` should continue to pass after both cherry-picks. SCRUM-356's PR #271 originally shipped with passing tests against the same auth services on the post-TS6 tree, so the tests adapt internally to the refactor (mocks of `TokenService.issueAuthSession` may exist; verify during /develop). If ANY existing test in `nexacore-api/src/auth/**.spec.ts` fails after cherry-pick, /develop must investigate before AC6 can pass.

**Blast radius size**: 13 files affected by cherry-picks vs `3a46248` baseline. Below the >5 flag threshold; classified as bounded refactor + tooling, not architectural change.

## 4. Overview

The ticket is a 3-phase operation: (Phase A) git operations to materialize the rescue branch, (Phase B) full-stack build + test verification across api + dashboard + satellite, (Phase C) manual visual smoke confirming zero regression vs the tag commit. Each phase is gated — if Phase A produces an unresolvable conflict, the cherry-pick is dropped and recorded as Accepted-Quality deviation; if Phase B fails, the cherry-pick is reverted and re-attempted; Phase C is the final visual confirmation that VRT regeneration in SCRUM-386 will be honest.

## 5. Architecture Context

- **Branch base**: SCRUM-384 tag `v-baseline-2026-05-06-auth-green` @ `3a46248`. NOT `main` (which contains the rejected SCRUM-371/372/373/377 + 9 Dependabot majors).
- **Branch name**: `rescue/visual-baseline` (lowercase, no `feature/` prefix — this is a rescue branch, not a feature branch, per SCRUM-384 §13.4 nomenclature for rescue work).
- **Cherry-pick order**: chronological — `0ad4fed` (SCRUM-357, 2026-05-09) before `4573877` (SCRUM-356, 2026-05-09 later same day). Verified via `git log` timestamps. Order matters because SCRUM-357 added jscpd which SCRUM-356's commit message references as the recurrence-prevention layer for DU-04.
- **No `feature/` branch**: This ticket explicitly violates `/develop` Step 0's `feature/[ticket-id]-frontend` convention. Documented as Accepted-Trivial deviation (SCRUM-385's whole purpose is to escape the `main` state — branching from `main` defeats the goal). The enriched ticket description's "Branch convention deviation note" formalises this.

## 6. Implementation Steps

### Step 0: Pre-flight (no branch creation yet)

```bash
cd em-ecosystem-code
git status                                          # MUST be empty (clean working tree)
git fetch origin --tags
git tag -l v-baseline-2026-05-06-auth-green         # MUST exist
git ls-remote --tags origin v-baseline-2026-05-06-auth-green   # MUST be on origin
git branch -a | grep rescue/visual-baseline         # MUST be empty (no prior attempt)
```

**Halt conditions**: if any check fails, stop and investigate.

### Step 1: Create rescue branch from tag

```bash
git checkout -b rescue/visual-baseline v-baseline-2026-05-06-auth-green
git rev-parse HEAD                                  # MUST equal 3a46248c81257bcf9636700f794135ff486ce035
```

### Step 2: Cherry-pick SCRUM-357 (jscpd config)

```bash
git cherry-pick 0ad4fed
```

**If conflict**:
1. Most likely on `package-lock.json` (lockfile sensitivity).
2. Resolve by accepting the cherry-pick's `package.json` change, then regenerate the lockfile:
   ```bash
   git checkout --theirs package.json .husky/pre-commit .jscpd.json
   git checkout --ours package-lock.json   # discard their lockfile
   git rm package-lock.json
   npm install --package-lock-only         # regenerate from current package.json + npm version
   git add .husky/pre-commit .jscpd.json package.json package-lock.json
   git cherry-pick --continue
   ```
3. If conflict outside `package-lock.json` cannot be resolved within 30 minutes: `git cherry-pick --abort`, mark SCRUM-357 as **dropped** in /verify deviation table (Accepted-Quality), continue to Step 3 without it.

**Verification**:
```bash
git log --oneline v-baseline-2026-05-06-auth-green..HEAD   # MUST show 1 commit referencing SCRUM-357
git status                                                  # MUST be clean
ls .jscpd.json                                              # MUST exist
grep -q '"jscpd"' package.json                              # MUST find devDependency entry
```

### Step 3: Cherry-pick SCRUM-356 (issueAuthSession extraction)

```bash
git cherry-pick 4573877
```

**If conflict**: Most likely none — auth source files at `3a46248` did not have any of SCRUM-371's TS6 changes (TS6 upgrade did not touch auth source). If conflict arises:
1. Investigate which file conflicts.
2. If conflict is purely additive (e.g., new method added at end of class), accept both sides.
3. If conflict is a logic-line collision: `git cherry-pick --abort`, mark SCRUM-356 as **dropped** in /verify deviation table (Accepted-Quality), proceed without it. The DU-04 audit finding remains open in that case (note in /update-docs).

**Verification**:
```bash
git log --oneline v-baseline-2026-05-06-auth-green..HEAD   # MUST show 2 commits (357 + 356) — or 1 if 357 was dropped
grep -l 'issueAuthSession' nexacore-api/src/auth/token.service.ts   # MUST find the method
grep -l 'THROTTLE_CONFIGS' nexacore-api/src/auth/constants/auth.constants.ts   # MUST find constants
```

### Step 4: Backend build + tests (nexacore-api)

```bash
cd nexacore-api
npm ci
npx prisma generate
npm run build                                       # AC5
npm test                                            # AC6 — record passing test count
cd ..
```

**Halt conditions**: if `npm run build` fails, the cherry-picks introduced a TS error — investigate and either fix locally (Accepted-Trivial if cosmetic, e.g., tsconfig strictness) or revert the offending cherry-pick. If `npm test` fails, identify which test and whether it's a regression from cherry-pick or a pre-existing failure on the tag baseline (less likely, given `3a46248` was green at audit time).

### Step 5: Dashboard build + tests (nexacore-dashboard)

```bash
cd nexacore-dashboard
npm ci
npm run build                                       # AC7
npm test                                            # AC8
cd ..
```

**Expected**: 100% green. The dashboard at `3a46248` predates Tailwind 4 / TS 6 / lucide 1 / etc., so its build is what we are *trying to preserve*. Failures here would indicate the cherry-picks indirectly affected the frontend (very unlikely — neither touches dashboard files).

### Step 6: Satellite build (sat-cristian-garcia)

```bash
cd satellites/sat-cristian-garcia
npm ci
npm run build                                       # AC9
cd ../..
```

### Step 7: Manual visual smoke (Phase C)

Run dev servers locally (port 3000 dashboard, 3001 satellite) and walk through the checklist below. Capture screenshots if any deviation found vs the same pages on a fresh checkout of `3a46248`.

**Dashboard auth flow**:
- `/login` — email + password screen, button hover shows `cursor-pointer`
- MFA challenge (force trigger via test user) — button hover, MFA digit input UX
- `/forgot-password` — email entry, submit button
- `/reset-password?token=...` — password fields, submit button
- `/verify-email-change?token=...`, `/verify-email?token=...` — confirmation screens

**Dashboard post-auth**:
- `/dashboard` — main shell, sidebar nav, theme toggle
- `/admin/audit-logs` — table, filters, recharts components (no `-1` axis warnings)
- `/admin/permissions` — permissions matrix
- `/admin/design-system` — full showcase, all component cards render
- `/profile` — sections, modals (idle warning, sign-out-everywhere)
- `/settings` — settings panel

**Satellite home**:
- `/` — Hero, IntroLoader splash transition, BeforeAfterSlider drag interaction
- `/sobre-mi` — TimelineEntry layout
- `/portfolio` — Lightbox modal

**Browser DevTools console**: zero React warnings/errors during full walk.

**Scope of "smoke"**: visual + console only. Functional tests are NOT in scope (covered by AC6/AC8 unit tests). If a visual delta IS found, document it in /verify but do not necessarily block — the rescue branch's purpose is "no worse than 3a46248", not "perfect". Any delta vs the tag baseline is by definition a regression introduced by the cherry-picks (since the tag IS the reference point).

### Step 8: Push rescue branch to origin

```bash
git push -u origin rescue/visual-baseline
```

Pre-push hook will run CI parity (npm ci + builds + tests for api + dashboard) — same as a normal feature branch push. The hook is APPROPRIATE here (rescue branch contains source code), so do NOT use `--no-verify`.

If the hook fails on the husky/PATH issue from SCRUM-388, that's a Pre-existing condition — escalate to user, do NOT bypass without explicit approval (per `/commit` protocol).

**Verification**:
```bash
git ls-remote --heads origin rescue/visual-baseline   # MUST return one line
```

### Step 9: Update technical documentation

For SCRUM-385:
- `data-model.md` — N/A (no entity changes)
- `api-spec.yml` — N/A (no endpoint changes; SCRUM-356 is internal refactor, public API unchanged)
- `integration-state.md` — N/A (no module/guard/service/permission changes; SCRUM-356 refactors internal duplication, DI surface preserved)
- `frontend-standards.mdc` / `backend-standards.mdc` — N/A
- `workflow-standards.mdc` — POSSIBLY add a note under §13.4.5 listing `rescue/visual-baseline` as the live consumer of `v-baseline-2026-05-06-auth-green`. Defer to /update-docs decision.

## 7. Implementation Order

1. Step 0 — Pre-flight checks
2. Step 1 — Create branch from tag
3. Step 2 — Cherry-pick SCRUM-357
4. Step 3 — Cherry-pick SCRUM-356
5. Step 4 — Backend build + tests
6. Step 5 — Dashboard build + tests
7. Step 6 — Satellite build
8. Step 7 — Manual visual smoke
9. Step 8 — Push branch to origin
10. Step 9 — Documentation review

## 8. Testing Checklist (AC alignment)

| # | AC | Verification | Source |
|---|----|--------------|--------|
| 1 | AC1 | `git log --oneline v-baseline-2026-05-06-auth-green..rescue/visual-baseline` = 2 lines (or 1 if a pick was dropped) | Step 1+2+3 |
| 2 | AC2 | `git log --oneline rescue/visual-baseline \| grep -E 'SCRUM-(356\|357)'` returns the expected count | Step 2+3 |
| 3 | AC3 | `git log --oneline rescue/visual-baseline \| grep -E 'SCRUM-(371\|372\|373\|377)'` returns empty | Step 1 (branch base) |
| 4 | AC4 | `git log --oneline --since=2026-05-07 --until=2026-05-09 rescue/visual-baseline \| grep -i 'deps\|dependabot'` returns empty | Step 1 (branch base) |
| 5 | AC5 | `nexacore-api`: `npm run build` exits 0 | Step 4 |
| 6 | AC6 | `nexacore-api`: `npm test` exits 0, count ≥1042 | Step 4 |
| 7 | AC7 | `nexacore-dashboard`: `npm run build` exits 0 | Step 5 |
| 8 | AC8 | `nexacore-dashboard`: `npm test` exits 0 | Step 5 |
| 9 | AC9 | `sat-cristian-garcia`: `npm run build` exits 0 | Step 6 |
| 10 | AC10 | Manual smoke checklist (Step 7) — zero regressions documented (or any deltas explicitly recorded as deviations) | Step 7 |
| 11 | AC11 | `npm audit` no new HIGH/CRITICAL on rescue branch vs tag baseline | run after Step 8 |

**Regression test checklist**: every file in the blast radius (Section 3) is exercised by the existing nexacore-api test suite. AC6 verifies. No new test files needed (refactor preserves test surface).

## 9. Error Response Format

N/A — ops/rescue ticket, no new error paths.

## 10. Partial Update Support

Cherry-picks are atomic-or-aborted. If one is dropped (per Step 2/3 conflict-resolution), the rescue branch ships with the surviving picks. The DU-04 audit finding remains open until /update-docs records the partial application.

## 11. Dependencies

- Git (for cherry-pick operation).
- Node 22 + npm (per `.nvmrc`) for build/test verification.
- Local Postgres + Redis (per backend dev setup) for `nexacore-api` tests if any are integration-flavoured.
- Browser (Chromium / Firefox) for manual visual smoke.

No new package.json dependencies introduced beyond what SCRUM-357 brings (jscpd as devDep).

## 12. Notes

- **Branch lifetime**: `rescue/visual-baseline` is a long-lived branch until the SCRUM-383 epic closes. It will NOT be deleted at /commit Step 7 of this ticket — we override that step. Document override in /verify.
- **`/commit` Step 7 (merge to main + cleanup) is NOT applicable**: this ticket does NOT merge `rescue/visual-baseline` to `main`. The merge decision is epic-level, deferred until SCRUM-386/387 close. Override `/commit` Step 7 in implementation.
- **No PR**: rescue branches are operational artifacts, not feature work. No PR will be opened. Branch goes to origin so SCRUM-386/387 can fetch it, but review surface is the verify report + record, not a GitHub PR.
- **English only** for all artifacts (commit messages, plan, verify, record).
- **Concurrent agents**: per `feedback_concurrent_agents.md`, do NOT touch any files outside `em-ecosystem-code` working tree during cherry-pick + verify. ai-specs has uncommitted concurrent work (audit-2026-05-06T22-44/, SCRUM-354_*.md) — leave alone.

## 13. Next Steps After Implementation

- /verify — confirm 11 ACs + classify deviations (especially: any dropped cherry-picks, branch convention deviation, lockfile regeneration if used)
- /commit — push branch (pre-push hook will run CI parity normally), no PR, no merge to main
- /update-docs — record + decision on whether to update §13.4.5 cross-reference list
- Manual: transition SCRUM-385 to Done; SCRUM-386 unblocked

## 14. Implementation Verification

| Area | Verification |
|------|--------------|
| Code Quality | No new code authored; cherry-picks bring code that already passed review (PRs #270 + #271 on main). |
| Functionality | AC5–AC9 (builds + tests) + AC10 (smoke) cover the surface. |
| Testing | nexacore-api existing suite (≥1042 tests) re-runs cleanly. |
| Regression | Blast radius (Section 3) entirely covered by existing tests + manual smoke. |
| Integration | rescue/visual-baseline visible on origin (AC1). SCRUM-386 unblocked. |
| Documentation | Plan + verify + record produced. /update-docs may add §13.4.5 cross-reference. |

## 15. Module-Level Planning

N/A — not a NexaCore module change.

## 16. Satellite App Planning

N/A in implementation sense (sat-cristian-garcia is rebuilt for verification, but no satellite code changes). The satellite participates as a *verification target* (AC9), not as the subject of the ticket.

---

## Plan Compliance Checklist (for /verify)

- [ ] Step 0 pre-flight: tag exists on origin, working tree clean, branch name available
- [ ] Step 1 branch created from tag (not from main); HEAD at `3a46248`
- [ ] Step 2 SCRUM-357 cherry-picked OR explicitly dropped with reason
- [ ] Step 3 SCRUM-356 cherry-picked OR explicitly dropped with reason
- [ ] Step 4 nexacore-api build PASS, tests PASS (count recorded)
- [ ] Step 5 nexacore-dashboard build PASS, tests PASS
- [ ] Step 6 sat-cristian-garcia build PASS
- [ ] Step 7 manual smoke completed; deltas vs `3a46248` documented (zero or with explanations)
- [ ] Step 8 branch pushed to origin (no `--no-verify` unless hook gap blocks per SCRUM-388)
- [ ] Step 9 doc review (no spec updates expected unless §13.4.5 cross-ref added)
- [ ] Branch convention deviation (rescue branch, not feature/) classified Accepted-Trivial in /verify
- [ ] /commit Step 7 (merge to main) override documented
- [ ] No PR created
