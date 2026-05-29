# Backend Implementation Plan: SCRUM-234 — Extract Inline Error Strings (CH-02)

## 1. Codebase State Snapshot

- **Date**: 2026-03-14
- **Last completed ticket**: SCRUM-233 (Reduce long auth functions)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/common/constants/error-messages.ts` — 58 lines, 10 namespaces (auth, mfa, session, user, permission, oauth, passkey, device, audit, security, csrf, validation)
  - `nexacore-api/src/auth/mfa.service.ts` — inline strings at lines 209, 246
  - `nexacore-api/src/auth/login.service.ts` — inline string at line 86; already imports ErrorMessages (line 29)
  - `nexacore-api/src/auth/password-reset.service.ts` — inline strings at lines 113, 123; already imports ErrorMessages (line 14)
  - `nexacore-api/src/auth/passkey.service.ts` — inline string at line 410; already imports ErrorMessages (line 35)
  - `nexacore-api/src/auth/tests/auth-password.spec.ts` — test assertions at lines 178 and 204 reference inline strings
- **Constructor signatures verified**: N/A (no constructor changes)
- **Methods verified to exist**: N/A (no method changes)
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None relevant

## 2. Overview

Auth module audit (2026-03-13) Phase 10f finding CH-02 identified inline error message strings in exception constructors that should use `ErrorMessages.*` constants for DRY compliance. 3 unique strings appear across 5 throw sites in 4 service files, plus 1 additional inline string found during verification (`'New password must be different from current password'`). Pure refactoring — no behavioral changes. ISO 25010 Maintainability.

## 3. Architecture Context

- **Files**: `error-messages.ts` (constants), `mfa.service.ts`, `login.service.ts`, `password-reset.service.ts`, `passkey.service.ts` (services), `auth-password.spec.ts` (tests)
- **Pattern**: Add constants to existing `ErrorMessages` object, replace inline strings with constant references
- **No module, DI, or API changes**

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-234-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-234-backend`

### Step 1: Add 4 constants to ErrorMessages

- **File**: `nexacore-api/src/common/constants/error-messages.ts`
- **Action**: Add new error message constants to appropriate namespaces
- **Implementation Steps**:
  1. Add to `mfa` namespace:
     ```typescript
     PASSWORD_REQUIRED_NO_PASSWORD: 'Password confirmation required but no password set',
     ```
  2. Add to `auth` namespace:
     ```typescript
     PASSWORD_BREACHED: 'This password has appeared in a data breach. Please choose a different password.',
     ```
  3. Add to `passkey` namespace:
     ```typescript
     PASSWORD_REQUIRED_FOR_DELETE: 'Password confirmation required to delete passkey',
     ```
  4. Add to `auth` namespace:
     ```typescript
     PASSWORD_MUST_DIFFER: 'New password must be different from current password',
     ```

### Step 2: Replace inline strings in mfa.service.ts

- **File**: `nexacore-api/src/auth/mfa.service.ts`
- **Action**: Replace 2 inline strings with `ErrorMessages.mfa.PASSWORD_REQUIRED_NO_PASSWORD`
- **Implementation Steps**:
  1. Line 209: Replace `'Password confirmation required but no password set'` with `ErrorMessages.mfa.PASSWORD_REQUIRED_NO_PASSWORD`
  2. Line 246: Replace `'Password confirmation required but no password set'` with `ErrorMessages.mfa.PASSWORD_REQUIRED_NO_PASSWORD`
- **Notes**: File already imports `ErrorMessages` at line 19

### Step 3: Replace inline string in login.service.ts

- **File**: `nexacore-api/src/auth/login.service.ts`
- **Action**: Replace 1 inline string with `ErrorMessages.auth.PASSWORD_BREACHED`
- **Implementation Steps**:
  1. Line 86: Replace `'This password has appeared in a data breach. Please choose a different password.'` with `ErrorMessages.auth.PASSWORD_BREACHED`
- **Notes**: File already imports `ErrorMessages` at line 29

### Step 4: Replace inline strings in password-reset.service.ts

- **File**: `nexacore-api/src/auth/password-reset.service.ts`
- **Action**: Replace 2 inline strings
- **Implementation Steps**:
  1. Line 113: Replace `'New password must be different from current password'` with `ErrorMessages.auth.PASSWORD_MUST_DIFFER`
  2. Line 123: Replace `'This password has appeared in a data breach. Please choose a different password.'` with `ErrorMessages.auth.PASSWORD_BREACHED`
- **Notes**: File already imports `ErrorMessages` at line 14

### Step 5: Replace inline string in passkey.service.ts

- **File**: `nexacore-api/src/auth/passkey.service.ts`
- **Action**: Replace 1 inline string with `ErrorMessages.passkey.PASSWORD_REQUIRED_FOR_DELETE`
- **Implementation Steps**:
  1. Line 410: Replace `'Password confirmation required to delete passkey'` with `ErrorMessages.passkey.PASSWORD_REQUIRED_FOR_DELETE`
- **Notes**: File already imports `ErrorMessages` at line 35

### Step 6: Update test assertions

- **File**: `nexacore-api/src/auth/tests/auth-password.spec.ts`
- **Action**: Update test assertions that match exact inline strings
- **Implementation Steps**:
  1. Line 178: Replace `'New password must be different from current password'` with `ErrorMessages.auth.PASSWORD_MUST_DIFFER`
  2. Line 204: Replace `'This password has appeared in a data breach'` with `ErrorMessages.auth.PASSWORD_BREACHED` (partial match — keep using `.toThrow()` substring matching)
  3. Add `import { ErrorMessages } from '../../common/constants/error-messages';` if not already imported
- **Notes**: `.toThrow()` accepts substring matching, so using the constant (full string) works for assertions that used partial strings

### Step 7: Verify build and tests

- **Action**: Run backend build and tests
- **Implementation Steps**:
  1. Run `nest build` — must compile clean
  2. Run `npm test` — all tests must pass (889 expected)

### Step 8: Update Technical Documentation

- **Action**: No API, data model, or architecture changes
- **Notes**: Only integration-state.md changelog entry needed (handled by `/update-docs`)

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add 4 constants to ErrorMessages
3. Step 2: Replace 2 inline strings in mfa.service.ts
4. Step 3: Replace 1 inline string in login.service.ts
5. Step 4: Replace 2 inline strings in password-reset.service.ts
6. Step 5: Replace 1 inline string in passkey.service.ts
7. Step 6: Update test assertions
8. Step 7: Verify build and tests
9. Step 8: Update documentation

## 6. Testing Checklist

- [ ] 4 new constants added to ErrorMessages (auth ×2, mfa ×1, passkey ×1)
- [ ] 6 inline throw statements replaced with ErrorMessages.* references
- [ ] 2 test assertions updated to use constants
- [ ] `nest build` compiles clean
- [ ] All tests pass (889)
- [ ] No behavioral changes — same error messages, same exception types

## 7. Error Response Format

N/A — no error handling changes. Same messages, different source.

## 8. Dependencies

- No new dependencies

## 9. Notes

- All 4 target service files already import `ErrorMessages` — no new import statements needed in services
- The `'Invalid credentials'` strings in login.service.ts are excluded per audit (CWE-203 timing protection)
- The `'Login blocked due to suspicious location activity...'` strings are excluded per audit (acceptable)
- The additional string `'New password must be different from current password'` was found during code verification — same pattern, same file, included for completeness
- Test file `auth-password.spec.ts` uses partial substring matching with `.toThrow()` — using the full constant string is compatible

## 10. Next Steps After Implementation

- Run `/verify` to confirm plan compliance
- Run `/commit` to create commit
- Run `/update-docs` to create implementation record

## 11. Implementation Verification

- [ ] 4 constants added to error-messages.ts
- [ ] 6 inline strings replaced in 4 service files
- [ ] 2 test assertions updated
- [ ] Build passes
- [ ] All tests pass
- [ ] No behavioral changes
