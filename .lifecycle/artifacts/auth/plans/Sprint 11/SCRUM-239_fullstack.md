# Fullstack Implementation Plan: SCRUM-239 — Unify 404 Messages + Login Password Validation

## Codebase State Snapshot

- **Date**: 2026-03-15
- **Last completed ticket**: SCRUM-238 (Validate OAuth/SMTP/Redis secrets)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/common/constants/error-messages.ts` (66 lines) — 5 NOT_FOUND constants at lines 25, 28, 46, 51, 54
  - `nexacore-api/src/sessions/tests/sessions.service.spec.ts` — line 453 uses literal `'Session not found'`
  - `nexacore-api/src/sessions/sessions.service.ts` — line 159: `throw new NotFoundException(ErrorMessages.session.NOT_FOUND)`
  - `nexacore-api/src/users/users.service.ts` — lines 498, 573: `ErrorMessages.user.NOT_FOUND`
  - `nexacore-api/src/users/users.controller.ts` — line 184: `ErrorMessages.user.NOT_FOUND`
  - `nexacore-api/src/auth/passkey.service.ts` — lines 383, 424: `ErrorMessages.passkey.NOT_FOUND`
  - `nexacore-api/src/auth/trusted-device.service.ts` — line 146: `ErrorMessages.device.NOT_FOUND`
  - `nexacore-api/src/audit/audit.controller.ts` — line 59: `ErrorMessages.audit.NOT_FOUND`
  - `nexacore-api/src/auth/tests/session.controller.spec.ts` — line 233: `ErrorMessages.device.NOT_FOUND` (uses constant, OK)
  - `nexacore-dashboard/src/components/auth/LoginForm.tsx` (477 lines) — `handleLogin` at line 113, empty check at lines 115-118
  - `nexacore-dashboard/src/lib/validation.ts` (17 lines) — `validatePassword()` at line 10
  - `nexacore-dashboard/src/components/auth/RegisterForm.tsx` — uses `validatePassword` at line 55
  - `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx` — uses `validatePassword` at line 71
  - `nexacore-dashboard/src/components/profile/ChangePasswordForm.tsx` — uses `validatePassword` at line 28
- **Discrepancies with integration-state.md**: None

---

## Architecture Context

### Part 1: NOT_FOUND Message Unification

All 8 usages of `NOT_FOUND` constants across 6 service/controller files reference `ErrorMessages.xxx.NOT_FOUND`. Changing the constant values in `error-messages.ts` propagates automatically — **no code changes needed in services/controllers**.

Only 1 test file uses a literal string (`'Session not found'`) instead of the constant — that must be updated.

### Part 2: LoginForm Password Validation

The `validatePassword()` utility already exists in `@/lib/validation` and is used by 3 forms. LoginForm is the only auth form that doesn't use it — it only checks for empty password. Adding the call is a 3-line change matching the existing pattern.

**Anti-enumeration safety**: `validatePassword()` checks only string length (8-128 chars) — no server calls, no account existence check. Safe to add.

---

## Backend Implementation Steps

### Step 0: Create Feature Branch

- **Branch**: `feature/SCRUM-239`
- **From**: `main` (latest)
- **Commands**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-239`

### Step 1: Unify NOT_FOUND constants

- **File**: `nexacore-api/src/common/constants/error-messages.ts`
- **Action**: Change all 5 NOT_FOUND values to `'Resource not found'`
- **Implementation Steps**:
  1. Line 25: `session.NOT_FOUND: 'Session not found'` → `'Resource not found'`
  2. Line 28: `user.NOT_FOUND: 'User not found'` → `'Resource not found'`
  3. Line 46: `passkey.NOT_FOUND: 'Passkey not found'` → `'Resource not found'`
  4. Line 51: `device.NOT_FOUND: 'Device not found'` → `'Resource not found'`
  5. Line 54: `audit.NOT_FOUND: 'Audit log not found'` → `'Resource not found'`
- **Standard**: CWE-200, OWASP ASVS V14.3.3

### Step 2: Update test assertion

- **File**: `nexacore-api/src/sessions/tests/sessions.service.spec.ts`
- **Action**: Line 453 — change literal `'Session not found'` to `'Resource not found'`
- **Alternative**: Import `ErrorMessages` and use `ErrorMessages.session.NOT_FOUND` (preferred — prevents future drift)
- **Implementation Steps**:
  1. Check if `ErrorMessages` is already imported in this test file
  2. If not, add import: `import { ErrorMessages } from '../../../common/constants/error-messages';`  (adjust path as needed)
  3. Change line 453 from `.toThrow('Session not found')` to `.toThrow(ErrorMessages.session.NOT_FOUND)`

### Step 3: Verify all tests pass

- **Action**: Run `npx jest --maxWorkers=1 --forceExit` to confirm all 903+ tests pass
- **Key verification**: Tests that throw `NotFoundException(ErrorMessages.xxx.NOT_FOUND)` will now see `'Resource not found'` — all assertions using the constant will pass automatically

---

## Frontend Implementation Steps

### Step 4: Add validatePassword to LoginForm

- **File**: `nexacore-dashboard/src/components/auth/LoginForm.tsx`
- **Action**: Add `validatePassword` import and replace empty-check with validation call
- **Implementation Steps**:
  1. Add import (near line 17 area):
     ```typescript
     import { validatePassword } from "@/lib/validation";
     ```
  2. In `handleLogin` (line 113), replace lines 115-118:
     ```typescript
     // Before:
     if (!formData.password) {
       setPasswordError("Enter your password");
       return;
     }

     // After:
     const pwError = validatePassword(formData.password);
     if (pwError) {
       setPasswordError(pwError);
       return;
     }
     ```
  3. This matches the exact pattern in RegisterForm (line 55), ResetPasswordForm (line 71), and ChangePasswordForm (line 28)
- **Note**: `validatePassword()` already handles the empty check (returns "Enter your password" if empty), so the existing behavior is preserved. It additionally checks min length (8) and max length (128).

### Step 5: Verify frontend build

- **Action**: Run `npm run build` in nexacore-dashboard to confirm no TypeScript errors

---

## Implementation Order

1. Step 0: Create feature branch `feature/SCRUM-239`
2. Step 1: Unify NOT_FOUND constants in error-messages.ts
3. Step 2: Update test assertion in sessions.service.spec.ts
4. Step 3: Run backend tests
5. Step 4: Add validatePassword to LoginForm.tsx
6. Step 5: Verify frontend build
7. Step 6: Update technical documentation (via `/update-docs`)

## Testing Checklist

### Backend
- [ ] All 5 NOT_FOUND constants are `'Resource not found'`
- [ ] sessions.service.spec.ts assertion updated (no literal string)
- [ ] All 903+ tests pass
- [ ] `nest build` clean

### Frontend
- [ ] LoginForm calls `validatePassword()` before submit
- [ ] Empty password shows "Enter your password" (same as before)
- [ ] Short password (< 8 chars) shows "Password must be at least 8 characters"
- [ ] Long password (> 128 chars) shows "Password must not exceed 128 characters"
- [ ] Frontend build succeeds

## Dependencies

- No new dependencies required
- `validatePassword` already exists in `@/lib/validation`

## Notes

- **Zero service/controller changes**: All 8 NOT_FOUND usages reference the `ErrorMessages` constant — changing the constant value propagates automatically
- **Anti-enumeration safe**: Password validation is purely local (string length check) — does not reveal account existence
- **Consistency**: After this change, all 4 auth forms (Login, Register, Reset, Change) use `validatePassword()`

## Risk Assessment

- **Risk**: LOW — string constant changes + 1 import/call addition
- **Rollback**: Revert the 3 file changes
