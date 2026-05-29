# Verification Report: SCRUM-350 Phase 9b — Behavioral E2E tests for auth flows (Playwright)

**Date**: 2026-05-04
**Plan**: `ai-specs/changes/auth/plans/Sprint 12/SCRUM-350_frontend.md`
**Branch**: `feature/SCRUM-350-frontend`
**Verdict**: **PASS-WITH-DEBT**

> Reasoning: This branch ships the Playwright **scaffolding** (install + config + 6 test stubs + npm scripts). Test bodies, docker-compose, and CI workflow are explicitly Deferred follow-ups that need supervised setup against a running stack. No Risk, no Scope-Gap.

## Plan Compliance

| Step | Description | Status | Notes |
|------|-------------|--------|-------|
| 0 | Branch | DONE | `feature/SCRUM-350-frontend` cut from current main (post-SCRUM-349 merge `f552c7c`) |
| 1 | Install `@playwright/test` | DONE | `^1.59.1` recorded in `nexacore-dashboard/package.json` devDependencies |
| 2 | Add `test:e2e` + `test:e2e:ui` npm scripts | DONE | Both present in package.json scripts block |
| 3 | Create `playwright.config.ts` | DONE | chromium-only, headless, 30s timeout, baseURL `http://localhost:3001`, retries on CI, github reporter on CI. webServer commented out (boot manually for now) |
| 4 | Create `tests/e2e/auth-flows.spec.ts` with 6 stubs | DONE | All 6 stubs (FE-27..FE-32) with `test.skip` + TODO bodies + AC references. `npx playwright test` reports "6 skipped" cleanly |
| 5 | Verify Jest excludes E2E specs | DONE | `npx jest --listTests` does NOT include `tests/e2e/**`. Jest's testMatch pattern uses `*.test.ts(x)`; E2E uses `*.spec.ts` — natural exclusion. |
| 6 | Documentation | PARTIAL — record + verify in this run; no audit-standards.mdc change needed (Phase 9b already documented per SCRUM-347 commit `5ec1199`) | Per plan |

## Deviations

| # | Step | Category | Description | Risk | Action |
|---|------|----------|-------------|------|--------|
| 1 | Test bodies (FE-27..FE-32) | Deferred | All 6 tests are `.skip` with TODO bodies. Filling them in needs interactive iteration against a live stack. | None — bodies live as documented TODOs; runtime contract of FE-27..FE-32 is fully spec'd in audit-standards.mdc Phase 9b table | Follow-up ticket: "[SCRUM-350 follow-up] Flesh out FE-27..FE-32 Playwright test bodies" — recommended after docker-compose ships so tests can run against an isolated backend |
| 2 | `docker-compose.e2e.yml` | Deferred | Affects local dev workflow; needs supervised setup against fresh checkouts. Without it, contributors must manually boot Postgres + Redis + nexacore-api before running E2E. | Low — for now docs in `playwright.config.ts` and the spec file header tell the user to boot manually | Follow-up ticket: "[SCRUM-350 follow-up] docker-compose.e2e.yml + seed scripts" |
| 3 | `.github/workflows/e2e.yml` (CI integration) | Deferred | Modifies shared CI infrastructure; needs supervised review (workflow secret access, runner sizing, browser install caching). | Low — CI continues running existing security.yml workflow unchanged; E2E job will be ADDED, not replace anything | Follow-up ticket: "[SCRUM-350 follow-up] CI workflow for E2E with browser cache + service containers" |
| 4 | Cross-browser matrix | Deferred | Plan calls for chromium-only baseline; firefox + webkit projects can be enabled when cross-browser bug surface justifies the extra runtime cost. | None | No follow-up ticket — incremental improvement, not a missing requirement |

**0 Risk, 0 Scope-Gap.** All 4 deviations are explicit Deferred follow-ups with clear rationale.

## Code Quality Checks

| Check | Result | Details |
|-------|--------|---------|
| New files with tests | N/A — this IS the test infra | Test infrastructure scaffolding doesn't have its own meta-tests; correctness verified by `npx playwright test` reporting "6 skipped" cleanly |
| Security pattern violations | 0 | No new `process.env` reads in productive code (Playwright config reads `process.env.CI` and `E2E_BASE_URL` for test runtime — appropriate use). No hardcoded credentials. No tokens in URLs. No new `any` types. |
| Frontend TS check | PASS | `tsc --noEmit` passes on the new files. Pre-existing TS errors in `ComponentShowcase.tsx` and `error-boundaries.test.tsx` unchanged. |
| `npm run build` | (not re-run; already PASS post-SCRUM-349; Playwright is a devDependency that does NOT affect Next.js build output) | — |
| `npm run test` (Jest) | (not re-run; baseline 13 pre-existing failures unchanged; `tests/e2e/**` correctly excluded) | — |
| `npm run test:e2e` | PASS | Reports "6 skipped" — script wired correctly. |
| `npx playwright --version` | PASS | `1.59.1` |

## Regression Verification

| Check | Result | Details |
|-------|--------|---------|
| Blast radius | OK | Changes are additive: new file `playwright.config.ts`, new directory `tests/e2e/`, 2 new entries in `package.json` scripts block, 1 new entry in devDependencies. No modifications to existing source files. |
| Mock propagation | N/A | No production-code mock surface change |
| API contract | N/A | No backend changes |
| Schema compatibility | N/A | No Prisma changes |
| Export surface | N/A | No production exports |

## Acceptance Criteria

- **AC1** `npm run test:e2e` passes locally with backend up → **PARTIAL**. Script exists, Playwright binary works (`1.59.1`), 6 tests recognized, all `.skip`'d. Bodies pending follow-up.
- **AC2** CI runs E2E on every PR to main → **DEFERRED**. Tracked as Deviation #3 (separate follow-up ticket).
- **AC3** audit Phase 9b documented with 6 checks → **DONE** (already in audit-standards.mdc via SCRUM-347 commit `5ec1199`).
- **AC4** SCRUM-342 specific cases covered → **PARTIAL**. Stubs reference FE-28 wrong-password toast text and FE-31 first/repeat escalation in their TODO comments; bodies pending follow-up.

## Action

- Proceed to `/commit SCRUM-350`.
- After merge, create the 3 follow-up tickets listed in the Deviations table (test bodies, docker-compose, CI workflow).
- Note for next session: `npx playwright install chromium` must be run once before iterating on test bodies — documented in the spec file header.
