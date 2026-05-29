# Frontend Implementation Plan: SCRUM-350 Phase 9b — Behavioral E2E tests for auth flows (Playwright)

> Plan written 2026-05-04. Original ticket scope is ~3 days of infrastructure work. This plan implements the **scaffolding portion** that can ship safely from a single development session. The runtime-validation portions (test bodies validated against running stack, docker-compose for E2E backend, CI workflow integration) are explicitly Deferred to follow-up work because they require local execution against a full app stack and shared-infrastructure changes that need supervised review.

## Header
**Frontend Implementation Plan: SCRUM-350 Playwright scaffolding (partial — body work + CI deferred)**

## Overview
Phase 9b of the audit framework is already specified in `audit-standards.mdc` (committed in SCRUM-347 docs commit `5ec1199`, AC3 satisfied). This plan delivers the executable infrastructure needed to actually run those 6 checks (FE-27..FE-32):

1. Install `@playwright/test` as devDependency.
2. Create `playwright.config.ts` with reasonable defaults (chromium + retries + timeouts).
3. Create `tests/e2e/auth-flows.spec.ts` with 6 `.skip`'d test stubs — each documented with the FE-XX check ID, the AC it satisfies, and a TODO describing the body.
4. Add `npm run test:e2e` script to `package.json`.
5. Document remaining work (docker-compose, CI workflow, fully-fleshed test bodies) as Deferred follow-ups.

## Scope

**In scope (this branch)**:
- Playwright dependency install.
- `playwright.config.ts` baseline.
- `tests/e2e/auth-flows.spec.ts` 6 test stubs.
- `package.json` script entry.
- Plan + verify + record in `ai-specs/`.

**Deferred (separate ticket / session)**:
- Test body fleshing-out — requires local stack running for iterative validation. Each test will be unskipped + filled in as part of a follow-up.
- `docker-compose.e2e.yml` for E2E backend stack (Postgres + Redis + nexacore-api). Affects local dev workflow, needs supervised setup.
- `.github/workflows/e2e.yml` CI integration. Affects shared CI infrastructure, needs supervised review.
- Cross-browser matrix (firefox + webkit) — chromium-only baseline first.

## Why this split
The core risk of running test bodies in a single development session is that Playwright tests need a real browser + real backend running locally to be validated. Fleshing out FE-27..FE-32 without that loop would produce code that is not actually green. Better to land the structure + clear TODOs that the next session can iterate on with the stack live.

## Implementation Steps

### Step 0: Branch
- Already on `feature/SCRUM-350-frontend` (cut from `main` post-SCRUM-349 merge).

### Step 1: Install Playwright
- `cd nexacore-dashboard && npm install --save-dev @playwright/test`.
- Verify `package.json` records the dep with a version pinned to current major.

### Step 2: Add npm script
- Edit `nexacore-dashboard/package.json`:
  ```json
  "scripts": {
    ...,
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
  ```

### Step 3: Create `playwright.config.ts`
- Path: `nexacore-dashboard/playwright.config.ts`.
- Baseline: chromium only, headless, 30s timeout, 2 retries on CI, base URL `http://localhost:3001` (matches Next.js dev port), webServer optional (off by default — assumes user starts dev server manually for now).

### Step 4: Create `tests/e2e/auth-flows.spec.ts`
- Path: `nexacore-dashboard/tests/e2e/auth-flows.spec.ts`.
- 6 test stubs, each `test.skip(...)` with a TODO comment describing the body.
- Each stub has the FE-XX check ID + the SCRUM ticket reference + AC reference.

### Step 5: Update `tsconfig` / lint exclusions
- The new `tests/e2e/` folder uses Playwright types and runs OUTSIDE Jest. Need to verify tsconfig and Jest config don't try to type-check or run E2E specs.
- Verify Jest's `testMatch` already excludes `tests/e2e/**` (it should — current config is `**/*.test.ts` / `**/*.test.tsx`, and E2E specs use `.spec.ts` extension under `tests/e2e/`).

### Step 6: Documentation
- Plan + verify + record in this directory.
- No changes needed to `audit-standards.mdc` (Phase 9b already documented per SCRUM-347 commit `5ec1199`).
- `frontend-standards.mdc` — could add a short "E2E test conventions" sub-section but defer until tests are fleshed out (avoids stale docs).

## Implementation Order
1. Step 0 — Branch (done).
2. Step 1 — Install.
3. Step 2 — npm scripts.
4. Step 3 — playwright.config.ts.
5. Step 4 — auth-flows.spec.ts skeleton.
6. Step 5 — verify Jest exclusion.
7. Step 6 — plan + verify + record (this run).

## Testing Checklist
- [ ] `npm install` works (dependency resolves).
- [ ] `npx playwright --version` returns a version.
- [ ] `npm run test:e2e` exits cleanly with "0 tests run" or "6 skipped" — no crash.
- [ ] `npm test` (Jest) does NOT pick up `tests/e2e/**` (verify exclusion).
- [ ] `npm run build` still passes — Playwright types must not bleed into Next.js build.

## Acceptance Criteria

- **AC1** `npm run test:e2e` passes locally with backend up: **PARTIAL** — script exists and binary works; bodies are `.skip` until follow-up. Filling them in requires running stack.
- **AC2** CI runs E2E on every PR to main: **DEFERRED** — separate ticket for `.github/workflows/e2e.yml`.
- **AC3** audit Phase 9b documented with 6 checks: **DONE** — already in `audit-standards.mdc` via SCRUM-347 commit `5ec1199`.
- **AC4** SCRUM-342 specific cases (FE-28 wrong password toast text, FE-31 first-vs-repeat toast variants) covered: **PARTIAL** — stubs reference these cases in their TODO comments; bodies pending follow-up.

## Notes
- Browser binaries (`npx playwright install chromium`) are NOT auto-installed by `npm install`. Document this in the test file header so the next contributor knows to run that command before iterating on test bodies.
- Test infrastructure (docker-compose) for booting Postgres + Redis + nexacore-api in CI mode is the bulk of the remaining ~3 days. Trying to commit it without local validation against a fresh checkout is risky.
- CI workflow modifications affect every PR going forward — supervised review preferred.

## Implementation Verification
- [ ] AC3 verified.
- [ ] AC1/AC2/AC4 status: PARTIAL or DEFERRED (documented in /verify Deviations table).
