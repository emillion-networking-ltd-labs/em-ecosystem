# Implementation Record: SCRUM-213 Test Hygiene — Mock Cleanup

## 1. Summary

Added `jest.clearAllMocks()` to 16 test files that use mocks but lacked mock cleanup in `beforeEach`. T-14 (auth E2E tests) confirmed already resolved — comprehensive E2E tests exist from SCRUM-115.

- **Scope**: backend
- **Branch**: `feature/SCRUM-213-backend`
- **Date**: 2026-03-13
- **PR**: #82 (squash-merged)

## 2. Plan Reference

- Plan: `ai-specs/changes/plans/Sprint 9/SCRUM-213_backend.md`
- Plan was followed: Yes

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `eeeca3b` | test(hygiene): add jest.clearAllMocks() to 16 test files (SCRUM-213) | 16 spec files |

## 4. Files Changed

| Module | Files |
|--------|-------|
| auth (8) | `oauth-callback.filter.spec.ts`, `oauth-link.guard.spec.ts`, `oauth-guards.spec.ts`, `oauth-exchange.spec.ts`, `oauth-code.store.spec.ts`, `oauth-state.store.spec.ts`, `token-deny-list.service.spec.ts`, `permissions.guard.spec.ts` |
| common (2) | `custom-throttler.guard.spec.ts`, `no-cache.interceptor.spec.ts` |
| geolocation (1) | `impossible-travel.service.spec.ts` |
| mail (1) | `mail.service.spec.ts` |
| permissions (2) | `permissions.controller.spec.ts`, `permissions.service.spec.ts` |
| security (2) | `csrf.guard.spec.ts`, `suspicious-login.service.spec.ts` |

## 5. Deviations from Plan

Implementation followed the plan exactly.

## 6. Test Results

- **Overall**: 859 passed / 0 failed
- **Build**: `nest build` clean
- **No behavioral changes** — mock cleanup is preventive hygiene only

## 7. Bugs Found

No bugs found during implementation.

## 8. Documentation Updates

| File | Changes |
|------|---------|
| `ai-specs/specs/integration-state.md` | Added changelog entry for SCRUM-213 |

## 9. Lessons Learned

- T-14 finding was stale — auth E2E tests already existed from Sprint 3. Verifying findings against actual codebase before implementation avoids unnecessary work.
- Mechanical edits across many files benefit from batch processing with verification at the end rather than file-by-file testing.
