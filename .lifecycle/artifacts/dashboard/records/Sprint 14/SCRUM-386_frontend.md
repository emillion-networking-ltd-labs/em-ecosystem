# Implementation Record: SCRUM-386 Regenerate VRT Baseline from Rescue Tag

## 2. Summary

Replaced the contaminated VRT baseline (originally captured from `ee309e6` post-TS6) with a clean baseline captured from the SCRUM-384 rescue tag `v-baseline-2026-05-06-auth-green`. Both packages re-baselined: satellite on first dispatch (14 PNGs), dashboard on second dispatch after a workflow overlay fix (22 PNGs — 10 replaced + 12 new post-auth routes). `workflow-standards.mdc` §13.1 + §13.4.5 tightened with normative "tag, not commit" rule. The new baseline becomes the canonical reference for all PR comparisons; SCRUM-387 will reconcile the existing main↔rescue drift via per-major-bump PRs that explicitly accept visual changes.

- **Scope**: feature work on em-ecosystem-code main + docs-direct-to-main on ai-specs
- **Branches**: `feature/SCRUM-386-frontend` (PR #282) + `feature/SCRUM-386-overlay-fix` (PR #283 follow-up)
- **Implementation date**: 2026-05-10

## 3. Plan Reference

- **Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-386_frontend.md`
- **Verify report**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-386_verify.md` (verdict: PASS)
- **Plan was followed**: Partially — primary path executed, but a workflow design gap surfaced during dispatch that required PR #283 (overlay fix). This wasn't anticipated in the original plan. See Section 5 D3.

## 4. Commits

| Hash | Repo | Branch | Message | Notes |
|------|------|--------|---------|-------|
| `f7269dd` | em-ecosystem-code | feature/SCRUM-386-frontend | SCRUM-386: VRT default baseline_ref → v-baseline-2026-05-06-auth-green | 4-line YAML edit |
| `c4f161d` | em-ecosystem-code | main | (squash of `f7269dd` via PR #282) | Default change merged |
| `1d27ec2` | em-ecosystem-code | main | chore(SCRUM-379): refresh satellite VRT baseline from v-baseline-2026-05-06-auth-green [skip ci] | Auto-commit by github-actions[bot], 14 PNGs + .eslintrc.json |
| `ff8751e` | em-ecosystem-code | feature/SCRUM-386-overlay-fix | SCRUM-386: overlay layout.tsx from HEAD during dashboard capture | 7-line YAML edit (overlay extension) |
| `cd27c2b` | em-ecosystem-code | main | (squash of `ff8751e` via PR #283, --admin merge) | Overlay fix merged despite R8 satellite VRT red |
| `e147d3c` | em-ecosystem-code | main | chore(SCRUM-379): refresh VRT baseline from v-baseline-2026-05-06-auth-green [skip ci] | Auto-commit by github-actions[bot], 22 PNGs + .eslintrc.json |
| `fe23a8b` | ai-specs | main | docs(SCRUM-386): VRT baseline regen + §13.1/§13.4.5 'tag not commit' rule | Plan + verify + spec updates |

**Two PRs** because the workflow design needed a follow-up. Both branches deleted on merge per `--delete-branch`. Two auto-commits by `github-actions[bot]` (one per package, separate workflow runs).

## 5. Deviations from Plan

| # | Step | Planned | Actual | Reason | Category | Follow-up |
|---|------|---------|--------|--------|----------|-----------|
| **D1** | 2-8, 10 | Sequential lifecycle | Steps 2-8 + 10 deferred to `/commit` | Per `feedback_local_first_before_push.md` (`/develop` is local-only). Same precedent as SCRUM-384/385. | **Accepted-Trivial** | — |
| **D2** | 1 | YAML diff ≤8 lines | YAML diff is 4 lines | Plan was conservative. Workflow input `baseline_ref` is defined ONCE (shared between dashboard + satellite jobs), not duplicated. | **Accepted-Trivial** | — |
| **D3** | 6 (workflow run) | First dispatch succeeds for both packages | First dispatch: satellite SUCCESS, dashboard FAILED (22/22 visual tests rejected by `no-console-errors.ts` fixture due to benign Next 16 nonce hydration warning) | Pre-fda0b94 rescue source produces benign nonce warning. Workflow's HEAD overlay (originally for AuthContext + visual.spec + fixtures) didn't include `layout.tsx` (which contains fda0b94's `suppressHydrationWarning`). Surgical fix: PR #283 added `layout.tsx` to the overlay list. Second dispatch SUCCESS. | **Accepted-Trivial** (workflow design gap, fixed inline) | — (fix already shipped in PR #283) |
| **D4** | 4 (PR merge) | Standard `gh pr merge --squash --delete-branch` after VRT/a11y green | Used `--admin` flag on PR #283 because Satellite Visual Regression failed with R8 expected drift (rescue baseline vs current main satellite render — Tailwind 4 padding produces ~23-27px height diff, 0.15-0.16 pixel ratio) | This is the design — rescue baseline IS the new reference; main has drifted. PR #283 doesn't introduce drift, it surfaces pre-existing drift. SCRUM-387 will reconcile per-major. User explicitly approved the override. | **Accepted-Risk LOW** (user-approved during /commit) | SCRUM-387 reconciles |
| **D5** | 8 (verification PR) | Open trivial no-op PR to confirm baseline operational | Skipped | A no-op PR would still trigger satellite VRT failure (same R8 drift as PR #283 and any other PR until SCRUM-387 lands). The no-op verification doesn't add evidence — capture success on the workflow run is direct proof. | **Accepted-Trivial** | — |

**Classification rationale (decision tree)**:
- D1, D2, D3, D5: Q1 (security/auth/data) NO → Q2 (test coverage) NO → Q3 (technical justification) YES → Accepted-Trivial
- D4: Q1 (security) NO → Q2 (test coverage) NO → relates to SECURITY of the visual baseline reference. Originally LOW because (a) the diff is real and detectable, (b) it's the intended detection mechanism, (c) SCRUM-387 has a clear path to reconcile. User approved with full context.

## 6. Test Results

| Component | Build | Tests | Notes |
|-----------|-------|-------|-------|
| em-ecosystem PR #282 CI | All 14 checks | All GREEN | Including Visual Regression (PR-comparison path, dashboard render unchanged in PR) |
| em-ecosystem PR #283 CI | 12/14 checks | 12 GREEN, 1 FAIL (Satellite VRT — R8 expected drift), 1 PASS (Dashboard VRT) | Admin-merged with R8 acknowledgment |
| Workflow run #1 (both packages) | satellite: 1m49s SUCCESS | dashboard: FAILED on no-console-errors fixture | Triggered D3 fix |
| Workflow run #2 (dashboard only) | dashboard: SUCCESS | All 22 visual tests captured | After PR #283 merge |

Manual verification: not required — capture success demonstrates baseline is operational.

## 7. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Workflow capture path's HEAD overlay missed `layout.tsx`, blocking capture from pre-fda0b94 refs | LOW (workflow design gap) | **Fixed in PR #283** | layout.tsx added to overlay list. Now generic — works for any rescue ref that predates fda0b94. |
| `Tooltip.tsx:16` ESLint config Error (Pre-existing from SCRUM-385) | LOW | Still present | No action — Pre-existing pattern, documented in SCRUM-348/SCRUM-385 |
| 13 dashboard test failures on baseline (Pre-existing from SCRUM-385) | MEDIUM | Tracked | SCRUM-389 (Sprint 14, MEDIUM) — note: did NOT block PR #282 CI, fixture-skipped on Linux runner; only surfaced locally on Windows |

## 8. Documentation Updates

| File | Changes Made |
|------|--------------|
| `em-ecosystem-code/.github/workflows/visual-regression.yml` | (1) line 44 description: `default: ee309e6 = pre-Tailwind-4` → `default: v-baseline-2026-05-06-auth-green = SCRUM-384 rescue baseline, pre-cascade`. (2) line 46 default value: `"ee309e6"` → `"v-baseline-2026-05-06-auth-green"`. (3) lines 107-114 capture step HEAD overlay extended with `nexacore-dashboard/src/app/layout.tsx`. Plus 6-line comment block explaining the fda0b94 dependency. |
| `ai-specs/specs/workflow-standards.mdc` §13.1 | Added MANDATORY rule paragraph (line 681): `source-ref` and `baseline_ref` MUST be a `v-baseline-*` tag, never a commit hash with in-flight upgrades. References the 2026-05-08–10 incident as concrete example. Reviewers must block non-tag refs. |
| `ai-specs/specs/workflow-standards.mdc` §13.4.5 | Replaced loose "regenerate from rescue branch" bullet with normative "from a `v-baseline-*` tag" version (line 772). References SCRUM-386's default change as enforcement; cross-refs §13.4.4 (immovability). |

No other technical doc updates required:
- `data-model.md` — N/A (no entity changes)
- `api-spec.yml` — N/A (no endpoint changes)
- `integration-state.md` — N/A (no module/guard/service/permission changes)
- `frontend-standards.mdc` / `backend-standards.mdc` / `audit-standards.mdc` — N/A

## 9. Audit Finding Verification

N/A — SCRUM-386 is not an audit remediation ticket.

## 10. Lessons Learned

**What went well**:
- The HEAD-overlay pattern (already in place for AuthContext + visual.spec + fixtures) extended cleanly to `layout.tsx` — same architectural principle, surgical addition.
- Two-PR sequence (default change first, overlay fix second) was discoverable during /commit and didn't require replanning. The plan's risk register flagged R6 ("auto-restore of HEAD + bypass code over baseline_ref produces unexpected diff") which captured the spirit of what happened.
- User-approval gate on Accepted-Risk D4 (admin-merge for R8 drift) worked cleanly — the rationale was already pre-classified as "expected behavior" in plan §3, so user could decide quickly with full context.
- Commit message audit trail (especially `fe23a8b`'s detailed body) preserves enough context to reconstruct the entire SCRUM-386 lifecycle even without reading the plan/verify docs.

**What was harder than expected**:
- The plan's R1 (HIGH — "workflow capture failure: lockfile/registry") didn't fire, but R6 did — and R6 was MEDIUM. The actual cause was a content-level mismatch (nonce warning), not a tooling-level mismatch. R6's mitigation ("watch the run") was correct but reactive.
- Satellite drift D4 was anticipated as R8 in the plan, but the actual magnitude (0.15-0.16 pixel ratio = 690k+ pixels different) is larger than what "expected behavior" suggests. The drift is real and visible — Tailwind 4 padding defaults change page heights by 20-30px, which compounds across stacked sections. Worth noting in SCRUM-387's plan that satellite drift is significant.
- The Pre-existing 13 dashboard test failures (D1 from SCRUM-385) did NOT surface in PR CI — Linux jest runs cleanly. Only Windows local sees them. Suggests the tests have OS-dependent assertions or jest config issues. Worth investigating in SCRUM-389.

**Recommendations for similar tickets (rescue baseline regen)**:
- Future rescue baseline regens should pre-flight by running the workflow_dispatch capture on a TEST clone first (or in a dry-run mode if added), to surface fixture-rejection issues before consuming a PR cycle.
- The HEAD-overlay pattern is a powerful technique but its scope keeps growing (AuthContext + visual.spec + fixtures + now layout.tsx). At 5+ files, consider refactoring to "overlay everything from a `vrt-overlay-files.txt` manifest" or "overlay everything in `nexacore-dashboard/tests/`" for explicitness.
- The fixture (`no-console-errors.ts`) doesn't have a CAPTURE_MODE bypass. SCRUM-381 (or a new follow-up) could add one — distinguishing capture (where warnings present at the captured ref are by definition "the baseline") from comparison (where new warnings are regressions). Until then, pre-fda0b94-style fixes need overlay treatment.

**Pattern reusable for SCRUM-387**:
- Each per-major-bump PR under SCRUM-387 will face the same R8 "expected drift" pattern. Plan author should pre-mark the PR's VRT failure as "expected — accepts visual change from <major>" and document the bumped baseline as part of the PR body. Admin-merge override is not a workaround; it's the workflow.
- The 2-PR sequence (default change + capture-fix follow-up) demonstrates that workflow infrastructure changes need their own iteration cycle separate from baseline content changes. SCRUM-387's per-major PRs should keep these phases distinct.
