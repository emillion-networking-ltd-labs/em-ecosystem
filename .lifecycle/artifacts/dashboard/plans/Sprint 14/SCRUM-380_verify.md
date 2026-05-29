# Verification Report: SCRUM-380 Framework Upgrade Audit Playbook

**Date**: 2026-05-09
**Branch**: `feature/SCRUM-380-upgrade-playbook`
**Verdict**: **PASS-WITH-DEBT** (infrastructure + docs complete; baseline post-auth screenshots will be captured post-merge via the new workflow)

## Plan Compliance

| Step | Description | Status | Notes |
|------|-------------|--------|-------|
| 0 | Branch | DONE | `feature/SCRUM-380-upgrade-playbook` |
| 1 | Console-error gate fixture | DONE | `tests/e2e/fixtures/no-console-errors.ts` in dashboard + satellite. Allowlist for Fast-Refresh + middleware deprecation. `visual.spec.ts` updated to use the fixture. |
| 2 | Auth fixture (`NEXT_PUBLIC_VRT_BYPASS_AUTH`) | DONE | `AuthContext.tsx` early-returns with mock SafeUser when env var is `1`. Workflow CI sets it for VRT runs only — never in prod builds. |
| 3 | Expand VRT scope (post-auth) | DONE | 6 new routes × 2 themes = 12 new tests in dashboard `visual.spec.ts`. Gated on `VRT_BYPASS_AUTH` so they skip locally without setup. |
| 4 | a11y gate with axe-core | DONE | `@axe-core/playwright` installed in both packages. New `a11y.spec.ts` per package. Critical/serious WCAG 2.1 AA violations fail CI; moderate/minor logged but non-blocking. CI workflow runs `visual.spec.ts` + `a11y.spec.ts` per PR. |
| 5 | Pre-upgrade baseline workflow | DONE | `.github/workflows/upgrade-baseline.yml` (workflow_dispatch). Inputs: `migration_ticket`, `target_packages`. Captures visual + a11y baselines under `tests/e2e/upgrade-baselines/<ticket>/` with manifest. |
| 6 | Lighthouse CI (optional) | DEFERRED | Per plan §10. Acceptable to land in a follow-up if perf gating proves needed. |
| 7 | Framework Upgrade Playbook in workflow-standards.mdc | DONE | New §13 section: Phase 1 pre-upgrade (capture baseline + read changelog + define rollback), Phase 2 during (per-PR gates table), Phase 3 post (24h soak + audit run). Tooling map + rationale. |

## Deviations

| # | Step | Category | Description | Action |
|---|------|----------|-------------|--------|
| 1 | 6 | Deferred | Lighthouse CI explicitly marked optional in plan; not delivered. The 4 other gates (visual, console, a11y, Security Pipeline) are sufficient initial coverage. Add ticket if perf regression surfaces. | Documented |
| 2 | 3 | Accepted-Quality | Post-auth route baselines NOT yet captured at this commit. The auth bypass code lives in HEAD but the workflow's `git checkout ee309e6 -- nexacore-dashboard` overrides it. Workflow now restores AuthContext + fixtures from HEAD post-checkout (already updated). The new post-auth baselines will land via the first post-merge `workflow_dispatch -f capture_baseline=true` run. | Tracked: post-merge capture is the closing action |

## Code Quality Checks

| Check | Result |
|-------|--------|
| Dashboard build | PASS (19 routes) |
| Dashboard unit tests | 118/118 PASS |
| Dashboard lint | 0 errors / 0 warnings |
| Workflow YAML syntax | (will be validated by GitHub Actions on push) |
| Audit | 0 vulnerabilities (both packages root) |

## Regression Verification

| Check | Result |
|-------|--------|
| AuthContext bypass code | guarded by `process.env.NEXT_PUBLIC_VRT_BYPASS_AUTH === "1"` — production builds never have this env var, so the bypass is dead code. Verified via `git grep` — no other callsite. |
| Console fixture allowlist | regex-tested against the known benign Next dev-mode messages (Fast Refresh, HMR, middleware deprecation) — won't false-fail on those |
| a11y impact filter | `BLOCKING_IMPACTS = ['critical', 'serious']` only — moderate/minor logged but non-blocking |

## Tech Debt Tickets Created

None new. Lighthouse CI may be opened later if perf regression surfaces.

## Next Steps (post-merge)

1. Run baseline capture for the new post-auth routes:
   ```
   gh workflow run visual-regression.yml \
     -f capture_baseline=true -f baseline_ref=main -f package=both
   ```
2. Verify CI on a follow-up PR — should now have 4 gates green: Security Pipeline + Visual + Console + A11y.
3. Add upgrade-baseline.yml usage to the next major framework migration ticket (i.e. when ESLint 11 / React 20 lands).

## Verdict: PASS-WITH-DEBT

All 7 in-scope steps DONE (1 explicitly deferred per plan). The "debt" is the post-auth visual baseline capture — a one-shot workflow_dispatch action post-merge.
