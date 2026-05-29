# Implementation Record: SCRUM-374 Jest 29 → 30 (dashboard)

## 2. Summary

Bumped `jest`, `jest-environment-jsdom`, and `@types/jest` from 29.x to 30.x in `nexacore-dashboard`. Closes the 4 known low-severity vulns in the `jsdom → http-proxy-agent → @tootallnate/once` chain — dashboard `npm audit` now reports **0 vulnerabilities total** (down from 4 lows since 2026-05-08). Aligns dashboard with `nexacore-api` (already on Jest 30).

- **Scope**: `frontend`
- **Branch**: `feature/SCRUM-374-jest-30`
- **Date**: 2026-05-08

## 3. Plan Reference

- Original plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-374_frontend.md`
- Plan was followed: **Partially** — 2 deviations. Plan called for re-evaluating glob/minimatch overrides (skipped, not needed). Plan didn't anticipate jsdom 26's complete lockdown of `window.location`.

## 4. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| (pending merge) | SCRUM-374: Jest 29 -> 30 (dashboard) | `package.json` + `package-lock.json`, `src/lib/navigation.ts` (NEW), `src/components/profile/ConnectedAccounts.tsx`, 2 test files |

## 5. Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 2 | Re-evaluate glob/minimatch overrides | SKIPPED | Current install reports 0 vulns total without overrides; reintroducing them would be cosmetic. | Accepted-Trivial | — |
| 4 | Reinstall + tests pass | 8 tests broken by jsdom 26 lockdown of `window.location`; required source refactor (new navigation wrapper module + 1-line component change) and test refactor | jsdom 26 (bundled with jest 30) marks every property of `window.location` as non-writable + non-configurable. `Object.defineProperty(window, 'location', ...)` pattern (used in 2 test files) throws. Resolution: introduce thin `navigateTo()` wrapper to make navigation calls mockable at the module boundary. | Accepted-Trivial | — |

The wrapper-module pattern is a strict improvement: it decouples navigation from the browser API and makes future tests in other files trivial to mock.

## 6. Test Results

- Tests: **118/118 passing** (18 suites)
- Build: PASS — 19 routes generated (Turbopack default)
- Lint: 0 errors / 0 warnings (flat config)
- Audit: **0 vulnerabilities total** (was 4 lows)

## 7. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `Object.defineProperty(window, 'location', ...)` throws on jsdom 26 | HIGH (test-only) | Fixed | Refactored ConnectedAccounts to use a `navigateTo()` wrapper module (mockable); AuthContext switched to `delete window.location` + plain reassign. |

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-374_frontend.md` | This record (NEW) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-374_verify.md` | Verify report (committed in /verify phase) |
| `ai-specs/specs/frontend-standards.mdc` | Tech Stack: Jest 29 → 30 |
| `ai-specs/specs/workflow-standards.mdc` | §12 Migration backlog row marks SCRUM-374 DONE |

## 9. Audit Finding Verification

N/A — non-audit ticket.

## 10. Lessons Learned

**What went well**:
- The wrapper-module pattern for `window.location.assign()` is a clean improvement that makes the codebase more testable. Future tickets needing navigation tests can adopt the same pattern.
- Identifying that `nexacore-api` was already on Jest 30 made the upgrade goal clear: bring dashboard to parity.

**What was harder than expected**:
- jsdom 26's lockdown of `window.location` is more aggressive than any prior version. **All** properties (`href`, `pathname`, `assign`, `replace`) are non-writable + non-configurable. Even `jest.replaceProperty()` (Jest 30 new API for non-writable props) requires `configurable: true`.
- The ONLY way to swap the location object is `delete window.location` + reassign — works because the `location` slot itself on `window` is still configurable, but its returned value's properties are not.

**Recommendations for similar tickets**:
- For any code that does `window.location.<x> = ...` or `window.location.<method>(...)`, prefer routing through a small wrapper module from day one. Saves test-time pain at every jest/jsdom upgrade.
- The remaining 4 source files using `window.location.*` (error.tsx, profile/error.tsx, MfaSetupStep.tsx, AuthContext.tsx for pathname) are not currently tested. When they need test coverage, adopt the same wrapper pattern.
