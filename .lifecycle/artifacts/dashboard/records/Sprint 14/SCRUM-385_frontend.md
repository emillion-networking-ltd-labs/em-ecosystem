# Implementation Record: SCRUM-385 Create Rescue Branch with Selective Cherry-picks

## 2. Summary

Materialized `rescue/visual-baseline` branch in `em-ecosystem-code` rooted at the SCRUM-384 tag `v-baseline-2026-05-06-auth-green` (`3a46248`). Cherry-picked 2 audit-fix commits (SCRUM-357 jscpd config + SCRUM-356 issueAuthSession extraction) cleanly with auto-merges. Verified across 3 packages (api + dashboard + satellite) — 8/9 plan steps DONE, 1 PARTIAL with Pre-existing failures (D1 → SCRUM-389), 1 user-action-pending (AC10 manual visual smoke). Branch pushed to origin, no PR opened (rescue branches are operational artifacts).

- **Scope**: ops/rescue (adapted from `_frontend` template per SCRUM-380 / SCRUM-384 precedent)
- **Branch**: `rescue/visual-baseline` (NOT `feature/SCRUM-385-frontend` — D3 Accepted-Trivial deviation, justified by §13.4 of workflow-standards as rescue branches are not feature work)
- **Implementation date**: 2026-05-10

## 3. Plan Reference

- **Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-385_frontend.md`
- **Verify report**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-385_verify.md` (verdict: PASS-WITH-DEBT)
- **Plan was followed**: Yes (with 4 deviations classified per `/verify` — see Section 5)

## 4. Commits

| Hash | Repo | Branch | Message | Key Artifacts |
|------|------|--------|---------|---------------|
| `5c11f4d` | em-ecosystem-code | `rescue/visual-baseline` | SCRUM-357: jscpd pre-commit hook + Code Reuse rule (DU-04 recurrence prevention) (#270) | `.husky/pre-commit`, `.jscpd.json`, `package.json`, `package-lock.json` (auto-merged from cherry-pick of `0ad4fed`) |
| `fbac04b` | em-ecosystem-code | `rescue/visual-baseline` | SCRUM-356: extract issueAuthSession + THROTTLE_CONFIGS + oauth callback helper (DU-04) (#271) | 9 files in `nexacore-api/src/auth/` (auto-merged in 3 controllers from cherry-pick of `4573877`) |
| `7133319` | ai-specs | `main` | docs(SCRUM-385): plan + verify for rescue/visual-baseline branch | plan + verify reports (483 lines) |

Branch `rescue/visual-baseline` pushed to em-ecosystem origin via `git push -u --no-verify` (D4 Accepted-Trivial). No commit on em-ecosystem `main` (rescue branch lives in parallel). No PR opened.

## 5. Deviations from Plan

| # | Step | Planned | Actual | Reason | Category | Follow-up |
|---|------|---------|--------|--------|----------|-----------|
| D1 | 5b (dashboard tests) | All tests PASS | 105/118 PASS, 13 fail across 5 suites (Button, Pagination, MfaTotpStep, SecurityActivity, ConnectedAccounts) | Failures Pre-existing on baseline `3a46248`. Cherry-picks do NOT touch `nexacore-dashboard/` (verified via empty `git diff` for that path). Audit 2026-05-06 was scoped to `auth` backend only — dashboard test posture was never validated. | **Pre-existing** | **SCRUM-389** (Sprint 14, MEDIUM) |
| D2 | 5a (dashboard build) | Clean | Lint Error in `Tooltip.tsx:16` (`@typescript-eslint/no-explicit-any` rule definition not found). Build EXIT 0 (non-fatal). | Pre-existing pre-SCRUM-385 — memoria SCRUM-348 record confirms: "verified unchanged vs main and SCRUM-342 merged with same condition" | **Pre-existing** | Linked to SCRUM-348 historical record (no new ticket — already accepted as no-action) |
| D3 | 0 (branch convention) | `feature/SCRUM-385-frontend` per `/develop` Step 0 standard | `rescue/visual-baseline` (no `feature/` prefix) | Rescue branches are operational artifacts, not feature work. §13.4 of workflow-standards establishes this naming convention for rescue work. | **Accepted-Trivial** | Documented (no action) |
| D4 | 8 (`/commit` push) | Standard `git push -u origin rescue/visual-baseline` | Same command + `--no-verify` flag (user-approved bypass) | Pre-push hook would re-run identical CI parity work that just passed in `/develop` (~10 min ago) AND would fail on the 13 D1 Pre-existing tests already ticketed. Different rationale from SCRUM-384's tag-only bypass. Hook fix tracked in SCRUM-388. | **Accepted-Trivial** | Documented (SCRUM-388 covers underlying fix) |

## 6. Test Results

| Package | Build | Tests | Notes |
|---------|-------|-------|-------|
| nexacore-api | EXIT 0 (`nest build`) | **1052/1052 PASS** in 69 suites, 14.4s | Includes new tests from SCRUM-356 cherry-pick. Above target ≥1042 |
| nexacore-dashboard | EXIT 0 (`next build`) — D2 lint Error non-fatal | 105/118 PASS, 13 Pre-existing FAIL — D1 → SCRUM-389 | 5 failing suites: Button, Pagination, MfaTotpStep, SecurityActivity, ConnectedAccounts |
| sat-cristian-garcia | EXIT 0 (`next build`) | N/A — no test suite | 87.3 kB First Load JS (matches SAT01-4 production build) |

**npm audit (high+)**: api 2L+10M+19H+1C / dashboard 4L+2M+7H / satellite 1M+4H. Same as baseline `3a46248` — no new HIGH/CRITICAL introduced by cherry-picks.

**Manual verification**: AC10 (visual smoke) is **USER-ACTION-PENDING** at /update-docs time. Checklist in plan §7. Must complete before SCRUM-386 (VRT regen) starts to avoid regenerating VRT from a regressed state — the exact failure mode that produced SCRUM-383.

## 7. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| 13 dashboard tests fail on baseline `3a46248` (5 suites) | MEDIUM | Discovered, not fixed in this ticket | **SCRUM-389** in Sprint 14 |
| `Tooltip.tsx:16` ESLint config Error (`@typescript-eslint/no-explicit-any` rule definition not found) | LOW | Discovered (Pre-existing, already known per SCRUM-348) | Linked to SCRUM-348 record. No new ticket. |
| Pre-push hook fails on tag pushes due to missing tag-skip logic | LOW | Discovered in SCRUM-384 | **SCRUM-388** (Backlog, follow-up from SCRUM-384). Re-confirmed during SCRUM-385 indirectly (didn't trigger here because rescue branch has source code, hook IS appropriate — but Pre-existing tests blocked, requiring `--no-verify` for a different reason — D4) |

## 8. Documentation Updates

| File | Changes Made |
|------|--------------|
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-385_frontend.md` | Plan (committed `7133319`) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-385_verify.md` | Verify report, verdict PASS-WITH-DEBT (committed `7133319`) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-385_frontend.md` | This record (committed in /update-docs phase) |

No spec updates required:
- `data-model.md` — N/A (no entity changes)
- `api-spec.yml` — N/A (SCRUM-356 is internal refactor, public API preserved)
- `integration-state.md` — N/A (no module/guard/service/permission changes; refactor preserves DI surface)
- `frontend-standards.mdc` / `backend-standards.mdc` / `audit-standards.mdc` — N/A
- `workflow-standards.mdc` — `§13.4.5 Cross-references` already mentions SCRUM-385 as a consumer (added during SCRUM-384). No further update needed.

## 9. Audit Finding Verification

N/A — SCRUM-385 is not an audit remediation ticket. It is an ops/rescue Task under the SCRUM-383 epic.

Note on side-effect: SCRUM-356's cherry-pick brings forward the DU-04 audit finding fix onto the rescue branch. SCRUM-356's "Done" status on Jira remains valid (the fix exists on `main` post-Tailwind 4 cascade); the rescue branch carries it forward as well. This is incidental, not the primary intent of SCRUM-385.

## 10. Lessons Learned

**What went well**:
- Both cherry-picks landed cleanly with auto-merges. The pessimistic risk assessment in /enrich-us about TS5↔TS6 syntax in SCRUM-356 turned out to be a non-issue — auth source uses vanilla TS, no version-sensitive syntax.
- Path-scoped staging discipline preserved concurrent agent's work (audit-2026-05-06T22-44/, SCRUM-354_*.md) untouched across both /commit and /update-docs phases.
- Pre-flight halt-conditions (5 checks before branch creation) caught nothing — clean state — but the discipline is what matters; future rescues need the same gate.

**What was harder than expected**:
- Local environment friction (Node 25 vs `.nvmrc=22` mismatch + Windows `node_modules` file-lock from open VS Code) cost ~30 min of user-driven recovery during /develop. The `.nvmrc` ↔ system node version drift is a Pre-existing condition. **NEW lesson** worth fixing long-term: install nvm-windows so `.nvmrc` is enforced automatically. Not in scope for this ticket.
- Dashboard test posture surprise: 13 tests rotting silently on `main` since at least the audit (2026-05-06). The `--coverageThreshold='{}'` setting in pre-push hook lets coverage off the hook, but fail/pass should still gate. Apparently merges to `main` had been using `--no-verify` or a different flow. Worth investigating during SCRUM-389's triage pass.
- Pre-push hook design has TWO independent gaps: (a) tag-only push gap (SCRUM-388), (b) no test-failure escalation/policy. Hook either runs full CI parity or is bypassed entirely; there's no middle ground for "tests fail but failures are tracked in a ticket".

**Recommendations for similar tickets (rescues / Pre-existing surfacing)**:
- Future rescues should run dashboard tests AT THE TAG COMMIT first as part of /enrich-us baseline assessment. Would have surfaced D1 before /develop.
- Pre-push hook should consult an "accepted-failure registry" (or env var `ACCEPTED_FAILING_TESTS=SCRUM-XXX`) so bypasses leave a paper trail rather than `--no-verify`. Worth a follow-up to SCRUM-388 — "extend hook to skip Accepted-* failures via configured registry".
- The Node `.nvmrc` enforcement gap deserves a workspace-level setup ticket. Currently `.nvmrc` is documentation-only on this machine; nvm-windows would close that.

**Pattern reusable for rescue lifecycle**:
The 6-step lifecycle (`/enrich-us → /plan → /develop → /verify → /commit → /update-docs`) worked for an ops/rescue ticket without modifications. Each step's adapted scope (no PR, no merge to main, branch in parallel) was declared in the plan and respected throughout. The pattern (declare adaptations once, respect across phases) is reusable for SCRUM-386 + SCRUM-387.
