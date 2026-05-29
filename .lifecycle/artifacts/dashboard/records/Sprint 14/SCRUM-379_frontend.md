# Implementation Record: SCRUM-379 Visual Regression Testing infrastructure

## 2. Summary

Shipped Playwright-based Visual Regression Testing (VRT) for both `nexacore-dashboard` and `satellites/sat-cristian-garcia`. CI workflow `.github/workflows/visual-regression.yml` runs the comparison on every PR touching `src/`, fails on > 0.2% pixel diff, and uploads HTML diff reports as artifacts. Baseline is captured on Linux CI (canonical platform) via a `workflow_dispatch` trigger that checks out a configurable `baseline_ref` and commits the resulting screenshots back to the branch.

- **Scope**: `frontend` (test infra + CI workflow + docs)
- **Branch**: `feature/SCRUM-379-vrt-baseline`
- **Date**: 2026-05-09

## 4. Commits

| Hash | Message |
|------|---------|
| `6245457` | SCRUM-379: Visual Regression Testing infrastructure (dashboard + satellite) (#273) |

Post-merge action: `gh workflow run visual-regression.yml -f capture_baseline=true -f baseline_ref=ee309e6 -f package=both` triggered run `25599604539` to capture the pre-Tailwind-4 baseline on Linux. The workflow auto-commits the screenshots back to main as `chore(SCRUM-379): refresh ... baseline ... [skip ci]`.

## 5. Deviations from Plan

| Step | Planned | Actual | Reason | Category |
|------|---------|--------|--------|----------|
| 3 | Capture baseline locally on Windows | Capture baseline on Linux CI via `workflow_dispatch` | Local Windows OneDrive runs took 19 min/run with 9/10 timeouts (Turbopack first-render on OneDrive-synced FS). Even on faster machines, pixel rendering varies by OS — locally-captured snapshots wouldn't match Linux CI anyway. | **Accepted-Quality** — pivot is the canonical pattern (Vercel/Stripe/Linear/Atlassian use the same approach) |

## 6. Test Results

- Dashboard: existing 118/118 unit tests pass (unchanged — VRT is separate test layer)
- Satellite: build clean (no test suite originally)
- Build: PASS in both packages
- Lint: 0 errors / 0 warnings in both packages
- Audit: 0 vulnerabilities

## 7. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Local Windows VRT capture times out | LOW | Pivoted to CI-only capture | Documented as canonical pattern in frontend-standards.mdc |

## 8. Documentation Updates

| File | Changes |
|------|---------|
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-379_frontend.md` | This record (NEW) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-379_frontend.md` | Plan |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-379_verify.md` | Verify |
| `ai-specs/specs/frontend-standards.mdc` | New "Visual Regression Testing (VRT)" subsection under Testing Framework |

## 10. Lessons Learned

- **OneDrive + Turbopack + Playwright = unworkable locally**. Each route's first-render takes 60-90s due to Turbopack writing build artifacts back through OneDrive sync. Total run time (~15 routes × 2 themes × ~90s) exceeds 30 minutes. **Future infra-test work should default to CI-runner-first** for any tooling sensitive to filesystem performance.
- **Pixel-rendering is platform-specific**. Even if local Windows capture succeeded, those snapshots would not match Linux CI. The "CI-only baseline" is not a workaround — it's the right answer (and why every commercial VRT SaaS like Chromatic / Percy runs in their own infrastructure).
- **The `workflow_dispatch` baseline-capture pattern** (with a `baseline_ref` input that switches the source code, captures, then switches back) is portable and reusable for any future tooling with the same shape (e.g. accessibility audit baselines).
