# Backend Implementation Plan: SCRUM-263 Extract 'Invalid credentials' to ErrorMessages Constant

## 1. Header

- **Ticket**: SCRUM-263
- **Title**: Audit Fix: CH-02 — Extract 'Invalid credentials' to ErrorMessages constant
- **Scope**: Backend
- **Priority**: Medium
- **Sprint**: 11 — Security II

## 2. Codebase State Snapshot

- **Date**: 2026-03-16
- **Last completed ticket**: SCRUM-262 (Next.js update)
- **Integration state verified**: Yes (no module changes needed)
- **Files verified against live code**:
  - `src/auth/login.service.ts` — 6 inline `'Invalid credentials'` at lines 123, 133, 153, 188, 216, 229
  - `src/common/constants/error-messages.ts:3` — `INVALID_CREDENTIALS: 'Invalid credentials'` already exists
  - `src/auth/login.service.ts:27` — `import { ErrorMessages } from '../common/constants/error-messages'` already exists
  - `src/auth/tests/auth.controller.spec.ts:167` — 1 test reference (out of audit scope)
  - `src/auth/auth.controller.ts:114` — Swagger @ApiResponse description (documentation, not runtime)
- **Constructor signatures verified**: N/A (no constructor changes)
- **Methods verified to exist**: N/A (no method changes)
- **Discrepancies with integration-state.md**: None

## 3. Regression Impact Analysis

- **Blast radius**: 1 file modified (`login.service.ts`). The string value does NOT change — `ErrorMessages.auth.INVALID_CREDENTIALS` resolves to the same `'Invalid credentials'` string. Zero behavioral change.
- **Breaking changes identified**: None. Same string value, same exception type, same HTTP status code.
- **API contract impact**: None. Response messages unchanged.
- **Test files requiring updates**: None mandatory. The test at `auth.controller.spec.ts:167` uses the same string in a mock — functionally identical. Optional consistency update.
- **Blast radius size**: 1 file. LOW risk.

## 4. Overview

Replace 6 inline `'Invalid credentials'` string literals in `login.service.ts` with the existing `ErrorMessages.auth.INVALID_CREDENTIALS` constant. The import and constant already exist — this is a pure mechanical replacement.

## 5. Architecture Context

- **Module**: Auth (no module-level changes)
- **File**: `src/auth/login.service.ts`
- **Constant**: `src/common/constants/error-messages.ts`
- **Pattern**: Same pattern used throughout the auth module (e.g., `ErrorMessages.auth.CHECK_EMAIL` at line 78)

## 6. Implementation Steps

### Step 0: Create Feature Branch
- **Action**: `git checkout main && git pull origin main && git checkout -b feature/SCRUM-263-backend`

### Step 1: Replace 6 Inline Strings
- **File**: `nexacore-api/src/auth/login.service.ts`
- **Action**: Replace all 6 instances of `'Invalid credentials'` with `ErrorMessages.auth.INVALID_CREDENTIALS`
- **Implementation Steps**:
  1. Line 123: `throw new UnauthorizedException('Invalid credentials')` → `throw new UnauthorizedException(ErrorMessages.auth.INVALID_CREDENTIALS)`
  2. Line 133: same replacement
  3. Line 153: same replacement
  4. Line 188: same replacement
  5. Line 216: same replacement
  6. Line 229: same replacement
- **Dependencies**: Import already exists at line 27
- **Notes**: Use `replace_all` for `UnauthorizedException('Invalid credentials')` → `UnauthorizedException(ErrorMessages.auth.INVALID_CREDENTIALS)` since the pattern is identical in all 6 places

### Step 2: Verify Fix
- **Action**: Grep for remaining inline strings
- **Implementation Steps**:
  1. `grep "'Invalid credentials'" src/auth/login.service.ts` → must return 0 matches
  2. `nest build` → must succeed
  3. Run auth tests → must pass

## 7. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Replace 6 inline strings
3. Step 2: Verify fix (grep + build + tests)

## 8. Testing Checklist

- [ ] `grep "'Invalid credentials'" src/auth/login.service.ts` → 0 matches
- [ ] `nest build` succeeds
- [ ] All auth tests pass (login tests specifically)
- [ ] API behavior unchanged (same error message string)

## 9. Error Response Format

No change — `UnauthorizedException('Invalid credentials')` produces the same 401 response regardless of whether the string comes from a literal or a constant.

## 10. Partial Update Support

N/A

## 11. Dependencies

None — no new packages or imports needed.

## 12. Notes

- The `ErrorMessages.auth.INVALID_CREDENTIALS` constant already exists and is already imported
- This is a zero-behavioral-change refactoring — the runtime string is identical
- The test file `auth.controller.spec.ts:167` also uses the inline string, but test files are excluded from the CH-02 audit check

## 13. Next Steps After Implementation

1. `/develop SCRUM-263` — execute the plan
2. `/commit SCRUM-263` — commit and create PR
3. Proceed to SCRUM-264 (test coverage)

## 14. Implementation Verification

- [ ] 0 inline `'Invalid credentials'` in `login.service.ts`
- [ ] `ErrorMessages.auth.INVALID_CREDENTIALS` used in all 6 locations
- [ ] `nest build` clean
- [ ] Auth tests pass
- [ ] No source files modified other than `login.service.ts`
