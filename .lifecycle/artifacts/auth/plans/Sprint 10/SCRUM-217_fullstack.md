# Fullstack Implementation Plan: SCRUM-217 Fix User Enumeration via Login Status Codes

## Codebase State Snapshot
- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-163 (Sprint 6 — OAuth Architecture cleanup)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/login.service.ts` (423 lines) — full file read
  - `nexacore-api/src/auth/tests/auth-login.spec.ts` (906 lines) — full file read
  - `nexacore-api/src/auth/tests/auth.service.spec.ts` (lines 200-230) — unverified email test
  - `nexacore-api/src/common/constants/error-messages.ts` — CHECK_EMAIL constant
  - `nexacore-dashboard/src/lib/error-constants.ts` (30 lines) — full file read
  - `nexacore-dashboard/src/context/AuthContext.tsx` (lines 250-275) — login error handler
  - `nexacore-dashboard/src/components/auth/LoginForm.tsx` (lines 1-30, 385-520) — imports + verification UI
- **Constructor signatures verified**:
  - `LoginService(usersService, tokenService, emailVerificationService, passwordBreachService, trustedDeviceService, impossibleTravelService, suspiciousLoginService, auditService, mailService)` — 9 deps
- **Methods verified to exist**:
  - `login()` at login.service.ts:121 — the method being modified
  - `emailVerificationService.createAndSendVerificationEmail()` — used at line 105 in register flow
- **Guard dependency chain verified**: N/A — no guard changes in this ticket
- **Discrepancies with integration-state.md**: None — LoginService deps match line 189

---

## Overview

Normalize all login failure HTTP responses to prevent user enumeration (CWE-203, OWASP ASVS V2.2.1). Currently, the unverified-email path at `login.service.ts:177` throws `ForbiddenException` (HTTP 403) while all other failure paths throw `UnauthorizedException` (HTTP 401). This status code difference allows an attacker who knows a valid password to determine whether an account has verified its email.

## Architecture Context

### Backend
- **Module**: AuthModule (existing)
- **File modified**: `src/auth/login.service.ts` — change one exception type
- **Test files modified**: `src/auth/tests/auth-login.spec.ts`, `src/auth/tests/auth.service.spec.ts`
- **No new modules, guards, DTOs, or services**

### Frontend
- **Files modified**: `src/lib/error-constants.ts`, `src/context/AuthContext.tsx`, `src/components/auth/LoginForm.tsx`
- **No new components or pages**

### API Contract Change
- `POST /auth/login`: unverified email now returns `401 Unauthorized` (was `403 Forbidden`)
- Response body: `{ "statusCode": 401, "message": "Invalid credentials", "error": "Unauthorized" }` — identical to all other login failures

---

## Implementation Steps

### Step 0: Create Feature Branch
- **Action**: Create and switch to feature branch from latest main
- **Branch name**: `feature/SCRUM-217-fullstack`
- **Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-217-fullstack`
  3. `git branch` — verify

---

## Backend Steps

### Step 1: Normalize Exception in login.service.ts
- **File**: `nexacore-api/src/auth/login.service.ts`
- **Action**: Change the email-not-verified path (lines 166-178) to throw `UnauthorizedException('Invalid credentials')` instead of `ForbiddenException(ErrorMessages.auth.CHECK_EMAIL)`, and silently trigger a re-verification email
- **Implementation Steps**:
  1. Replace line 177:
     ```typescript
     // BEFORE:
     throw new ForbiddenException(ErrorMessages.auth.CHECK_EMAIL);

     // AFTER:
     this.emailVerificationService
       .createAndSendVerificationEmail(user)
       .catch(() => {});
     throw new UnauthorizedException('Invalid credentials');
     ```
  2. Remove `ForbiddenException` from the import at line 4 (check if it's still used elsewhere in the file — it is NOT used anywhere else in login.service.ts)
  3. Remove `ErrorMessages` import at line 30 if no longer used in the file — CHECK: it IS still used at lines 84 and 118 in the `register()` method, so **keep the import**
- **Dependencies**: `emailVerificationService` is already injected (constructor dep #3)
- **Notes**:
  - The email verification check is AFTER `validateCredentials()` (line 164), which already consumed bcrypt time — no timing leak introduced
  - Audit log metadata `{ reason: 'email_not_verified' }` stays unchanged (lines 168-176) — only the thrown exception changes
  - The re-verification email is fire-and-forget, same pattern used in register() at line 104-106

### Step 2: Update auth-login.spec.ts
- **File**: `nexacore-api/src/auth/tests/auth-login.spec.ts`
- **Action**: Update 2 tests that expect `ForbiddenException` for unverified email to expect `UnauthorizedException`
- **Implementation Steps**:
  1. **Line 196** — test: `'should throw ForbiddenException for unverified account with password'`
     - Rename to: `'should throw UnauthorizedException for unverified account with password (anti-enumeration)'`
     - Change line 208: `).rejects.toThrow(ForbiddenException)` → `).rejects.toThrow(UnauthorizedException)`
  2. **Line 790** — test: `'should still throw ForbiddenException when audit rejects on email not verified'`
     - Rename to: `'should still throw UnauthorizedException when audit rejects on email not verified (anti-enumeration)'`
     - Change line 801: `).rejects.toThrow(ForbiddenException)` → `).rejects.toThrow(UnauthorizedException)`
  3. Check if `ForbiddenException` import (line 1) is still needed — YES, it's still used at lines 464, 493, 902 (impossible travel tests). **Keep the import.**

### Step 3: Update auth.service.spec.ts
- **File**: `nexacore-api/src/auth/tests/auth.service.spec.ts`
- **Action**: Update 1 test that expects `ForbiddenException` for unverified email
- **Implementation Steps**:
  1. **Line 208** — test: `'should throw ForbiddenException when user with password has unverified email'`
     - Rename to: `'should throw UnauthorizedException when user with password has unverified email (anti-enumeration)'`
     - Change line 217: `).rejects.toThrow(ForbiddenException)` → `).rejects.toThrow(UnauthorizedException)`
  2. Check if `ForbiddenException` import (line 3) is still needed — check all other uses in the file. If none, remove it.

### Step 4: Verify Backend
- **Action**: Run build and tests
- **Steps**:
  1. `cd nexacore-api && npx nest build` — must compile clean
  2. `npx jest --maxWorkers=1 --forceExit` — all tests must pass
  3. Specifically verify: `npx jest auth-login --verbose` — the 2 updated tests pass
  4. Specifically verify: `npx jest auth.service.spec --verbose` — the 1 updated test passes

---

## Frontend Steps

### Step 5: Remove DETECTION_EMAIL_VERIFICATION from error-constants.ts
- **File**: `nexacore-dashboard/src/lib/error-constants.ts`
- **Action**: Remove the `DETECTION_EMAIL_VERIFICATION` constant (lines 13-14) since the backend no longer returns a distinguishable error message for unverified accounts
- **Implementation Steps**:
  1. Remove lines 13-14:
     ```typescript
     /** Backend: ErrorMessages.auth.CHECK_EMAIL = 'Please check your email to continue' */
     export const DETECTION_EMAIL_VERIFICATION = 'check your email';
     ```

### Step 6: Simplify Login Error Handler in AuthContext.tsx
- **File**: `nexacore-dashboard/src/context/AuthContext.tsx`
- **Action**: Remove the `DETECTION_EMAIL_VERIFICATION` import and the conditional branch at line 267 that detects email verification errors
- **Implementation Steps**:
  1. Remove the `DETECTION_EMAIL_VERIFICATION` import
  2. Replace lines 267-271:
     ```typescript
     // BEFORE:
     if (message.toLowerCase().includes(DETECTION_EMAIL_VERIFICATION)) {
       dispatch({ type: "AUTH_ERROR", payload: message });
     } else {
       dispatch({ type: "AUTH_STOP" });
     }

     // AFTER:
     dispatch({ type: "AUTH_STOP" });
     ```
- **Notes**: The toast is still shown (line 262-265) with the error message. The only change is removing the special `AUTH_ERROR` dispatch that kept the error state for the resend verification UI.

### Step 7: Remove Verification Error UI from LoginForm.tsx
- **File**: `nexacore-dashboard/src/components/auth/LoginForm.tsx`
- **Action**: Remove the email verification error detection logic and the "Resend verification email" UI block
- **Implementation Steps**:
  1. Remove the `DETECTION_EMAIL_VERIFICATION` import (line 20)
  2. Remove the `SendHorizontal` import from lucide-react (line 6) — only used in the resend button. Check: grep for `SendHorizontal` — if only used in the resend block, remove it.
  3. Remove the `CountdownTimer` import (line 10) — check if used elsewhere. If only used in resend block, remove.
  4. Remove the `resendCooldownCache` module-level Map (line 29)
  5. Remove from `PasswordStep` props interface (around line 314): `onResendVerification`
  6. Remove from `PasswordStep` destructuring (around line 330): `onResendVerification`
  7. Remove the `resendCooldown` state and its timer effect (around lines 335-382)
  8. Remove the `handleResendVerification` callback (around lines 384-395)
  9. Simplify the error detection variables (around lines 399-404):
     ```typescript
     // BEFORE:
     const isVerificationError =
       !!error && error.toLowerCase().includes(DETECTION_EMAIL_VERIFICATION);
     const showNonVerificationError =
       !isVerificationError && !!activeError && !rateLimitInfo.isRateLimited;
     const showResend = isVerificationError && !rateLimitInfo.isRateLimited;

     // AFTER:
     const showError = !!activeError && !rateLimitInfo.isRateLimited;
     ```
  10. Update the `hasError` prop on the password `Input` (around line 477): `hasError={showNonVerificationError}` → `hasError={showError}`
  11. Remove the entire `showResend` conditional block (around lines 489-508) — the "Resend verification email" button and CountdownTimer
  12. Update the non-verification error block (around line 513): `showNonVerificationError` → `showError` in both the className and conditional rendering
  13. Also update the caller in the parent component that passes `onResendVerification` prop — check where `PasswordStep` is rendered (around line 177). Remove the `onResendVerification` prop.

### Step 8: Update Technical Documentation
- **Action**: Update api-spec.yml to reflect the new 401 response for unverified accounts
- **Implementation Steps**:
  1. In `ai-specs/ai-specs/specs/api-spec.yml`, find the `POST /auth/login` section
  2. Remove any 403 response that specifically refers to unverified email
  3. Ensure 401 response description covers: "Invalid credentials — returned for all login failures (user not found, locked, OAuth-only, invalid password, unverified email)"

---

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Normalize exception in login.service.ts
3. Step 2: Update auth-login.spec.ts (2 tests)
4. Step 3: Update auth.service.spec.ts (1 test)
5. Step 4: Verify backend (build + tests)
6. Step 5: Remove DETECTION_EMAIL_VERIFICATION from error-constants.ts
7. Step 6: Simplify AuthContext.tsx login error handler
8. Step 7: Remove verification error UI from LoginForm.tsx
9. Step 8: Update technical documentation

## Testing Checklist

### Backend
- [ ] `nest build` compiles clean
- [ ] `jest auth-login.spec.ts` — all tests pass, 0 ForbiddenException for unverified email
- [ ] `jest auth.service.spec.ts` — all tests pass, 0 ForbiddenException for unverified email
- [ ] All 5 login failure paths return `UnauthorizedException`:
  - User not found (line 140) — already 401
  - Account locked (line 156) — already 401
  - OAuth-only / no password (line 218) — already 401
  - Invalid password (line 254, 272) — already 401
  - Email not verified (line 177) — NOW 401 (was 403)

### Frontend
- [ ] `DETECTION_EMAIL_VERIFICATION` no longer exported from error-constants.ts
- [ ] No import of `DETECTION_EMAIL_VERIFICATION` anywhere in the codebase
- [ ] LoginForm renders correctly without resend verification UI
- [ ] Login errors display generic error message for all failures
- [ ] No TypeScript compilation errors (`npm run build` or `next build`)

## Error Response Format

All login failures now return identical:
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

No 403 response on the login endpoint for any authentication failure path.

## Dependencies

- No new dependencies
- No dependency removals (ForbiddenException still used in other files — CSRF guard, impossible travel, etc.)

## Notes

- **UX trade-off**: Users who haven't verified their email will no longer see a "Resend verification email" button on the login form. Instead, they receive: (1) a generic "Invalid credentials" error, and (2) a silently-sent re-verification email. The existing `POST /auth/resend-verification-public` endpoint remains available if a user needs to manually request re-verification.
- **Security standard**: CWE-203 (Observable Discrepancy), OWASP ASVS V2.2.1
- **Audit finding**: EM-02, originally classified as WARN (HIGH severity)
- **No timing leak**: The email verification check occurs AFTER `validateCredentials()` which already consumes bcrypt time. The `createAndSendVerificationEmail()` call is fire-and-forget and does not affect response timing.
- **ForbiddenException still used**: In login.service.ts, ForbiddenException is NOT used after this change. But in the broader codebase (CSRF guard, impossible travel via token.service.ts), it remains. Only remove the import from login.service.ts.

## Next Steps After Implementation

1. Run `/verify SCRUM-217` to validate plan compliance
2. Run `/commit SCRUM-217` to commit, push, PR, merge, cleanup
3. Run `/update-docs SCRUM-217` to create implementation record and update integration-state.md

## Implementation Verification

- [ ] No `ForbiddenException` thrown in `login.service.ts` for any authentication failure
- [ ] `ForbiddenException` import removed from `login.service.ts`
- [ ] Silent re-verification email sent on unverified login attempt
- [ ] All 3 test files updated and passing
- [ ] Frontend has no references to `DETECTION_EMAIL_VERIFICATION`
- [ ] `api-spec.yml` updated — no 403 on login for unverified email
- [ ] Build clean (backend + frontend)
