# Backend Implementation Plan: SCRUM-213 Test Hygiene — Mock Cleanup

## Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-212 (magic number consolidation)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - All 16 target spec files confirmed to have `beforeEach` blocks without `jest.clearAllMocks()`
  - Established pattern confirmed in `src/auth/tests/auth.service.spec.ts:44` — `jest.clearAllMocks()` as first line in top-level `beforeEach`
- **Discrepancies with integration-state.md**: None — this ticket modifies only test files

## Overview

Add `jest.clearAllMocks()` to 16 test files that use mocks but lack mock cleanup. This prevents mock state from leaking between tests (test isolation). T-14 (auth E2E tests) is already resolved — no action needed.

## Architecture Context

- **Modules involved**: None — test files only
- **Components affected**: 16 spec files across 6 modules (auth, common, geolocation, mail, permissions, security)
- **No production code changes**

## Implementation Steps

### Step 0: Create Feature Branch

- **Branch**: `feature/SCRUM-213-backend`
- **Base**: `main` (latest, after SCRUM-212 merge)

### Step 1: Add jest.clearAllMocks() to 16 test files

For each file, add `jest.clearAllMocks();` as the **first line** inside the existing top-level `beforeEach` block.

**Files (grouped by module):**

**auth/tests/ (8 files)**:
1. `oauth-callback.filter.spec.ts` — `beforeEach` at line 16
2. `oauth-link.guard.spec.ts` — has `beforeEach`
3. `oauth-guards.spec.ts` — has `beforeEach`
4. `oauth-exchange.spec.ts` — has `beforeEach`
5. `oauth-code.store.spec.ts` — has `beforeEach`
6. `oauth-state.store.spec.ts` — has `beforeEach`
7. `token-deny-list.service.spec.ts` — has `beforeEach`
8. `permissions.guard.spec.ts` — has `beforeEach`

**common/ (2 files)**:
9. `guards/tests/custom-throttler.guard.spec.ts` — has `beforeEach`
10. `interceptors/tests/no-cache.interceptor.spec.ts` — has `beforeEach`

**geolocation/tests/ (1 file)**:
11. `impossible-travel.service.spec.ts` — has `beforeEach`

**mail/tests/ (1 file)**:
12. `mail.service.spec.ts` — has `beforeEach`

**permissions/tests/ (2 files)**:
13. `permissions.controller.spec.ts` — has `beforeEach`
14. `permissions.service.spec.ts` — has `beforeEach`

**security/tests/ (2 files)**:
15. `csrf.guard.spec.ts` — has `beforeEach`
16. `suspicious-login.service.spec.ts` — has `beforeEach`

**Pattern to follow:**
```typescript
beforeEach(() => {       // or beforeEach(async () => {
  jest.clearAllMocks();  // ← ADD THIS LINE
  // ... existing setup code unchanged
});
```

### Step 2: Run Tests and Build

1. `cd nexacore-api && npm test` — all 859 tests must pass
2. `cd nexacore-api && npx nest build` — must compile clean
3. `npx prettier --write` on all modified files

### Step 3: Update Technical Documentation

- No documentation changes needed (test-only change, no API/schema/module changes)
- Add changelog entry to `integration-state.md`

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add `jest.clearAllMocks()` to all 16 files
3. Step 2: Run tests and build
4. Step 3: Update documentation (changelog only)

## Testing Checklist

- [ ] All 859 tests pass
- [ ] `nest build` clean
- [ ] All 16 files have `jest.clearAllMocks()` in `beforeEach`
- [ ] 9 pure logic test files remain unchanged
- [ ] No production code modified

## Dependencies

None — no new packages or libraries.

## Notes

- **T-14 (Auth E2E tests)**: Already resolved. Comprehensive E2E tests exist in `test/auth-e2e/` (created SCRUM-115). No action needed.
- This is a mechanical, zero-risk change — adds mock cleanup for test isolation hygiene only.
- The `password-breach.service.spec.ts` file uses `jest.restoreAllMocks()` in `afterEach` instead — this is intentional (spies on real implementations) and should NOT be changed.
