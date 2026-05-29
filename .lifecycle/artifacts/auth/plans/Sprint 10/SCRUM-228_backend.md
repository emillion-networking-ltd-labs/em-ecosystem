# Backend Implementation Plan: SCRUM-228 — Unify Token Error Messages (EM-09)

## 1. Codebase State Snapshot

- **Date**: 2026-03-14
- **Last completed ticket**: SCRUM-227 (Hide feature state in errors)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/common/constants/error-messages.ts` — line 10: `TOKEN_REVOKED: 'Token has been revoked'`; line 11: `SESSION_EXPIRED: 'Session expired due to inactivity'`
  - `nexacore-api/src/auth/strategies/jwt.strategy.ts` — line 36: `throw new UnauthorizedException(ErrorMessages.auth.TOKEN_REVOKED)`
  - `nexacore-api/src/auth/tests/jwt.strategy.spec.ts` — line 160: `toThrow(new UnauthorizedException('Token has been revoked'))`
- **Constructor signatures verified**: N/A (no constructor changes)
- **Methods verified to exist**: `JwtStrategy.validate()` at jwt.strategy.ts:29
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None
- **SESSION_EXPIRED usage search**: Zero references in codebase — confirmed dead code

## 2. Overview

The `TOKEN_REVOKED` error constant (`'Token has been revoked'`) reveals token lifecycle state to attackers, allowing them to distinguish between a revoked token and an expired/invalid one (CWE-209). The fix changes the `TOKEN_REVOKED` value to `'Authentication failed'` — matching the existing `AUTHENTICATION_FAILED` pattern used elsewhere in jwt.strategy.ts. Additionally, the `SESSION_EXPIRED` constant is defined but never used anywhere in the codebase — it should be removed as dead code.

## 3. Architecture Context

- **Constants**: `error-messages.ts` — centralized error message constants
- **Strategy**: `jwt.strategy.ts` — Passport JWT validation, only consumer of `TOKEN_REVOKED`
- **Tests**: `jwt.strategy.spec.ts` — assertion on line 160 checks the `TOKEN_REVOKED` message text

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-228-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-228-backend`

### Step 1: Update TOKEN_REVOKED and Remove SESSION_EXPIRED in error-messages.ts

- **File**: `nexacore-api/src/common/constants/error-messages.ts`
- **Action**: Change `TOKEN_REVOKED` value from `'Token has been revoked'` to `'Authentication failed'`. Remove `SESSION_EXPIRED` line entirely.
- **Implementation Steps**:
  1. Line 10: Change `TOKEN_REVOKED: 'Token has been revoked',` to `TOKEN_REVOKED: 'Authentication failed',`
  2. Line 11: Delete `SESSION_EXPIRED: 'Session expired due to inactivity',`
- **Notes**: The key name `TOKEN_REVOKED` is preserved (only value changes) — jwt.strategy.ts continues referencing `ErrorMessages.auth.TOKEN_REVOKED` without code changes. The new value `'Authentication failed'` matches `AUTHENTICATION_FAILED` on line 4, making the deny-list rejection indistinguishable from other auth failures.

### Step 2: Update Test Assertion in jwt.strategy.spec.ts

- **File**: `nexacore-api/src/auth/tests/jwt.strategy.spec.ts`
- **Action**: Update the message text in the test assertion
- **Implementation Steps**:
  1. Line 160: Change `'Token has been revoked'` to `'Authentication failed'`

### Step 3: Verify Tests Pass

- **Action**: Run all tests — only 1 test assertion change expected
- **Implementation Steps**:
  1. Run `npx jest --no-coverage` — all tests must pass
  2. Run `npx nest build` — must compile clean

### Step 4: Update Technical Documentation

- **Action**: No documentation changes needed beyond integration-state changelog
- **Notes**: No data model, API contract, or architecture changes

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Update TOKEN_REVOKED value + remove SESSION_EXPIRED in error-messages.ts
3. Step 2: Update test assertion in jwt.strategy.spec.ts
4. Step 3: Verify tests pass
5. Step 4: Update documentation

## 6. Testing Checklist

- [ ] `TOKEN_REVOKED` value is now `'Authentication failed'`
- [ ] `SESSION_EXPIRED` constant no longer exists
- [ ] jwt.strategy.spec.ts assertion matches new message
- [ ] No error messages differentiate revoked vs expired vs invalid tokens
- [ ] All tests pass
- [ ] `nest build` compiles clean

## 7. Error Response Format

No change to response format. Denied tokens continue to return HTTP 401 with `UnauthorizedException`, but the message is now generic `'Authentication failed'` instead of `'Token has been revoked'`.

## 8. Dependencies

- No new dependencies

## 9. Notes

- The key name `TOKEN_REVOKED` is intentionally preserved — it documents the *reason* internally while the *value* (user-facing message) is now generic
- After this fix, all JWT validation failures in jwt.strategy.ts return `'Authentication failed'` regardless of the specific reason (denied token, user not found, user inactive)
- `SESSION_EXPIRED` was likely intended for idle session timeout but `token.service.ts:172` uses `INVALID_REFRESH_TOKEN` instead — removing it eliminates dead code

## 10. Next Steps After Implementation

- Run `/verify` to confirm plan compliance
- Run `/commit` to create commit
- Run `/update-docs` to create implementation record

## 11. Implementation Verification

- [ ] 1 constant value changed (`TOKEN_REVOKED`)
- [ ] 1 dead constant removed (`SESSION_EXPIRED`)
- [ ] 1 test assertion updated
- [ ] No token lifecycle state disclosed in any error message
- [ ] All tests pass
- [ ] Build compiles clean
