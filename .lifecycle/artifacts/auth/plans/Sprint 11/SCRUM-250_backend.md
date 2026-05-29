# Backend Implementation Plan: SCRUM-250 Tech Debt — SessionsService Unit Tests

## Codebase State Snapshot

- **Date**: 2026-03-15
- **Last completed ticket**: SCRUM-249 (LoginSecurityService tests)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/sessions/sessions.service.ts` — 288 lines, `revokeSessionDirect` at line 267, `findPreviousActiveSessions` at line 274
  - `nexacore-api/src/sessions/tests/sessions.service.spec.ts` — 707 lines, 12 describe blocks (no coverage for the 2 new methods)
- **Discrepancies with integration-state.md**: None

## Overview

Add unit tests for `revokeSessionDirect` and `findPreviousActiveSessions` to the existing `sessions.service.spec.ts`. Resolves SCRUM-245 D5 (Accepted-Quality) tech debt. Test-only change.

## Architecture Context

- **Modules involved**: None (test file only)
- **File modified**: `nexacore-api/src/sessions/tests/sessions.service.spec.ts`

## Implementation Steps

### Step 0: Create Feature Branch

- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-250-backend`

### Step 1: Add `revokeSessionDirect` Tests

- **File**: `nexacore-api/src/sessions/tests/sessions.service.spec.ts`
- **Action**: Add describe block after `enforceSessionLimit` section (before closing `});`)
- **Test cases** (2):
  1. `should call prisma.session.update with isRevoked: true` — verify where + data
  2. `should resolve without error` — verify no exception thrown

### Step 2: Add `findPreviousActiveSessions` Tests

- **File**: Same file
- **Action**: Add describe block after `revokeSessionDirect`
- **Test cases** (3):
  1. `should query with correct where clause and select` — verify userId, excludeSessionId via `not`, isRevoked:false, expiresAt gt now, select ipAddress+userAgent
  2. `should return matching sessions` — mock returns data, verify return value
  3. `should return empty array when no matching sessions` — mock returns [], verify []

### Step 3: Build & Test Verification

- `npx jest sessions.service --forceExit` — new tests pass
- `npx nest build` — compiles clean
- `npx jest --maxWorkers=1 --forceExit` — full suite passes

## Implementation Order

1. Step 0: Create feature branch
2. Step 1-2: Add test cases to existing file
3. Step 3: Build & test verification

## Testing Checklist

- [ ] `revokeSessionDirect`: 2 test cases
- [ ] `findPreviousActiveSessions`: 3 test cases
- [ ] Total: 5 new test cases
- [ ] Full suite passes (914+ tests)

## Dependencies

No new dependencies.

## Notes

- Append to existing test file — do not create a new file.
- Follow existing pattern: `jest.useFakeTimers({ now })` is already set up in beforeEach.
- The `prisma` mock and `mockSession` fixture are already available.
