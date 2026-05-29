# Fase 9: FRONTEND-BACKEND INTEGRATION — Auth Module

**Date**: 2026-03-15 21:35 UTC
**Module**: auth
**Auditor**: Claude Opus 4.6 (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: WCAG 2.1 AA, SOC 2 CC8.1 (Integration Completeness)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 25    |
| FAIL    | 0     |
| WARN    | 1     |
| N/A     | 0     |

**Overall**: PASS

---

## Detailed Findings

### FE-01: Endpoint coverage
- **Verdict**: PASS
- **Evidence**: All 41 backend auth endpoints have corresponding frontend API calls. Verified across: `lib/api.ts`, `lib/csrf.ts`, `AuthContext`, `MfaSetup`, `PasskeyManager`, `usePasskey`, `ConnectedAccounts`, `ActiveSessions`, `TrustedDevices`, `OAuthButtons`, `OAuthCallbackHandler`, and all auth form components.

### FE-02: Auth headers (Bearer token)
- **Verdict**: PASS
- **Evidence**: `lib/api.ts:34` — `Authorization: \`Bearer ${this.accessToken}\`` auto-injected on every request when token is set.

### FE-03: CSRF integration
- **Verdict**: PASS
- **Evidence**: `lib/api.ts:6,38-43` — `CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])` — all mutation methods auto-fetch and include `X-CSRF-Token` header. CSRF token retry on 403 implemented (lines 59-84). `silentRefresh` also includes CSRF (lines 176-180).

### FE-04: Token refresh
- **Verdict**: PASS
- **Evidence**: `lib/api.ts:88-114` — 401 triggers `silentRefresh()`, POSTs to `/auth/refresh`, retries original request. Refresh deduplicated via `refreshPromise` (line 172). `AuthContext` does initial `refreshSession()` on mount (line 218).

### FE-05: MFA flow
- **Verdict**: PASS
- **Evidence**: `AuthContext.login()` line 232 dispatches `MFA_REQUIRED`. `LoginForm` renders `<MfaTotpStep />` when `mfaRequired` is true (line 145). 6-digit TOTP input with auto-submit (lines 42-61). Recovery code fallback via `useRecovery` toggle (line 18). Calls `verifyMfaLogin(code, isRecoveryCode, trustDevice)`.

### FE-06: MFA setup
- **Verdict**: PASS
- **Evidence**: `MfaSetup.tsx` — Setup POSTs `/auth/mfa/setup`, displays QR code (lines 40-53, 183-252). Verify POSTs `/auth/mfa/verify-setup` (lines 56-73). Disable DELETEs `/auth/mfa` with password (lines 75-93). Regenerate POSTs `/auth/mfa/recovery-codes` (lines 95-112). Status GETs `/auth/mfa/status` (lines 27-34).

### FE-07: Passkey registration
- **Verdict**: PASS
- **Evidence**: `PasskeyManager.tsx` — Registration with optional name (lines 260-295). `usePasskey.registerPasskey()` gets options from `/auth/passkeys/register/options`, calls `startRegistration()` from `@simplewebauthn/browser`, verifies via `/auth/passkeys/register/verify` (usePasskey.ts lines 51-70).

### FE-08: Passkey login
- **Verdict**: PASS
- **Evidence**: `LoginForm.tsx` — "Sign in with passkey" button (lines 249-276). `usePasskey.loginWithPasskey()` flow. Conditional UI (autofill-assisted passkeys) via `startConditionalUI()` (LoginForm lines 66-73). Email field has `autoComplete="username webauthn"` (line 202).

### FE-09: Passkey management
- **Verdict**: PASS
- **Evidence**: `PasskeyManager.tsx` — List GETs `/auth/passkeys` (lines 117-233). Rename modal PATCHes `/auth/passkeys/:id` (lines 133-143, 298-317). Delete modal with password DELETEs `/auth/passkeys/:id` (lines 146-163, 320-341).

### FE-10: Trusted device fingerprint
- **Verdict**: PASS
- **Evidence**: `lib/fingerprint.ts` uses `@fingerprintjs/fingerprintjs`. `AuthContext` line 212-213 generates fingerprint on mount, sets via `apiClient.setDeviceFingerprint(fp)`. `lib/api.ts:35` sends `X-Device-Fingerprint` header on every request.

### FE-11: Trust device after MFA
- **Verdict**: PASS
- **Evidence**: `MfaTotpStep.tsx` — "Trust this device for 30 days" checkbox (lines 291-301 TOTP, 168-178 recovery). `trustDevice` state passed to `verifyMfaLogin()` (line 32). Backend reads `dto.trustDevice` in `mfa.controller.ts:115-123`.

### FE-12: Trusted device management
- **Verdict**: PASS
- **Evidence**: `TrustedDevices.tsx` — List via `useTrustedDevices` hook GETs `/auth/trusted-devices` (lines 54-56). Individual revoke DELETEs `/auth/trusted-devices/:id` (lines 69-79). Revoke all DELETEs `/auth/trusted-devices` (lines 82-92). Trust current device POSTs `/auth/trusted-devices` (lines 58-67). Confirmation modals (lines 188-210).

### FE-13: Session management
- **Verdict**: PASS
- **Evidence**: `ActiveSessions.tsx` — List GETs `/auth/sessions` with current session highlighted (lines 55-65). Individual revoke DELETEs `/auth/sessions/:id` (lines 71-81). Revoke all POSTs `/auth/logout-all` (lines 83-93). Current session badge prevents self-revocation (line 154, 167).

### FE-14: Account lockout UX
- **Verdict**: PASS
- **Evidence**: Login detects `retryAfter` + `code === 'FORBIDDEN'` (AuthContext lines 249-257, `detectRateLimitKind` line 158-160). `RateLimitBanner` shows countdown with `CountdownTimer` (animated digit boxes, MM:SS). Lockout uses `Lock` icon vs throttle uses `AlertTriangle` icon (line 47).

### FE-15: Rate limit UX
- **Verdict**: PASS
- **Evidence**: `lib/api.ts:152-157` — `parseErrorResponse` extracts `Retry-After` header from 429. All auth methods (login, register, forgotPassword, etc.) catch `retryAfter` and throw `RateLimitError`. All forms use `useRateLimit` hook + `RateLimitBanner` with countdown.

### FE-16: Change email
- **Verdict**: PASS
- **Evidence**: `ChangeEmailForm.tsx` — Form with new email + current password. Calls `requestEmailChange()` POSTing `/users/me/email`. OAuth-only accounts shown informational message. `verify-email-change/page.tsx` handles token verification via POST `/auth/verify-email-change`.

### FE-17: Delete account
- **Verdict**: PASS
- **Evidence**: `DeleteAccount.tsx` — "Danger Zone" card. Confirmation modal with "Type DELETE to confirm" + password field (conditional on `hasPassword`). Calls `deleteAccount()` DELETing `/users/me`. Focus trap, Escape key, `aria-modal`, `aria-labelledby` (lines 62-109). After deletion: logout + redirect to `/login`.

### FE-18: Unlink OAuth
- **Verdict**: PASS
- **Evidence**: `ConnectedAccounts.tsx` — Lists Google/GitHub with connect/disconnect. Disconnect calls `unlinkOAuth(provider, password)` DELETing `/users/me/oauth/:provider`. Connect generates link code (POST `/auth/link/code`), redirects to `/auth/link/:provider`. Last-auth-method guard shows "Set a password first" (line 164-166).

### FE-19: Password management
- **Verdict**: PASS
- **Evidence**: `ChangePasswordForm` PATCHes `/users/me/password`. "Set Password" mode for OAuth-only users. `ForgotPasswordForm` POSTs `/auth/forgot-password` with Turnstile. `ResetPasswordForm` POSTs `/auth/reset-password`, validates token on mount via `/auth/validate-reset-token`.

### FE-20: OAuth flow
- **Verdict**: PASS
- **Evidence**: `OAuthButtons` — Direct `<a>` links to `${API_BASE_URL}/auth/google` and `/auth/github`. `OAuthCallbackHandler` (`app/auth/callback/page.tsx`) POSTs `/auth/oauth/exchange`. Error handling via URL `?error=` parameter. `AuthContext` skips refresh on `/auth/callback` to prevent race (line 214).

### FE-21: Email verification
- **Verdict**: PASS
- **Evidence**: `VerifyEmailStatus` POSTs `/auth/verify-email` with token from query. `verify-email-change/page.tsx` POSTs `/auth/verify-email-change`. `AuthContext.resendVerification()` POSTs `/auth/resend-verification` (authenticated). `resendVerificationPublic()` POSTs `/auth/resend-verification-public` (public, Turnstile). `ProtectedRoute` redirects unverified to `/activation/check-email` (line 19-21).

### FE-22: Route guards
- **Verdict**: PASS
- **Evidence**: `ProtectedRoute.tsx` — Checks `isInitialized` + `isAuthenticated`, redirects to `/login` if unauthenticated (line 13-15), redirects to `/activation/check-email` if unverified (line 18-21). Also: `GuestRoute`, `AdminRoute`, `PermissionRoute`, `Can` guard components. Profile page wrapped in `<ProtectedRoute>`.

### FE-23: Security headers
- **Verdict**: PASS
- **Evidence**: `middleware.ts` — Cryptographic nonce via `crypto.getRandomValues` (lines 50-53). Full CSP: `default-src 'self'`, `script-src` with nonce + `strict-dynamic`, `style-src` with nonce, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`. Turnstile domains whitelisted.

### FE-24: Error boundaries
- **Verdict**: PASS
- **Evidence**: `app/error.tsx` — Root error boundary with "Something went wrong", retry button, home link. Hides error message in production (line 42-44). `app/global-error.tsx` — Global boundary with full HTML shell for layout-level errors.

### FE-25: Form validation consistency
- **Verdict**: PASS
- **Evidence**: `lib/validation.ts` — `PASSWORD_MIN_LENGTH = 8` matches backend `@MinLength(8)`, `PASSWORD_MAX_LENGTH = 128` matches backend `@MaxLength(128)`. Comment: "Must match backend DTOs" (lines 1-2). `validatePassword()` used in all auth forms.

### FE-26: Accessibility on auth flows
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: Strong a11y foundation: `Input` component has `<label htmlFor>`, `aria-invalid`, `aria-describedby`, `role="alert"` on errors. Error messages use `aria-live="polite"`. Password toggle has `aria-label`. DeleteAccount modal has `role="dialog"`, `aria-modal`, focus trap. MFA digit inputs have `aria-label`. 4 minor gaps:
  1. `MfaTotpStep.tsx:248` — TOTP digit container missing `role="group"` + `aria-label`
  2. `MfaTotpStep.tsx:291-301` — Trust checkbox uses implicit label (works but explicit `htmlFor` recommended)
  3. `ConnectedAccounts.tsx:213` — Disconnect modal missing `role="dialog"` + `aria-modal`
  4. `MfaTotpStep.tsx:128-138` — Recovery code input `<label>` without `htmlFor`/`id` binding
- **Standard**: WCAG 2.1 Level A (1.3.1 Info and Relationships, 4.1.2 Name/Role/Value)

---

## Recommendations

1. **FE-26 (WARN)**: Fix 4 a11y gaps: add `role="group"` to TOTP container, add `role="dialog"` to ConnectedAccounts modal, add explicit `htmlFor`/`id` to recovery code label, add explicit `htmlFor` to trust checkbox.
