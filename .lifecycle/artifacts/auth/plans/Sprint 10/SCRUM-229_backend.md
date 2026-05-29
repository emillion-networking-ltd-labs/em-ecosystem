# Backend Implementation Plan: SCRUM-229 — Consolidate Error Message Variants (EM-10)

## 1. Codebase State Snapshot

- **Date**: 2026-03-14
- **Last completed ticket**: SCRUM-228 (Unify token error messages)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/common/constants/error-messages.ts` — line 4: `AUTHENTICATION_FAILED: 'Authentication failed'`; line 10: `TOKEN_REVOKED: 'Authentication failed'` (identical values)
  - `nexacore-api/src/auth/strategies/jwt.strategy.ts` — line 36: `throw new UnauthorizedException(ErrorMessages.auth.TOKEN_REVOKED)` (only consumer of TOKEN_REVOKED)
  - `nexacore-api/src/auth/tests/jwt.strategy.spec.ts` — line 160: `toThrow(new UnauthorizedException('Authentication failed'))` (already uses correct message text)
- **Constructor signatures verified**: N/A (no constructor changes)
- **Methods verified to exist**: `JwtStrategy.validate()` at jwt.strategy.ts:29
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None

## 2. Overview

After SCRUM-228 changed `TOKEN_REVOKED` value to `'Authentication failed'`, the `TOKEN_REVOKED` and `AUTHENTICATION_FAILED` constants now have identical values — making `TOKEN_REVOKED` a redundant alias. This ticket consolidates them by removing `TOKEN_REVOKED` and using `AUTHENTICATION_FAILED` directly in jwt.strategy.ts. This reduces the error message surface area and completes the EM-10 audit finding (consistent error messages per category, CWE-200).

## 3. Architecture Context

- **Constants**: `error-messages.ts` — `TOKEN_REVOKED` (line 10) is redundant with `AUTHENTICATION_FAILED` (line 4)
- **Strategy**: `jwt.strategy.ts` — sole consumer of `TOKEN_REVOKED`, line 36
- **Tests**: `jwt.strategy.spec.ts` — assertion already uses `'Authentication failed'` text (no change needed)

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-229-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-229-backend`

### Step 1: Remove TOKEN_REVOKED from error-messages.ts

- **File**: `nexacore-api/src/common/constants/error-messages.ts`
- **Action**: Delete `TOKEN_REVOKED: 'Authentication failed',` (line 10)
- **Implementation Steps**:
  1. Remove line 10 entirely
- **Notes**: The constant is redundant — `AUTHENTICATION_FAILED` (line 4) has the same value. Removing it reduces the auth category from 9 to 8 constants.

### Step 2: Replace TOKEN_REVOKED reference in jwt.strategy.ts

- **File**: `nexacore-api/src/auth/strategies/jwt.strategy.ts`
- **Action**: Replace `ErrorMessages.auth.TOKEN_REVOKED` with `ErrorMessages.auth.AUTHENTICATION_FAILED` on line 36
- **Implementation Steps**:
  1. Line 36: Change `ErrorMessages.auth.TOKEN_REVOKED` → `ErrorMessages.auth.AUTHENTICATION_FAILED`
- **Notes**: The actual error message sent to the client does not change (both are `'Authentication failed'`). This is a code-level consolidation only.

### Step 3: Verify Tests Pass

- **Action**: Run all tests — no test changes expected since the message text is unchanged
- **Implementation Steps**:
  1. Run `npx jest --no-coverage` — all tests must pass
  2. Run `npx nest build` — must compile clean
- **Notes**: jwt.strategy.spec.ts:160 already asserts `'Authentication failed'` — no update needed

### Step 4: Update Technical Documentation

- **Action**: No documentation changes needed beyond integration-state changelog
- **Notes**: No data model, API contract, or architecture changes

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Remove TOKEN_REVOKED from error-messages.ts
3. Step 2: Replace reference in jwt.strategy.ts
4. Step 3: Verify tests pass
5. Step 4: Update documentation

## 6. Testing Checklist

- [ ] `TOKEN_REVOKED` constant no longer exists in error-messages.ts
- [ ] jwt.strategy.ts uses `AUTHENTICATION_FAILED` for denied tokens
- [ ] No remaining references to `TOKEN_REVOKED` in codebase
- [ ] Test assertion unchanged (message text is the same)
- [ ] All tests pass
- [ ] `nest build` compiles clean

## 7. Error Response Format

No change to response format or actual error messages. Denied tokens continue to return HTTP 401 with `'Authentication failed'`.

## 8. Dependencies

- No new dependencies

## 9. Notes

- This is a pure code consolidation — no user-facing behavior changes
- The test at jwt.strategy.spec.ts:160 already checks `'Authentication failed'` (set by SCRUM-228), so no test update is needed
- After this fix, all JWT validation failures in jwt.strategy.ts reference the single `AUTHENTICATION_FAILED` constant
- Inline error string extraction (23 instances) is tracked separately in SCRUM-234 (CH-02)

## 10. Next Steps After Implementation

- Run `/verify` to confirm plan compliance
- Run `/commit` to create commit
- Run `/update-docs` to create implementation record

## 11. Implementation Verification

- [ ] 1 redundant constant removed (`TOKEN_REVOKED`)
- [ ] 1 reference updated to use `AUTHENTICATION_FAILED`
- [ ] 0 test changes (message text unchanged)
- [ ] No duplicate error message values in auth category
- [ ] All tests pass
- [ ] Build compiles clean
