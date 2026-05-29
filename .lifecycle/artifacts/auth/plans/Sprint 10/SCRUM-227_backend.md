# Backend Implementation Plan: SCRUM-227 — Hide Feature State in Errors (EM-08)

## 1. Codebase State Snapshot

- **Date**: 2026-03-14
- **Last completed ticket**: SCRUM-226 (Pseudonymize email in audit logs)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/mfa.service.ts` — line 209: `'Password confirmation required but no password set'` (disableMfa); line 246: same message (regenerateRecoveryCodes)
  - `nexacore-api/src/auth/mfa.controller.ts` — line 60: `@ApiResponse({ status: 409, description: 'MFA is already enabled' })`; line 140: `@ApiResponse({ status: 400, description: 'MFA is not enabled' })`
  - `nexacore-api/src/auth/tests/mfa.service.spec.ts` — line 349-356: tests check `BadRequestException` type only (no message assertion)
- **Constructor signatures verified**: N/A (no constructor changes)
- **Methods verified to exist**: `disableMfa()` at mfa.service.ts:188, `regenerateRecoveryCodes()` at mfa.service.ts:229
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None

## 2. Overview

Two inline error strings in `mfa.service.ts` reveal that the user has no password (OAuth-only account), which is feature state disclosure per CWE-200. Two Swagger `@ApiResponse` descriptions also reveal MFA enrollment state. The fix replaces inline strings with the existing generic `ErrorMessages.mfa.OPERATION_NOT_AVAILABLE` constant and updates Swagger descriptions to use generic wording.

## 3. Architecture Context

- **Service**: `mfa.service.ts` — `disableMfa()` and `regenerateRecoveryCodes()` methods
- **Controller**: `mfa.controller.ts` — Swagger `@ApiResponse` decorators
- **Tests**: `mfa.service.spec.ts` — assertions check exception type only (no message text)

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-227-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-227-backend`

### Step 1: Replace Inline Error Strings in mfa.service.ts

- **File**: `nexacore-api/src/auth/mfa.service.ts`
- **Action**: Replace 2 inline `'Password confirmation required but no password set'` strings with `ErrorMessages.mfa.OPERATION_NOT_AVAILABLE`
- **Implementation Steps**:
  1. Line 208-210 (disableMfa): Replace `throw new BadRequestException('Password confirmation required but no password set')` with `throw new BadRequestException(ErrorMessages.mfa.OPERATION_NOT_AVAILABLE)`
  2. Line 244-247 (regenerateRecoveryCodes): Same replacement
- **Notes**: Both `!user.mfaEnabled` and `!user.passwordHash` now throw the same generic message — an attacker cannot distinguish between "MFA not enabled" and "no password set"

### Step 2: Update Swagger Descriptions in mfa.controller.ts

- **File**: `nexacore-api/src/auth/mfa.controller.ts`
- **Action**: Replace state-revealing Swagger descriptions with generic wording
- **Implementation Steps**:
  1. Line 60: Change `description: 'MFA is already enabled'` to `description: 'Operation not available'`
  2. Line 140: Change `description: 'MFA is not enabled'` to `description: 'Operation not available'`
- **Notes**: Swagger docs are developer-facing but can still be accessed via /api endpoint if exposed. Generic descriptions maintain security

### Step 3: Verify Tests Pass

- **Action**: Run all tests — no test changes expected since assertions check exception type only
- **Implementation Steps**:
  1. Run `npx jest --no-coverage` — all tests must pass
  2. Run `npx nest build` — must compile clean

### Step 4: Update Technical Documentation

- **Action**: No documentation changes needed beyond integration-state changelog
- **Notes**: No data model, API contract, or architecture changes

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Replace inline strings in mfa.service.ts (2 locations)
3. Step 2: Update Swagger descriptions in mfa.controller.ts (2 locations)
4. Step 3: Verify tests pass
5. Step 4: Update documentation

## 6. Testing Checklist

- [ ] No error messages mention "password set", "password not set", or "OAuth"
- [ ] Swagger descriptions do not mention "already enabled" or "not enabled"
- [ ] All tests pass (898+)
- [ ] `nest build` compiles clean

## 7. Error Response Format

No change to response format. Both errors continue to return HTTP 400 with `OPERATION_NOT_AVAILABLE` message.

## 8. Dependencies

- No new dependencies

## 9. Notes

- The test in `mfa.service.spec.ts:349` checks `BadRequestException` type only — no message text assertion, so no test update needed
- The Swagger `@ApiResponse` at line 60 says `status: 409` but the actual code throws `BadRequestException` (400) — this was already a documentation mismatch; the fix updates the description without changing the status code
- After this fix, all MFA state-related errors use the same `OPERATION_NOT_AVAILABLE` message regardless of the specific reason

## 10. Next Steps After Implementation

- Run `/verify` to confirm plan compliance
- Run `/commit` to create commit
- Run `/update-docs` to create implementation record

## 11. Implementation Verification

- [ ] 2 inline strings replaced with `ErrorMessages.mfa.OPERATION_NOT_AVAILABLE`
- [ ] 2 Swagger descriptions updated to generic wording
- [ ] No feature state disclosed in any error message
- [ ] All tests pass
- [ ] Build compiles clean
