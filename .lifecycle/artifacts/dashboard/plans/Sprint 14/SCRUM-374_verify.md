# Verification Report: SCRUM-374 Jest 29 → 30 (dashboard)

**Date**: 2026-05-08
**Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-374_frontend.md`
**Branch**: `feature/SCRUM-374-jest-30`
**Verdict**: **PASS**

Jest 29.7.0 → 30.4.1 + jest-environment-jsdom 29.7.0 → 30.4.1 + @types/jest 29 → 30 in dashboard. Closes the 4 known jsdom lows (`@tootallnate/once` chain) — dashboard `npm audit` is now **0 vulnerabilities total** for the first time.

## Plan Compliance

| Step | Description | Status | Notes |
|------|-------------|--------|-------|
| 0 | Branch | DONE | `feature/SCRUM-374-jest-30` |
| 1 | Bump jest deps | DONE | jest, jest-environment-jsdom, @types/jest |
| 2 | Re-evaluate previously-removed overrides (glob/minimatch) | SKIPPED | Not necessary — Jest 30 ships test-exclude@7 with glob@10 internal API; current install has 0 vulns without overrides |
| 3 | Verify jest config | DONE | No `jest.config.mjs` changes required |
| 4 | Reinstall + tests | DONE-DEVIATED | Initially 8 test failures; resolved by source refactor (see deviations) |
| 5 | Build + lint | DONE | Both clean |
| 6 | Documentation | PENDING | `/update-docs` will run |

## Deviations

| # | Step | Category | Description | Risk | Action |
|---|------|----------|-------------|------|--------|
| 1 | 2 | Accepted-Trivial | Skipped reintroduction of glob/minimatch overrides — current install is already 0 vulns total without them. | None | Documented |
| 2 | 4 | Accepted-Trivial | **jsdom 26 (bundled with jest 30) locked down `window.location` entirely** — `assign`, `replace`, `href`, `pathname` are all read-only + non-configurable. Two test files (AuthContext, ConnectedAccounts) used `Object.defineProperty(window, 'location', ...)` which throws under jsdom 26. Resolution: (a) AuthContext: use `delete window.location` + plain object reassignment (works because the location object itself is still deletable); (b) ConnectedAccounts: refactored source to use a thin `navigateTo()` wrapper in `src/lib/navigation.ts` (1 new file, 5 lines), then mocked the wrapper module in the test. The wrapper is mockable cleanly via `jest.mock('@/lib/navigation', ...)`. | None | Documented |

The wrapper-module pattern is a strict improvement: navigation calls are now testable across the codebase without fighting jsdom internals. Future tests in other files (`MfaSetupStep`, `error.tsx`, etc.) can adopt the same pattern when they need test coverage.

## Code Quality Checks

| Check | Result |
|-------|--------|
| Tests | **118/118 passing** (18 suites) |
| Build | PASS — 19 routes generated |
| Lint | 0 errors / 0 warnings (flat config) |
| Audit (all deps, level=high) | **0 vulnerabilities total** (was 4 lows in jsdom chain) |
| Audit (prod-only, level=moderate) | 0 vulns |

## Regression Verification

| Check | Result |
|-------|--------|
| Blast radius files verified | OK — only ConnectedAccounts.tsx source changed (1 line: `window.location.assign(...)` → `navigateTo(...)`); the new `navigation.ts` is a single-export module. |
| Mock propagation | OK — only ConnectedAccounts test needed updating (source had only 1 callsite). The other 4 `window.location` usage sites in source remain unchanged (no failing tests). |
| API contract | N/A |
| Schema | N/A |

## Audit Finding Resolution

N/A — non-audit ticket.

## Tech Debt Tickets Created

None.

## Verdict: PASS

The 4 known jsdom lows are CLOSED. Dashboard is now at parity with the api on Jest 30. Source surface area expanded by 1 small wrapper module (5 lines) — strict improvement for future testability.

Ready to proceed to `/commit`.
