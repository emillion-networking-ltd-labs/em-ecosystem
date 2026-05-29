# Phase 9: FRONTEND-BACKEND INTEGRATION — Auth Module

**Date**: 2026-03-17 12:03
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP ASVS V8.2, WCAG 2.1 AA, SOC 2 CC6.1

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 26    |
| FAIL    | 0     |
| WARN    | 0     |
| N/A     | 0     |

**Overall**: PASS

**Delta vs audit-2026-03-16T14-42**: FE-24 upgraded WARN → PASS (error.tsx boundaries added to all auth routes). FE-26 upgraded WARN → PASS (focus trap added to ConnectedAccounts, aria-live present throughout).

---

## Detailed Findings

### FE-01: Endpoint coverage
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: SOC 2 CC6.1
- **Evidence**: All backend auth and user endpoints have corresponding frontend API calls. Coverage verified across:
  - `src/lib/api.ts` — base ApiClient (GET/POST/PUT/PATCH/DELETE/deleteWithBody)
  - `src/lib/passkey-api.ts` — 6 endpoints: `POST /auth/passkeys/register/options`, `POST /auth/passkeys/register/verify`, `POST /auth/passkeys/login/options`, `POST /auth/passkeys/login/verify`, `GET /auth/passkeys`, `PATCH /auth/passkeys/:id`, `DELETE /auth/passkeys/:id`
  - `src/lib/oauth-api.ts` — `DELETE /users/me/oauth/:provider`, `GET /users/me/oauth`, `POST /auth/link/code`
  - `src/lib/trusted-device-api.ts` — `POST /auth/trusted-devices`, `GET /auth/trusted-devices`, `DELETE /auth/trusted-devices/:id`, `DELETE /auth/trusted-devices`
  - `src/lib/delete-account-api.ts` — `DELETE /users/me`
  - `src/lib/email-change-api.ts` — `POST /users/me/email`
  - `src/lib/security-activity-api.ts` — `GET /users/me/security-activity`, `GET /auth/sessions`, `DELETE /auth/sessions/:id`, `POST /auth/logout-all`
  - `src/context/AuthContext.tsx` — `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/oauth/exchange`, `/auth/mfa/verify-login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/resend-verification`, `/auth/validate-reset-token`, `/auth/resend-verification-public`
  - `src/components/profile/MfaSetup.tsx` — `/auth/mfa/status`, `/auth/mfa/setup`, `/auth/mfa/verify-setup`, `DELETE /auth/mfa`, `POST /auth/mfa/recovery-codes`
  - `src/components/profile/ChangePasswordForm.tsx` — `PATCH /users/me/password`
  - `src/app/verify-email-change/page.tsx` — `POST /auth/verify-email-change`
  - `src/components/auth/VerifyEmailStatus.tsx` — `POST /auth/verify-email`
  - `src/lib/csrf.ts` — `GET /auth/csrf-token`
  - Backend endpoints `GET /auth/google`, `GET /auth/github`, `GET /auth/google/callback`, `GET /auth/github/callback`, `GET /auth/link/google`, `GET /auth/link/github` are server-side redirects handled via `window.location.href` (OAuth flow), not apiClient — correct pattern.
  - Backend endpoint `GET /auth/admin` is a backend-only test route with no required frontend call — acceptable gap.

### FE-02: Auth headers
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Standard**: OWASP ASVS V3.3.1
- **Evidence**: `src/lib/api.ts` line 34: `Authorization: Bearer ${this.accessToken}` added to all requests when token is present. `credentials: 'include'` ensures httpOnly refresh cookies are sent. Authorization header is omitted when `accessToken` is null (unauthenticated requests), which is the correct behaviour.

### FE-03: CSRF integration
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Standard**: OWASP ASVS V4.2.2
- **Evidence**: `src/lib/api.ts` lines 6, 38-43: `CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])`. `getCsrfToken()` is called before every state-changing request; token included as `X-CSRF-Token` header. On 403 CSRF error (`src/lib/api.ts` lines 59-85): token is cleared, refreshed, and the request is retried exactly once. `src/context/AuthContext.tsx` lines 185-189: `/auth/refresh` and `/auth/logout` also send CSRF token directly (outside ApiClient).

### FE-04: Token refresh
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: OWASP ASVS V3.3.1
- **Evidence**: `src/lib/api.ts` lines 88-115: 401 with an existing access token triggers `silentRefresh()`. `silentRefresh()` (lines 171-194) is deduplication-protected via `refreshPromise` (concurrent requests during refresh receive the same promise). On success the token is stored and request retried; on failure the original error propagates. `src/context/AuthContext.tsx` `refreshSession()` uses the same endpoint on page load.

### FE-05: MFA flow
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: NIST 800-63B §5.1.3
- **Evidence**: `src/context/AuthContext.tsx` lines 232-237: `isMfaResponse()` detects `{ mfaRequired: true, mfaToken }` and dispatches `MFA_REQUIRED`. `src/components/auth/LoginForm.tsx` line 145: renders `<MfaTotpStep />` when `mfaRequired`. `src/components/auth/MfaTotpStep.tsx`: 6-digit TOTP input with auto-submit at digit 6, paste handler, keyboard backspace navigation, `useRecovery` state toggles recovery code fallback, `trustDevice` checkbox in both TOTP and recovery views.

### FE-06: MFA setup
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: NIST 800-63B §5.1.3
- **Evidence**: `src/components/profile/MfaSetup.tsx`: full state machine (`status | setup | verify | recovery-codes | disable | regenerate`). Setup: `POST /auth/mfa/setup` returns `qrCodeDataUrl` (displayed via `<img>`) + `secret` (copyable). Verify: `POST /auth/mfa/verify-setup` with 6-digit code. Disable: `DELETE /auth/mfa` with password confirmation. Recovery regeneration: `POST /auth/mfa/recovery-codes` with password confirmation. Recovery codes displayed in 2-column grid with copy-all button.

### FE-07: Passkey registration
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Standard**: FIDO2 / WebAuthn Level 2
- **Evidence**: `src/hooks/usePasskey.ts` lines 51-70: `registerPasskey()` calls `passkeyRegisterOptions()` → `POST /auth/passkeys/register/options`, passes options to `@simplewebauthn/browser` `startRegistration()`, then calls `passkeyRegisterVerify()` → `POST /auth/passkeys/register/verify`. `NotAllowedError` silently ignored (user cancelled). `src/components/profile/PasskeyManager.tsx`: UI with optional name input, shows browser support warning when `!isSupported`, limit of 10 passkeys enforced.

### FE-08: Passkey login
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Standard**: FIDO2 / WebAuthn Level 2
- **Evidence**: `src/components/auth/LoginForm.tsx` lines 249-276: "Sign in with passkey" button visible when `passkeySupported`. `src/hooks/usePasskey.ts` lines 72-91: `loginWithPasskey()` calls `passkeyLoginOptions()` → `POST /auth/passkeys/login/options`, then `startAuthentication()` → `passkeyLogin()` in AuthContext → `POST /auth/passkeys/login/verify`. Conditional UI (passkey autofill on email input): `autoComplete="username webauthn"` on email field, `startAuthentication({ useBrowserAutofill: true })` initiated via `startConditionalUI()`. `isConditionalMediationAvailable()` checked before activating conditional UI.

### FE-09: Passkey management
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Standard**: SOC 2 CC6.1
- **Evidence**: `src/components/profile/PasskeyManager.tsx`: list of passkeys with device type icon, last-used timestamp, sync badge. Rename via ConfirmModal → `PATCH /auth/passkeys/:id`. Delete via ConfirmModal with password field → `DELETE /auth/passkeys/:id`. `aria-label` attributes on rename and delete buttons.

### FE-10: Trusted device fingerprint
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: OWASP ASVS V3.3.1
- **Evidence**: `src/lib/fingerprint.ts`: `@fingerprintjs/fingerprintjs` used to compute `visitorId`. Fail-open on error (returns `''`, does not block login). `src/context/AuthContext.tsx` lines 212-213: fingerprint loaded on mount and set via `apiClient.setDeviceFingerprint(fp)`. `src/lib/api.ts` line 35: `X-Device-Fingerprint` header injected on every request when fingerprint is available.

### FE-11: Trust device after MFA
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Standard**: NIST 800-63B §5.1.3
- **Evidence**: `src/components/auth/MfaTotpStep.tsx` lines 307-322 (TOTP view) and lines 171-186 (recovery view): `htmlFor="trust-totp"` / `htmlFor="trust-recovery"` labelled checkbox with state `trustDevice`. `verifyMfaLogin(codeStr, isRecovery, trustDevice)` at line 32: `trustDevice: true` included in body when checked. Backend `/auth/mfa/verify-login` uses this flag to call the trust endpoint.

### FE-12: Trusted device management
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Standard**: SOC 2 CC6.1
- **Evidence**: `src/components/profile/TrustedDevices.tsx`: device list with name, IP, last-verified, expiry. Revoke individual device via `DELETE /auth/trusted-devices/:id` (ConfirmModal). Revoke all via `DELETE /auth/trusted-devices` (ConfirmModal). "Trust This Device" button calls `trustCurrentDevice()` which reads fingerprint and calls `POST /auth/trusted-devices`. `aria-label` on revoke buttons.

### FE-13: Session management
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: OWASP ASVS V3.3.4
- **Evidence**: `src/components/profile/ActiveSessions.tsx`: fetches `GET /auth/sessions`, displays session list with browser/OS parsed from User-Agent, IP, last-active time. Current session marked with "Current" badge and no revoke button. Individual revoke: `DELETE /auth/sessions/:id`. Revoke all others: `POST /auth/logout-all`. Error state displays `role="alert"` + `aria-live="polite"` message.

### FE-14: Account lockout UX
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: OWASP ASVS V2.2.1
- **Evidence**: `src/context/AuthContext.tsx` lines 158-160: `detectRateLimitKind()` returns `"lockout"` when `error.code === "FORBIDDEN"`, `"throttle"` otherwise. Both login and MFA verify flows throw `RateLimitError` with `retryAfter` and `kind`. `src/components/ui/RateLimitBanner.tsx` line 47: displays `<Lock>` icon for lockout vs `<AlertTriangle>` for throttle. `CountdownTimer` provides real-time countdown. Login form shows toast "check your email for further instructions" on throttle.

### FE-15: Rate limit UX
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Standard**: RFC 6585 §4
- **Evidence**: `src/lib/api.ts` lines 152-157: `parseErrorResponse()` reads `Retry-After` response header and attaches `retryAfter` to the error body when status is 429 or 401. `src/lib/types.ts` `RateLimitError` class carries `retryAfter` integer. `src/hooks/useRateLimit.ts`: `setRateLimit(retryAfter, message, kind)` sets countdown state. `src/components/ui/RateLimitBanner.tsx` renders `<CountdownTimer seconds={secondsLeft} />` that auto-clears on expiry via `onExpired` callback. Rate limit handling present in login, register, MFA verify, forgot-password, resend-verification, trusted-device, and OAuth unlink flows.

### FE-16: Change email
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Standard**: SOC 2 CC6.1
- **Evidence**: `src/components/profile/ChangeEmailForm.tsx`: form with new-email field + current-password field. Client-side validation: email regex, same-email guard, password length ≥ 8. Calls `POST /users/me/email`. OAuth-only accounts shown info block instead of form. `src/app/verify-email-change/page.tsx`: reads `?token=` from URL, calls `POST /auth/verify-email-change`, shows success/failure state with navigation button. `src/app/verify-email-change/error.tsx`: error boundary present.

### FE-17: Delete account
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Standard**: SOC 2 CC6.1
- **Evidence**: `src/components/profile/DeleteAccount.tsx`: danger-zone card triggers modal with two guards: type-"DELETE" confirmation text AND password field (when `user.hasPassword`). `DELETE /users/me` called with optional password. On success: `logout()` then redirect to `/login`. Modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby="delete-account-modal-title"`. Focus trap (Escape + Tab cycle) implemented via `useEffect`.

### FE-18: Unlink OAuth
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Standard**: SOC 2 CC6.1
- **Evidence**: `src/components/profile/ConnectedAccounts.tsx`: per-provider "Disconnect" button guarded by `isLastAuthMethod` check (shows "Set a password first" when it's the only auth method). Modal requires password for `DELETE /users/me/oauth/:provider`. Connect flow: `POST /auth/link/code` generates a state code, then `window.location.href` redirects to `/auth/link/:provider?code=...`. Modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby="disconnect-title"`, Escape handler, and full focus trap with Tab-cycle and previousFocus restore.

### FE-19: Password management
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: NIST 800-63B §5.1.1
- **Evidence**: `src/components/profile/ChangePasswordForm.tsx`: change (current + new + confirm) or set (new + confirm for OAuth-only users). `validatePassword()` enforces 8–128 char range matching backend DTO. `PATCH /users/me/password`. On success with current password: logs out and redirects to `/login`. `src/context/AuthContext.tsx`: `forgotPassword()` → `POST /auth/forgot-password`, `resetPassword()` → `POST /auth/reset-password`. `src/components/auth/ForgotPasswordForm.tsx` and `src/components/auth/ResetPasswordForm.tsx` implement these flows. `src/context/AuthContext.tsx` `validateResetToken()` → `POST /auth/validate-reset-token` used to pre-validate token on page load.

### FE-20: OAuth flow
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: RFC 6749 §4.1
- **Evidence**: `src/components/auth/OAuthButtons.tsx`: anchor tags to `GET /auth/google` and `GET /auth/github` (full-page redirect — correct for OAuth). `src/components/auth/OAuthCallbackHandler.tsx`: reads `?error=` URL param (backend error passthrough) and redirects to `/login?oauth_error=...`. On success: calls `POST /auth/oauth/exchange` via `handleOAuthCallback()`. Double-fire protection: `processed.current` ref guard prevents StrictMode re-runs. `src/context/AuthContext.tsx`: `/auth/callback` path skips the initial `refreshSession()` to avoid race condition.

### FE-21: Email verification
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: NIST 800-63B §5.1.6
- **Evidence**: `src/components/auth/VerifyEmailStatus.tsx`: reads `?token=` from URL, calls `POST /auth/verify-email`, displays success (CircleCheck) or failure (CircleX) state with navigation link. `src/context/AuthContext.tsx` `resendVerification()` → `POST /auth/resend-verification` (authenticated, for logged-in unverified users). `resendVerificationPublic()` → `POST /auth/resend-verification-public` (public). `src/app/activation/check-email/page.tsx`: post-registration landing page with "Back to Sign In" link. `src/app/verify-email/error.tsx`: error boundary present.

### FE-22: Route guards
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Standard**: OWASP ASVS V4.1.1
- **Evidence**:
  - `src/components/guards/ProtectedRoute.tsx`: redirects to `/login` when `isInitialized && !isAuthenticated`. Additional guard: redirects to `/activation/check-email` when `user.emailVerified === false`.
  - `src/components/guards/AdminRoute.tsx`: wraps `ProtectedRoute` + checks `user.role === 'ADMIN' || 'SUPERADMIN'`, redirects to `/dashboard` otherwise.
  - `src/components/guards/GuestRoute.tsx`: redirects to `/dashboard` when authenticated.
  - All guards show `RingSpinner` during `!isInitialized` to prevent flash of protected content.
  - `src/components/guards/PermissionRoute.tsx` and `src/components/guards/Can.tsx`: fine-grained permission guards.

### FE-23: Security headers
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: OWASP ASVS V14.4.1
- **Evidence**: `src/middleware.ts`: CSP generated per-request with unique `nonce = btoa(crypto.getRandomValues(Uint8Array(16)))`. CSP directives include: `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`, `style-src 'self' 'nonce-${nonce}'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`. Nonce passed to Next.js request headers as `x-nonce` and also set in the response headers. Dev mode adds `'unsafe-eval'` and `ws://` for HMR only. Turnstile CDN whitelisted in `script-src` and `frame-src`.

### FE-24: Error boundaries
- **Verdict**: PASS
- **Severity**: LOW
- **Standard**: ISO 25010 Reliability
- **Evidence**: All required auth route `error.tsx` boundaries confirmed present:
  - `src/app/error.tsx` — global root boundary
  - `src/app/login/error.tsx` — delegates to `<AuthErrorFallback context="login" />`
  - `src/app/register/error.tsx` — error boundary present
  - `src/app/forgot-password/error.tsx` — error boundary present
  - `src/app/reset-password/error.tsx` — error boundary present
  - `src/app/verify-email/error.tsx` — error boundary present
  - `src/app/verify-email-change/error.tsx` — error boundary present
  - `src/app/auth/callback/error.tsx` — error boundary present
  - `src/app/profile/error.tsx` — error boundary present (covers MfaSetup, PasskeyManager, TrustedDevices, ActiveSessions)
  - `src/components/auth/AuthErrorFallback.tsx`: renders error message (digest reference in prod), "Try again" reset button, "Go to login" fallback. Error logged to `console.error` with context label.
  - **Delta**: Previous audit (2026-03-16T14-42) reported WARN due to missing profile-level and several auth route boundaries. All gaps are now resolved.

### FE-25: Form validation consistency
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Standard**: OWASP ASVS V5.1.3
- **Evidence**: Frontend validation in `src/lib/validation.ts` is explicitly annotated with backend DTO references:
  - `PASSWORD_MIN_LENGTH = 8` matches `@MinLength(8)` in `register.dto.ts` and `reset-password.dto.ts`
  - `PASSWORD_MAX_LENGTH = 128` matches `@MaxLength(128)` in the same DTOs
  - Email validated with `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` (consistent with backend `@IsEmail()`)
  - Passkey name `maxLength={64}` on input matches `@MaxLength(64)` in `passkey-register-verify.dto.ts` and `passkey-rename.dto.ts`
  - `ChangeEmailForm` password guard: `password.length >= 8` consistent with backend password constraint
  - `DeleteAccount` password guard: `password.length >= 8` consistent
  - `MfaSetup` verify-setup: 6-digit TOTP (`.replace(/\D/g, "").slice(0, 6)`) consistent with backend `mfa-verify-setup.dto.ts` `@Length(6, 6)` + `@Matches(/^\d{6}$/)`

### FE-26: Accessibility
- **Verdict**: PASS
- **Severity**: LOW
- **Standard**: WCAG 2.1 AA
- **Evidence**: Comprehensive a11y implementation verified across all auth flows:
  - **Labels**: All form inputs have `<label>` with `htmlFor`/`id` binding or use the `Input` component which handles this. MFA checkboxes (`trust-totp`, `trust-recovery`) correctly labelled via `htmlFor`.
  - **aria-live**: Error containers use `role="alert"` + `aria-live="polite"` in LoginForm (email step, password step), RegisterForm, ForgotPasswordForm, ResetPasswordForm, MfaTotpStep (both TOTP and recovery views), ActiveSessions load error. MfaSetup error uses `role="alert"` + `aria-live="polite"` on the error `<p>`.
  - **TOTP digit group**: `role="group"` + `aria-label="Verification code digits"` on container; each digit input has `aria-label="Digit N"`.
  - **Passkey button**: `aria-label="Sign in with passkey"` on login form button.
  - **Passkey management buttons**: `aria-label="Rename {name}"` and `aria-label="Delete {name}"` on icon buttons.
  - **Trusted devices**: `aria-label="Revoke trust for {deviceName}"` on revoke buttons.
  - **Focus management**: DeleteAccount modal: saves `previousFocusRef`, focuses first focusable on open, restores on close. ConnectedAccounts disconnect modal: full focus trap with Tab-cycle, Escape handler, previousFocus restore.
  - **Dialog semantics**: DeleteAccount modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. ConnectedAccounts disconnect modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby="disconnect-title"`.
  - **Delta**: Previous audit (2026-03-16T14-42) reported WARN for missing focus trap on ConnectedAccounts modal. Focus trap is now present (added in SCRUM-259 / PR #110).

---

## Recurrence Analysis (vs audit-2026-03-16T14-42)

| Check | Previous | Current | Delta |
|-------|----------|---------|-------|
| FE-01 | PASS | PASS | Stable |
| FE-02 | PASS | PASS | Stable |
| FE-03 | PASS | PASS | Stable |
| FE-04 | PASS | PASS | Stable |
| FE-05 | PASS | PASS | Stable |
| FE-06 | PASS | PASS | Stable |
| FE-07 | PASS | PASS | Stable |
| FE-08 | PASS | PASS | Stable |
| FE-09 | PASS | PASS | Stable |
| FE-10 | PASS | PASS | Stable |
| FE-11 | PASS | PASS | Stable |
| FE-12 | PASS | PASS | Stable |
| FE-13 | PASS | PASS | Stable |
| FE-14 | PASS | PASS | Stable |
| FE-15 | PASS | PASS | Stable |
| FE-16 | PASS | PASS | Stable |
| FE-17 | PASS | PASS | Stable |
| FE-18 | PASS | PASS | Stable |
| FE-19 | PASS | PASS | Stable |
| FE-20 | PASS | PASS | Stable |
| FE-21 | PASS | PASS | Stable |
| FE-22 | PASS | PASS | Stable |
| FE-23 | PASS | PASS | Stable |
| FE-24 | WARN | PASS | RESOLVED — error.tsx added to all 7 auth routes + profile |
| FE-25 | PASS | PASS | Stable |
| FE-26 | WARN | PASS | RESOLVED — focus trap in ConnectedAccounts, aria-live comprehensive |

**Resolved since previous audit**: 2 (FE-24, FE-26)
**New findings**: 0
**Regressions**: 0

---

## Recommendations

No findings. All 26 checks pass.

Phase 9 frontend-backend integration is at 100% pass rate for this audit cycle.
