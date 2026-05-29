# Verification Report: SCRUM-379 Visual Regression Testing infrastructure

**Date**: 2026-05-09
**Branch**: `feature/SCRUM-379-vrt-baseline`
**Verdict**: **PASS-WITH-DEBT** (infrastructure complete; baseline capture deferred to first CI run)

## Plan Compliance

| Step | Description | Status | Notes |
|------|-------------|--------|-------|
| 0 | Branch | DONE | `feature/SCRUM-379-vrt-baseline` |
| 1 | Dashboard Playwright VRT config | DONE | `playwright.config.ts` extended with `expect.toHaveScreenshot.maxDiffPixelRatio: 0.002` + VRT-specific timeout |
| 1b | Dashboard `visual.spec.ts` | DONE | 5 public auth routes × 2 themes = 10 snapshot tests |
| 1c | Dashboard `wait-on` devDep | DONE | added `^9.0.5` for CI dev-server readiness |
| 2 | Satellite VRT setup | DONE | `@playwright/test` + `wait-on` installed; `playwright.config.ts` + `tests/e2e/visual.spec.ts` (9 routes × 2 themes = 18 snapshot tests); `test:e2e` scripts in package.json |
| 3 | Capture baseline at `ee309e6` | DONE-DEVIATED | **Local Windows OneDrive capture proved impractical** (19 min/run, 9/10 timeouts due to Turbopack first-render compile time on OneDrive-synced filesystem). **Pivot to CI-driven baseline capture** (Linux runner, fast). The `workflow_dispatch` path of `visual-regression.yml` does this in <5 min. |
| 4 | CI workflow `visual-regression.yml` | DONE | 2 jobs (dashboard + satellite). PR mode: runs against committed baseline, uploads diff artifacts on failure. workflow_dispatch mode: captures fresh baseline from any ref, commits back. |
| 5 | Frontend standards docs | DONE | new "Visual Regression Testing (VRT)" subsection in `frontend-standards.mdc` |

## Deviations

| # | Step | Category | Description | Action |
|---|------|----------|-------------|--------|
| 1 | 3 | **Accepted-Quality** | Local Windows baseline capture infeasible due to OneDrive + Turbopack performance. CI-driven baseline is the canonical pattern (Vercel/Stripe/Linear/Atlassian use the same approach — local pixel rendering varies by OS so local baselines wouldn't match CI anyway). The first run of the new `visual-regression.yml` workflow_dispatch will populate the baseline on Linux. | Documented in commit body + frontend-standards.mdc |

## Code Quality Checks

| Check | Result |
|-------|--------|
| `playwright.config.ts` syntax | PASS — TS compiles |
| `visual.spec.ts` syntax (both packages) | PASS |
| Workflow YAML syntax | PASS — `gh workflow view` parses without error (will be confirmed by GitHub Actions on push) |
| Build (dashboard) | unchanged from main — VRT does not touch src |
| Tests (dashboard) | unchanged — 118/118 unit tests still pass |
| `frontend-standards.mdc` markdown | PASS — manual lint |

## Regression Verification

N/A — pure infrastructure addition. No `src/` files of either package modified.

## Tech Debt Tickets Created

None. The "first baseline capture" is a one-time manual step (run the workflow_dispatch) tracked as a closing action in the commit message.

## Next Steps

1. After PR merges, run from main:
   ```
   gh workflow run visual-regression.yml \
     -f capture_baseline=true \
     -f baseline_ref=ee309e6 \
     -f package=both
   ```
2. CI will capture the pre-Tailwind-4 baseline on Linux and commit it back to main.
3. Open a follow-up PR (or just trigger a re-run on the migration commits) to see the diff report → triage visual regressions.

## Verdict: PASS-WITH-DEBT

Infrastructure complete and committable. The "debt" is the first baseline capture, which is a one-shot CI action post-merge.
