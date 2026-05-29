# Phase 9: FRONTEND-BACKEND INTEGRATION — Auth Module

**Date**: 2026-03-16T23:31
**Auditor**: Claude Opus 4.6
**Module**: auth
**Frontend root**: `nexacore-dashboard/src/`
**Backend root**: `nexacore-api/src/auth/`
**Standards**: OWASP ASVS V8.2, WCAG 2.1 AA, SOC 2 CC6.1
**Previous audit**: 2026-03-16T22:30

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 25    |
| FAIL    | 0     |
| WARN    | 1     |
| N/A     | 0     |

---

## FE-01 — Endpoint Coverage

**Verdict**: **PASS**
**Severity**: HIGH
**Standard**: SOC 2 CC6.1

### Backend Endpoints (Auth Controllers)

| # | Backend Endpoint | Frontend Call | File |
|---|-----------------|--------------|------|
| 1 | `GET /auth/csrf-token` | `getCsrfToken()` | `lib/csrf.ts:13` |
| 2 | `POST /auth/register` | `apiClient.post('/auth/register')` | `context/AuthContext.tsx:278` |
| 3 | `POST /auth/login` | `apiClient.post('/auth/login')` | `context/AuthContext.tsx:226` |
| 4 | `POST /auth/refresh` | `fetch('/auth/refresh')` | `context/AuthContext.tsx:186`, `lib/api.ts:177` |
| 5 | `POST /auth/logout` | `fetch('/auth/logout')` | `context/AuthContext.tsx:382` |
| 6 | `POST /auth/logout-all` | `apiClient.post('/auth/logout-all')` | `components/profile/ActiveSessions.tsx:97` |
| 7 | `GET /auth/me` | `apiClient.get('/auth/me')` | `context/AuthContext.tsx:197,241,316,359,414` |
| 8 | `GET /auth/admin` | Admin route guard (role-based) | `components/guards/AdminRoute.tsx` |
| 9 | `POST /auth/verify-email` | `apiClient.post('/auth/verify-email')` | `components/auth/VerifyEmailStatus.tsx:20` |
| 10 | `POST /auth/verify-email-change` | `apiClient.post('/auth/verify-email-change')` | `app/verify-email-change/page.tsx:22` |
| 11 | `POST /auth/resend-verification` | `apiClient.post('/auth/resend-verification')` | `context/AuthContext.tsx:515` |
| 12 | `POST /auth/resend-verification-public` | `apiClient.post('/auth/resend-verification-public')` | `context/AuthContext.tsx:557` |
| 13 | `POST /auth/forgot-password` | `apiClient.post('/auth/forgot-password')` | `context/AuthContext.tsx:450` |
| 14 | `POST /auth/reset-password` | `apiClient.post('/auth/reset-password')` | `context/AuthContext.tsx:483` |
| 15 | `POST /auth/validate-reset-token` | `apiClient.post('/auth/validate-reset-token')` | `context/AuthContext.tsx:542` |
| 16 | `GET /auth/sessions` | `apiClient.get('/auth/sessions')` | `components/profile/ActiveSessions.tsx:65` |
| 17 | `DELETE /auth/sessions/:id` | `apiClient.delete('/auth/sessions/:id')` | `components/profile/ActiveSessions.tsx:81` |
| 18 | `POST /auth/trusted-devices` | `apiClient.post('/auth/trusted-devices')` | `lib/trusted-device-api.ts:10` |
| 19 | `GET /auth/trusted-devices` | `apiClient.get('/auth/trusted-devices')` | `lib/trusted-device-api.ts:14` |
| 20 | `DELETE /auth/trusted-devices` | `apiClient.delete('/auth/trusted-devices')` | `lib/trusted-device-api.ts:22` |
| 21 | `DELETE /auth/trusted-devices/:id` | `apiClient.delete('/auth/trusted-devices/:id')` | `lib/trusted-device-api.ts:18` |
| 22 | `POST /auth/passkeys/register/options` | `apiClient.post('/auth/passkeys/register/options')` | `lib/passkey-api.ts:12` |
| 23 | `POST /auth/passkeys/register/verify` | `apiClient.post('/auth/passkeys/register/verify')` | `lib/passkey-api.ts:16` |
| 24 | `POST /auth/passkeys/login/options` | `apiClient.post('/auth/passkeys/login/options')` | `lib/passkey-api.ts:23` |
| 25 | `POST /auth/passkeys/login/verify` | `apiClient.post('/auth/passkeys/login/verify')` | `lib/passkey-api.ts:28` |
| 26 | `GET /auth/passkeys` | `apiClient.get('/auth/passkeys')` | `lib/passkey-api.ts:36` |
| 27 | `PATCH /auth/passkeys/:id` | `apiClient.patch('/auth/passkeys/:id')` | `lib/passkey-api.ts:40` |
| 28 | `DELETE /auth/passkeys/:id` | `apiClient.deleteWithBody('/auth/passkeys/:id')` | `lib/passkey-api.ts:44` |
| 29 | `POST /auth/mfa/setup` | `apiClient.post('/auth/mfa/setup')` | `components/profile/MfaSetup.tsx:58` |
| 30 | `POST /auth/mfa/verify-setup` | `apiClient.post('/auth/mfa/verify-setup')` | `components/profile/MfaSetup.tsx:79` |
| 31 | `POST /auth/mfa/verify-login` | `apiClient.post('/auth/mfa/verify-login')` | `context/AuthContext.tsx:409` |
| 32 | `DELETE /auth/mfa` | `apiClient.delete('/auth/mfa')` | `components/profile/MfaSetup.tsx:100` |
| 33 | `POST /auth/mfa/recovery-codes` | `apiClient.post('/auth/mfa/recovery-codes')` | `components/profile/MfaSetup.tsx:123` |
| 34 | `GET /auth/mfa/status` | `apiClient.get('/auth/mfa/status')` | `components/profile/MfaSetup.tsx:43` |
| 35 | `GET /auth/google` | `<a href="/auth/google">` | `components/auth/OAuthButtons.tsx:11` |
| 36 | `GET /auth/google/callback` | Server-side redirect | N/A (backend handles) |
| 37 | `GET /auth/github` | `<a href="/auth/github">` | `components/auth/OAuthButtons.tsx:23` |
| 38 | `GET /auth/github/callback` | Server-side redirect | N/A (backend handles) |
| 39 | `POST /auth/oauth/exchange` | `apiClient.post('/auth/oauth/exchange')` | `context/AuthContext.tsx:311` |
| 40 | `POST /auth/link/code` | `apiClient.post('/auth/link/code')` | `lib/oauth-api.ts:19` |
| 41 | `GET /auth/link/google` | `window.location.href` redirect | `components/profile/ConnectedAccounts.tsx:163` |
| 42 | `GET /auth/link/github` | `window.location.href` redirect | `components/profile/ConnectedAccounts.tsx:163` |

### Users Controller (auth-related)

| # | Backend Endpoint | Frontend Call | File |
|---|-----------------|--------------|------|
| 43 | `PATCH /users/me/password` | `apiClient.patch('/users/me/password')` | `components/profile/ChangePasswordForm.tsx:42` |
| 44 | `POST /users/me/email` | `apiClient.post('/users/me/email')` | `lib/email-change-api.ts:4` |
| 45 | `DELETE /users/me` | `apiClient.delete('/users/me')` | `lib/delete-account-api.ts:5` |
| 46 | `GET /users/me/oauth` | `apiClient.get('/users/me/oauth')` | `lib/oauth-api.ts:15` |
| 47 | `DELETE /users/me/oauth/:provider` | `apiClient.deleteWithBody('/users/me/oauth/:provider')` | `lib/oauth-api.ts:8` |
| 48 | `GET /users/me/security-activity` | `apiClient.get('/users/me/security-activity')` | `lib/security-activity-api.ts:13` |

**Evidence**: All 42 auth controller endpoints and 6 auth-related users controller endpoints have corresponding frontend calls. No missing integrations.

---

## FE-02 — Auth Headers

**Verdict**: **PASS**
**Severity**: CRITICAL
**Standard**: OWASP ASVS V8.2

**Evidence**: `lib/api.ts:34` -- `Authorization: Bearer ${this.accessToken}` is conditionally set on every request via the `ApiClient.request()` method. All frontend API calls use `apiClient.get/post/patch/delete/deleteWithBody`, which delegate to `request()`. The token is set after login (`context/AuthContext.tsx:240,315,358,413`) and cleared on logout (`context/AuthContext.tsx:388`).

---

## FE-03 — CSRF Integration

**Verdict**: **PASS**
**Severity**: CRITICAL
**Standard**: OWASP ASVS V8.2

**Evidence**:
- `lib/api.ts:6` -- `CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])`
- `lib/api.ts:38-43` -- CSRF token fetched and attached as `X-CSRF-Token` header for all mutating methods
- `lib/csrf.ts:6-35` -- Fetches CSRF token from `GET /auth/csrf-token` with dedup promise
- `lib/api.ts:59-84` -- On 403 with CSRF error message, clears cached token, re-fetches, and retries once (double-submit pattern with retry)
- `lib/api.ts:92-96` -- After 401 refresh, re-fetches CSRF token for the retry
- `context/AuthContext.tsx:185-189,381-385` -- Direct fetch calls for `refresh` and `logout` also include `X-CSRF-Token`
- `credentials: 'include'` on all requests ensures cookies are sent

---

## FE-04 — Token Refresh

**Verdict**: **PASS**
**Severity**: HIGH
**Standard**: OWASP ASVS V8.2

**Evidence**:
- `lib/api.ts:88-115` -- On 401 with existing access token, calls `silentRefresh()`
- `lib/api.ts:171-194` -- `silentRefresh()` POSTs to `/auth/refresh` with credentials
- `lib/api.ts:172` -- Concurrent refresh dedup: `if (this.refreshPromise) return this.refreshPromise`
- `lib/api.ts:189` -- `finally` block clears `refreshPromise` to allow future refreshes
- `lib/api.ts:182` -- On refresh failure returns null, which falls through to error handling
- `context/AuthContext.tsx:192-193` -- On refresh failure during session init, dispatches LOGOUT

---

## FE-05 — MFA Flow

**Verdict**: **PASS**
**Severity**: HIGH
**Standard**: SOC 2 CC6.1

**Evidence**:
- `context/AuthContext.tsx:232-238` -- Login detects `mfaRequired: true` response, dispatches `MFA_REQUIRED` action with `mfaToken`
- `components/auth/LoginForm.tsx:145-147` -- When `mfaRequired`, renders `<MfaTotpStep />`
- `components/auth/MfaTotpStep.tsx:234-363` -- TOTP 6-digit input with auto-submit on completion
- `components/auth/MfaTotpStep.tsx:107-231` -- Recovery code fallback view with text input
- `context/AuthContext.tsx:394-440` -- `verifyMfaLogin()` sends code/recoveryCode + mfaToken + trustDevice to `POST /auth/mfa/verify-login`

---

## FE-06 — MFA Setup

**Verdict**: **PASS**
**Severity**: HIGH
**Standard**: SOC 2 CC6.1

**Evidence**:
- `components/profile/MfaSetup.tsx:54-71` -- Setup: calls `POST /auth/mfa/setup`, receives QR code data URL + secret + recovery codes
- `components/profile/MfaSetup.tsx:215-302` -- QR code display + manual secret entry with copy button
- `components/profile/MfaSetup.tsx:73-92` -- Verify: calls `POST /auth/mfa/verify-setup` with TOTP code
- `components/profile/MfaSetup.tsx:94-115` -- Disable: calls `DELETE /auth/mfa` with password confirmation
- `components/profile/MfaSetup.tsx:117-137` -- Regenerate recovery codes: calls `POST /auth/mfa/recovery-codes` with password
- `components/profile/MfaSetup.tsx:157-212` -- Recovery codes display with copy-all button

---

## FE-07 — Passkey Registration

**Verdict**: **PASS**
**Severity**: MEDIUM
**Standard**: SOC 2 CC6.1

**Evidence**:
- `hooks/usePasskey.ts:4` -- Uses `@simplewebauthn/browser` (`startRegistration`)
- `hooks/usePasskey.ts:51-70` -- `registerPasskey()`: calls `POST /auth/passkeys/register/options`, passes result to `startRegistration()`, then calls `POST /auth/passkeys/register/verify`
- `components/profile/PasskeyManager.tsx:259-295` -- Registration UI with optional name input
- `lib/passkey-api.ts:11-19` -- API functions for register options + verify

---

## FE-08 — Passkey Login

**Verdict**: **PASS**
**Severity**: MEDIUM
**Standard**: SOC 2 CC6.1

**Evidence**:
- `components/auth/LoginForm.tsx:249-276` -- "Sign in with passkey" button rendered when `passkeySupported`
- `hooks/usePasskey.ts:72-91` -- `loginWithPasskey()`: calls `POST /auth/passkeys/login/options`, passes to `startAuthentication()`, then calls `passkeyLogin()` in AuthContext
- `context/AuthContext.tsx:353-377` -- `passkeyLogin()`: calls `passkeyLoginVerify()` which POSTs to `/auth/passkeys/login/verify`
- `hooks/usePasskey.ts:140-167` -- Conditional UI (autofill): `startConditionalUI()` with `useBrowserAutofill: true`
- `components/auth/LoginForm.tsx:66-73` -- Starts conditional UI on mount, aborts on unmount
- `components/auth/LoginForm.tsx:202` -- `autoComplete="username webauthn"` on email input

---

## FE-09 — Passkey Management

**Verdict**: **PASS**
**Severity**: MEDIUM
**Standard**: SOC 2 CC6.1

**Evidence**:
- `components/profile/PasskeyManager.tsx:206-257` -- Passkey list with device type icons, last used time, synced badge
- `components/profile/PasskeyManager.tsx:298-317` -- Rename modal with `ConfirmModal` + text input
- `components/profile/PasskeyManager.tsx:320-341` -- Delete modal with password confirmation
- `hooks/usePasskey.ts:93-106` -- `renamePasskey()` calls `PATCH /auth/passkeys/:id`
- `hooks/usePasskey.ts:108-122` -- `deletePasskey()` calls `DELETE /auth/passkeys/:id` with password

---

## FE-10 — Trusted Device Fingerprint

**Verdict**: **PASS**
**Severity**: HIGH
**Standard**: OWASP ASVS V8.2

**Evidence**:
- `lib/fingerprint.ts:3` -- Uses `@fingerprintjs/fingerprintjs`
- `lib/fingerprint.ts:8-27` -- `getFingerprint()`: loads FingerprintJS, gets visitor ID, caches result
- `context/AuthContext.tsx:212-213` -- On mount: `const fp = await getFingerprint(); if (fp) apiClient.setDeviceFingerprint(fp);`
- `lib/api.ts:35` -- `X-Device-Fingerprint` header attached to every request when fingerprint is set
- Fail-open design: `lib/fingerprint.ts:18-20` returns empty string on error, login still works

---

## FE-11 — Trust Device After MFA

**Verdict**: **PASS**
**Severity**: MEDIUM
**Standard**: SOC 2 CC6.1

**Evidence**:
- `components/auth/MfaTotpStep.tsx:20` -- `const [trustDevice, setTrustDevice] = useState(false)`
- `components/auth/MfaTotpStep.tsx:304-318` -- "Trust this device for 30 days" checkbox in TOTP view
- `components/auth/MfaTotpStep.tsx:172-186` -- Same checkbox in recovery code view
- `components/auth/MfaTotpStep.tsx:32` -- `await verifyMfaLogin(codeStr, isRecovery, trustDevice)`
- `context/AuthContext.tsx:406-408` -- `if (trustDevice) { body.trustDevice = true; }` sent to `POST /auth/mfa/verify-login`

---

## FE-12 — Trusted Device Management

**Verdict**: **PASS**
**Severity**: MEDIUM
**Standard**: SOC 2 CC6.1

**Evidence**:
- `components/profile/TrustedDevices.tsx:138-172` -- Device list with name, IP, last verified, expiry
- `components/profile/TrustedDevices.tsx:162-168` -- Individual revoke button per device
- `components/profile/TrustedDevices.tsx:110-119` -- "Revoke All" button in header
- `components/profile/TrustedDevices.tsx:175-186` -- "Trust This Device" button
- `lib/trusted-device-api.ts` -- All 4 endpoints covered: trust, list, revoke single, revoke all

---

## FE-13 — Session Management

**Verdict**: **PASS**
**Severity**: HIGH
**Standard**: SOC 2 CC6.1

**Evidence**:
- `components/profile/ActiveSessions.tsx:65` -- Fetches `GET /auth/sessions`
- `components/profile/ActiveSessions.tsx:148-206` -- Session list with device info, IP, last active time, "Current" badge
- `components/profile/ActiveSessions.tsx:78-92` -- Individual revoke: `DELETE /auth/sessions/:id`
- `components/profile/ActiveSessions.tsx:94-108` -- "Revoke all others": `POST /auth/logout-all`
- `components/profile/ActiveSessions.tsx:110` -- Filters to show other sessions for revoke-all button

---

## FE-14 — Account Lockout UX

**Verdict**: **PASS**
**Severity**: HIGH
**Standard**: OWASP ASVS V8.2

**Evidence**:
- `context/AuthContext.tsx:249-256` -- On login error with `retryAfter`, detects lockout via `detectRateLimitKind()` checking for `FORBIDDEN` error code
- `context/AuthContext.tsx:158-160` -- `detectRateLimitKind()`: returns `"lockout"` for `FORBIDDEN`, `"throttle"` otherwise
- `components/auth/LoginForm.tsx:129-137` -- Catches `RateLimitError`, calls `setRateLimit()` with countdown
- `components/auth/LoginForm.tsx:419-425` -- Renders `<RateLimitBanner>` with countdown timer
- `components/ui/RateLimitBanner.tsx:47` -- Different icon for lockout (`Lock`) vs throttle (`AlertTriangle`)
- `components/ui/CountdownTimer.tsx` -- Countdown display component

---

## FE-15 — Rate Limit UX

**Verdict**: **PASS**
**Severity**: MEDIUM
**Standard**: OWASP ASVS V8.2

**Evidence**:
- `lib/api.ts:152-157` -- `parseErrorResponse()` extracts `Retry-After` header on 429 responses and injects into error body
- `context/AuthContext.tsx:249-256` -- Login throws `RateLimitError` with `retryAfter` seconds
- `context/AuthContext.tsx:287-295` -- Register handles rate limit identically
- `context/AuthContext.tsx:457-465` -- Forgot password handles rate limit
- `context/AuthContext.tsx:421-429` -- MFA verify handles rate limit
- `components/auth/LoginForm.tsx:419-425` -- `RateLimitBanner` with countdown timer
- `components/auth/RegisterForm.tsx:135-140` -- Same pattern in register form
- `components/auth/ForgotPasswordForm.tsx:100-106` -- Same pattern in forgot password form
- `components/auth/MfaTotpStep.tsx:280-285` -- Same pattern in MFA TOTP step

---

## FE-16 — Change Email

**Verdict**: **PASS**
**Severity**: MEDIUM
**Standard**: SOC 2 CC6.1

**Evidence**:
- `components/profile/ChangeEmailForm.tsx:71-103` -- Form with new email + current password fields
- `lib/email-change-api.ts:4` -- Calls `POST /users/me/email` with `{ newEmail, password }`
- `app/verify-email-change/page.tsx:22` -- Callback page calls `POST /auth/verify-email-change` with token
- `components/profile/ChangeEmailForm.tsx:24` -- OAuth-only users see informational message instead of form

---

## FE-17 — Delete Account

**Verdict**: **PASS**
**Severity**: MEDIUM
**Standard**: SOC 2 CC6.1

**Evidence**:
- `components/profile/DeleteAccount.tsx:116-132` -- Danger zone card with "Delete Account" button
- `components/profile/DeleteAccount.tsx:135-212` -- Confirmation modal with "DELETE" text confirmation + password field (when user has password)
- `lib/delete-account-api.ts:4-9` -- Calls `DELETE /users/me` with optional password body
- `components/profile/DeleteAccount.tsx:38-58` -- After deletion, calls `logout()` and redirects to `/login`
- SUPERADMIN protection: error message handling for 403 status

---

## FE-18 — Unlink OAuth

**Verdict**: **PASS**
**Severity**: MEDIUM
**Standard**: SOC 2 CC6.1

**Evidence**:
- `components/profile/ConnectedAccounts.tsx:186-243` -- Lists Google/GitHub providers with connect/disconnect buttons
- `components/profile/ConnectedAccounts.tsx:189-191` -- Safety check: if last auth method (`!hasPassword && oauthProviders.length === 1`), shows "Set a password first" instead of disconnect
- `components/profile/ConnectedAccounts.tsx:246-305` -- Disconnect confirmation modal with password input
- `lib/oauth-api.ts:4-12` -- `unlinkOAuth()` calls `DELETE /users/me/oauth/:provider` with password body
- `components/profile/ConnectedAccounts.tsx:158-172` -- Connect flow: generates link code via `POST /auth/link/code`, then redirects to `GET /auth/link/:provider`

---

## FE-19 — Password Management

**Verdict**: **PASS**
**Severity**: HIGH
**Standard**: SOC 2 CC6.1

**Evidence**:
- `components/profile/ChangePasswordForm.tsx:81-143` -- Change password form with current + new + confirm fields
- `components/profile/ChangePasswordForm.tsx:42` -- Calls `PATCH /users/me/password`
- `components/profile/ChangePasswordForm.tsx:22` -- Handles "Set Password" mode for OAuth-only users (`!hasPassword`)
- `components/profile/ChangePasswordForm.tsx:102-110` -- Real-time password length indicator
- `components/auth/ForgotPasswordForm.tsx` -- Forgot password flow: calls `POST /auth/forgot-password`
- `context/AuthContext.tsx:479-510` -- `resetPassword()` calls `POST /auth/reset-password`
- `context/AuthContext.tsx:539-552` -- `validateResetToken()` calls `POST /auth/validate-reset-token`

---

## FE-20 — OAuth Flow

**Verdict**: **PASS**
**Severity**: HIGH
**Standard**: SOC 2 CC6.1

**Evidence**:
- `components/auth/OAuthButtons.tsx:10-11` -- Google button: `<a href="${API_BASE_URL}/auth/google">`
- `components/auth/OAuthButtons.tsx:22-23` -- GitHub button: `<a href="${API_BASE_URL}/auth/github">`
- `app/auth/callback/page.tsx` -- OAuth callback page exists
- `context/AuthContext.tsx:308-351` -- `handleOAuthCallback()`: calls `POST /auth/oauth/exchange` to exchange code for tokens
- `context/AuthContext.tsx:321-340` -- Shows toast for "created" vs "linked" OAuth actions
- `context/AuthContext.tsx:214-216` -- Skips session refresh on `/auth/callback` to avoid race condition

---

## FE-21 — Email Verification

**Verdict**: **PASS**
**Severity**: HIGH
**Standard**: SOC 2 CC6.1

**Evidence**:
- `components/auth/RegisterForm.tsx:74` -- After registration, redirects to `/activation/check-email`
- `app/activation/check-email/page.tsx` -- "Check Your Email" page with back to login link
- `app/verify-email/page.tsx` -- Verification callback page wraps `<VerifyEmailStatus />`
- `components/auth/VerifyEmailStatus.tsx:20` -- Calls `POST /auth/verify-email` with token from URL
- `components/auth/VerifyEmailStatus.tsx:36-65` -- Success/failure display with navigation
- `context/AuthContext.tsx:512-537` -- `resendVerification()` calls `POST /auth/resend-verification`
- `context/AuthContext.tsx:554-567` -- `resendVerificationPublic()` calls `POST /auth/resend-verification-public`

---

## FE-22 — Route Guards

**Verdict**: **PASS**
**Severity**: CRITICAL
**Standard**: SOC 2 CC6.1

**Evidence**:
- **Protected routes** (require auth):
  - `app/profile/page.tsx:19` -- `<ProtectedRoute>` wraps profile
  - `app/dashboard/page.tsx` -- Uses `<ProtectedRoute>` (via DashboardLayout pattern)
  - `components/guards/ProtectedRoute.tsx:12-16` -- Redirects to `/login` if not authenticated
  - `components/guards/ProtectedRoute.tsx:18-22` -- Redirects to `/activation/check-email` if email not verified
- **Admin routes** (require ADMIN/SUPERADMIN role):
  - `components/guards/AdminRoute.tsx:27-33` -- Wraps with `<ProtectedRoute>` + `<AdminCheck>`
  - `components/guards/AdminRoute.tsx:12` -- Checks `user.role === 'ADMIN' || user.role === 'SUPERADMIN'`
  - `components/guards/AdminRoute.tsx:16` -- Redirects non-admin to `/dashboard`
- **Guest routes** (redirect if authenticated):
  - `app/login/page.tsx:12` -- `<GuestRoute>` wraps login
  - `components/guards/GuestRoute.tsx:12-16` -- Redirects to `/dashboard` if authenticated
- **Permission-based routes**: `components/guards/PermissionRoute.tsx`, `components/guards/Can.tsx` exist for granular RBAC

---

## FE-23 — Security Headers

**Verdict**: **PASS**
**Severity**: HIGH
**Standard**: OWASP ASVS V8.2

**Evidence** (`middleware.ts`):
- Line 4: Generates cryptographic nonce via `crypto.getRandomValues()`
- Lines 12-13: `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'` (production mode; `'unsafe-eval'` only in dev)
- Line 21: `style-src 'self' 'nonce-${nonce}'`
- Line 26: `frame-ancestors 'none'` -- prevents clickjacking
- Line 27: `object-src 'none'`
- Line 28: `base-uri 'self'`
- Line 29: `form-action 'self'`
- Line 30: `upgrade-insecure-requests`
- Line 44: Sets `Content-Security-Policy` header on response
- Lines 14-16: `connect-src` restricted to self + API URL + Cloudflare challenges
- Line 25: `frame-src` restricted to Cloudflare challenges only

---

## FE-24 — Error Boundaries

**Verdict**: **WARN**
**Severity**: MEDIUM
**Standard**: ISO 25010 Reliability

**Evidence**:
- `app/error.tsx` -- Root-level error boundary: catches all unhandled errors, shows "Something went wrong" with retry + home navigation
- `app/global-error.tsx` -- Global error boundary: catches root layout errors, renders minimal HTML
- `app/profile/error.tsx` -- Profile-specific error boundary: catches profile page crashes

**Finding**: Auth-specific route error boundaries are missing. There is no `app/login/error.tsx`, `app/register/error.tsx`, `app/forgot-password/error.tsx`, or `app/reset-password/error.tsx`. The root `app/error.tsx` catches crashes in these routes, but it shows a generic full-page error without auth-specific context (e.g., "Go to login" link). The root boundary is adequate for production resilience but does not provide optimized auth-flow recovery.

**Mitigation**: The root `app/error.tsx` provides adequate catch-all protection, and `app/global-error.tsx` handles even root layout failures. This is a best-practice gap, not a functional deficiency.

---

## FE-25 — Form Validation Consistency

**Verdict**: **PASS**
**Severity**: MEDIUM
**Standard**: OWASP ASVS V8.2

**Evidence**:
- **Password validation**:
  - Backend: `register.dto.ts:23-24` -- `@MinLength(8)`, `@MaxLength(128)`
  - Backend: `reset-password.dto.ts:18-19` -- `@MinLength(8)`, `@MaxLength(128)`
  - Frontend: `lib/validation.ts:2-4` -- `PASSWORD_MIN_LENGTH = 8`, `PASSWORD_MAX_LENGTH = 128`
  - Frontend: `lib/validation.ts:1` -- Comment: "Must match backend DTOs"
  - Used in: `LoginForm.tsx:116`, `RegisterForm.tsx:55`, `ChangePasswordForm.tsx:28-29`
- **Email validation**:
  - Backend: `@IsEmail()` on login, register, forgot-password DTOs
  - Frontend: `LoginForm.tsx:24` -- `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`
  - Frontend: `RegisterForm.tsx:19` -- Same regex
  - Frontend: `ChangeEmailForm.tsx:13` -- Similar regex
- **Passkey name**: Backend `@MaxLength(64)` matches frontend `maxLength={64}` in `PasskeyManager.tsx:271`

---

## FE-26 — Accessibility on Auth Flows

**Verdict**: **PASS** (upgraded from WARN)
**Severity**: MEDIUM
**Standard**: WCAG 2.1 AA

**Evidence of compliance**:
- **Labels**: `components/ui/Input.tsx:45-50` -- All inputs get `<label htmlFor={inputId}>` when `label` prop provided. Login (`LoginForm.tsx:194-197`), Register (`RegisterForm.tsx:113-115,124-125`), MFA (`MfaTotpStep.tsx:124-128,251-252`) -- all use `<Input label="...">` or explicit `<label>`
- **`aria-live`**: Error messages use `role="alert" aria-live="polite"` in:
  - `LoginForm.tsx:211,428-430`
  - `RegisterForm.tsx:143-144`
  - `MfaTotpStep.tsx:153,288`
  - `ForgotPasswordForm.tsx:108-109`
  - `RateLimitBanner.tsx:50` -- `role="alert"`
- **`aria-invalid`**: `Input.tsx:68` -- `aria-invalid={!!error}`
- **`aria-describedby`**: `Input.tsx:69` -- Points to error element via `${inputId}-error`
- **Keyboard navigation**: Forms use standard `<form>` with `<button type="submit">`. Password show/hide toggle has `aria-label`. MFA digit inputs have `aria-label="Digit ${i+1}"` (`MfaTotpStep.tsx:279`). Passkey buttons have `aria-label` (`PasskeyManager.tsx:71,79`).
- **Focus management**: MFA step auto-focuses first input (`MfaTotpStep.tsx:23-27`). Modals in `DeleteAccount.tsx` and `ConnectedAccounts.tsx` have focus traps.

**Fix verified (since last audit)**:
1. **MFA TOTP label**: `MfaTotpStep.tsx:252` now has `htmlFor="totp-digit-0"`, linking the "Verification Code" label to the first digit input (`id="totp-digit-0"` at line 268). Screen readers now correctly associate the label with the input group.
2. **Session revoke button**: `ActiveSessions.tsx:193` now uses `aria-label="Revoke session"` instead of `title`, providing proper accessible name for the trash icon button.

**Previous finding resolved**: The standalone `<label>` without `htmlFor` that was flagged in the previous audit is now properly linked. Both a11y gaps identified in the 2026-03-16T22:30 audit are remediated.

---

## Endpoint Coverage Matrix -- Backend Features Not in Scope

The following backend endpoints are NOT auth-module features and were excluded from this audit:
- `GET /users` -- Admin user list (admin module)
- `GET /users/:id` -- Admin user detail (admin module)
- `PATCH /users/:id` -- Admin user edit (admin module)
- `DELETE /users/:id` -- Admin user delete (admin module)
- `PATCH /users/me` -- Profile update (users module, non-auth)

---

## Totals

| Verdict  | Count | Check IDs |
|----------|-------|-----------|
| **PASS** | 25    | FE-01 through FE-23, FE-25, FE-26 |
| **FAIL** | 0     | -- |
| **WARN** | 1     | FE-24 (error boundaries) |
| **N/A**  | 0     | -- |

**Overall**: The auth module frontend-backend integration is comprehensive. All 48 auth-related backend endpoints have corresponding frontend calls. Security patterns (CSRF double-submit, Bearer auth, token refresh with dedup, device fingerprinting, rate limit UX, route guards) are fully implemented. FE-26 (a11y) upgraded from WARN to PASS after `htmlFor` and `aria-label` fixes. The single remaining WARN (FE-24) is a best-practice gap, not a functional deficiency.

---

## Recurrence Analysis (vs 2026-03-16T22:30)

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
| FE-24 | WARN | WARN | Stable -- auth-specific error boundaries still missing |
| FE-25 | PASS | PASS | Stable |
| FE-26 | WARN | **PASS** | **IMPROVED** -- `htmlFor="totp-digit-0"` + `aria-label="Revoke session"` fixes verified |

**1 improvement: FE-26 upgraded from WARN to PASS. 0 regressions. 0 new findings.**
