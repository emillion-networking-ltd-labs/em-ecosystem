# SCRUM-300 — Plan: Restore resend verification email (CWE-203 safe)

## Scope
Fullstack (backend + frontend)

## Steps

### Step 1 — Backend: Remove auto-send from login flow
**File**: `nexacore-api/src/auth/login.service.ts`
- Remove `this.emailVerificationService.createAndSendVerificationEmail(user).catch(() => {})` from `checkEmailVerification()`
- Keep `UnauthorizedException(INVALID_CREDENTIALS)` and audit log

### Step 2 — Backend: Verify rate limit on resend endpoint
**File**: `nexacore-api/src/auth/account.controller.ts`
- Already has `@Throttle({ sensitive_action: 3/15min })` + `@UseGuards(TurnstileGuard)`
- `resendVerificationByEmail()` has 60s cooldown + anti-enumeration
- No changes needed

### Step 3 — Frontend: Add generic hint in LoginForm
**File**: `nexacore-dashboard/src/components/auth/LoginForm.tsx`
- Below error area in PasswordStep: static hint for ALL login errors
- "If you recently registered, check your inbox or resend verification email"
- Link to `/resend-verification` — shown for ALL errors (no enumeration)

### Step 4 — Frontend: Create /resend-verification page
**Files**: `src/app/resend-verification/page.tsx` + `src/components/auth/ResendVerificationForm.tsx`
- AuthLayout narrow (350px), email input, Turnstile, submit button
- CountdownTimer 60s after submit, disables button
- Always shows "If an account exists, verification link sent" (anti-enumeration)
- Uses `resendVerificationPublic()` from AuthContext

### Step 5 — Backend test update
**File**: `nexacore-api/src/auth/tests/auth-login.spec.ts`
- Remove assertion that verification email is sent on login
- Add test confirming no email sent

### Step 6 — Build verification
- Backend: `npm test` passes
- Frontend: `npx next build` compiles
- 0 TypeScript errors

## Security
- CWE-203: login never reveals account state
- Resend returns 200 OK regardless
- Rate limit: 3/15min + 60s cooldown + Turnstile
- Hint shown for ALL errors
