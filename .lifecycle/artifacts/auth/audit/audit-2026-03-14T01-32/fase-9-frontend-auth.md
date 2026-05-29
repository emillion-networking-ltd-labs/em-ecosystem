# Phase 9: Frontend-Backend Integration Audit — Auth Module

**Date**: 2026-03-14
**Module**: `auth`
**Backend root**: `em-ecosystem-code/nexacore-api/src/auth/`
**Frontend root**: `em-ecosystem-code/nexacore-dashboard/src/`
**Previous audit**: `audit-2026-03-13T17-30/fase-9-frontend-backend-auth.md`
**Auditor**: Claude Sonnet 4.6

---

## Summary

| Severity | PASS | WARN | FAIL | Total |
|----------|------|------|------|-------|
| CRITICAL | 3    | 0    | 0    | 3     |
| HIGH     | 10   | 1    | 0    | 11    |
| MEDIUM   | 10   | 2    | 0    | 12    |
| **Total**| **23** | **3** | **0** | **26** |

**Overall verdict**: All 26 checks pass or have minor warnings. Zero FAIL findings. The frontend-backend integration for the auth module is comprehensive and well-implemented. One endpoint missed by the previous audit (`POST /auth/link/code`) has been confirmed as properly integrated. The two WARN findings from the previous audit (FE-23 `style-src unsafe-inline`, FE-26 MFA TOTP `role="alert"` gap) both persist unchanged.

---

## Recurrence Analysis vs Previous Audit (2026-03-13)

| Check | Previous | Current | Delta |
|-------|----------|---------|-------|
| FE-01 | PASS | PASS | No change |
| FE-02 | PASS | PASS | No change |
| FE-03 | PASS | PASS | No change |
| FE-04 | PASS | PASS | No change |
| FE-05 | PASS | PASS | No change |
| FE-06 | PASS | PASS | No change |
| FE-07 | PASS | PASS | No change |
| FE-08 | PASS | PASS | No change |
| FE-09 | PASS | PASS | No change |
| FE-10 | PASS | PASS | No change |
| FE-11 | PASS | PASS | No change |
| FE-12 | PASS | PASS | No change |
| FE-13 | PASS | PASS | No change |
| FE-14 | PASS | PASS | No change |
| FE-15 | PASS | PASS | No change |
| FE-16 | PASS | PASS | No change |
| FE-17 | PASS | PASS | No change |
| FE-18 | PASS | PASS | No change |
| FE-19 | PASS | PASS | No change |
| FE-20 | PASS | PASS | No change |
| FE-21 | PASS | PASS | No change |
| FE-22 | PASS | PASS | No change |
| FE-23 | WARN | WARN | Persists — `style-src 'unsafe-inline'` is an accepted trade-off for Tailwind |
| FE-24 | PASS | PASS | No change |
| FE-25 | WARN | WARN | Persists — intentional design (login does not validate password format) |
| FE-26 | WARN | WARN | Persists — MFA TOTP error container missing `role="alert"` (SCRUM-231 open) |

**New discovery**: `POST /auth/link/code` endpoint found in `oauth.controller.ts:179` was not listed in the previous audit's endpoint inventory (previous audit had 41 endpoints). This is endpoint #42. Frontend coverage confirmed via `generateLinkCode()` in `lib/oauth-api.ts` and `ConnectedAccounts.tsx`. Endpoint coverage remains 100%.

**SCRUM-231 status**: The Jira ticket to fix MFA form a11y gaps was created as part of Sprint 10 (LOW, WARN). The fix has NOT been applied yet — `MfaTotpStep.tsx` line 274 still lacks `role="alert"`. This is expected (ticket still open).

---

## Backend Endpoint Inventory

### AuthController (`/auth`)
| Method | Route | Guard | Frontend Call |
|--------|-------|-------|--------------|
| GET | `/auth/csrf-token` | None (SkipCsrf) | `lib/csrf.ts` — `getCsrfToken()` |
| POST | `/auth/register` | TurnstileGuard | `AuthContext.register()` |
| POST | `/auth/login` | TurnstileGuard | `AuthContext.login()` |
| POST | `/auth/refresh` | None | `AuthContext.refreshSession()`, `api.ts silentRefresh()` |
| POST | `/auth/logout` | None | `AuthContext.logout()` |
| POST | `/auth/logout-all` | JwtAuthGuard | `ActiveSessions.revokeAllOtherSessions()` |
| GET | `/auth/me` | JwtAuthGuard | `AuthContext` (after login/refresh) |
| GET | `/auth/admin` | JwtAuthGuard + RolesGuard | Not directly called — `AdminRoute` checks client-side role |

### AccountController (`/auth`)
| Method | Route | Guard | Frontend Call |
|--------|-------|-------|--------------|
| POST | `/auth/verify-email` | None (SkipCsrf) | `VerifyEmailStatus` component |
| POST | `/auth/verify-email-change` | None (SkipCsrf) | `verify-email-change/page.tsx` |
| POST | `/auth/resend-verification` | JwtAuthGuard | `AuthContext.resendVerification()` |
| POST | `/auth/resend-verification-public` | TurnstileGuard (SkipCsrf) | `AuthContext.resendVerificationPublic()` |
| POST | `/auth/forgot-password` | TurnstileGuard (SkipCsrf) | `AuthContext.forgotPassword()` |
| POST | `/auth/reset-password` | None (SkipCsrf) | `AuthContext.resetPassword()` |
| POST | `/auth/validate-reset-token` | None (SkipCsrf) | `AuthContext.validateResetToken()` |

### MfaController (`/auth/mfa`)
| Method | Route | Guard | Frontend Call |
|--------|-------|-------|--------------|
| POST | `/auth/mfa/setup` | JwtAuthGuard | `MfaSetup.handleSetup()` |
| POST | `/auth/mfa/verify-setup` | JwtAuthGuard | `MfaSetup.handleVerifySetup()` |
| POST | `/auth/mfa/verify-login` | None | `AuthContext.verifyMfaLogin()` |
| DELETE | `/auth/mfa` | JwtAuthGuard | `MfaSetup.handleDisable()` |
| POST | `/auth/mfa/recovery-codes` | JwtAuthGuard | `MfaSetup.handleRegenerate()` |
| GET | `/auth/mfa/status` | JwtAuthGuard | `MfaSetup.fetchStatus()` |

### OAuthController (`/auth`)
| Method | Route | Guard | Frontend Call |
|--------|-------|-------|--------------|
| GET | `/auth/google` | GoogleAuthGuard | `OAuthButtons` (anchor href) |
| GET | `/auth/google/callback` | GoogleAuthGuard | Backend redirect to `/auth/callback` |
| GET | `/auth/github` | GitHubAuthGuard | `OAuthButtons` (anchor href) |
| GET | `/auth/github/callback` | GitHubAuthGuard | Backend redirect to `/auth/callback` |
| POST | `/auth/oauth/exchange` | None | `AuthContext.handleOAuthCallback()` |
| POST | `/auth/link/code` | JwtAuthGuard | `generateLinkCode()` in `lib/oauth-api.ts` *(new — missed by previous audit)* |
| GET | `/auth/link/google` | OAuthLinkGuard + GoogleAuthGuard | `ConnectedAccounts.handleConnect()` (after `generateLinkCode()`) |
| GET | `/auth/link/github` | OAuthLinkGuard + GitHubAuthGuard | `ConnectedAccounts.handleConnect()` (after `generateLinkCode()`) |

### PasskeyController (`/auth/passkeys`)
| Method | Route | Guard | Frontend Call |
|--------|-------|-------|--------------|
| POST | `/auth/passkeys/register/options` | JwtAuthGuard | `usePasskey.registerPasskey()` via `passkey-api.ts` |
| POST | `/auth/passkeys/register/verify` | JwtAuthGuard | `usePasskey.registerPasskey()` via `passkey-api.ts` |
| POST | `/auth/passkeys/login/options` | None | `usePasskey.loginWithPasskey()` via `passkey-api.ts` |
| POST | `/auth/passkeys/login/verify` | None | `AuthContext.passkeyLogin()` via `passkey-api.ts` |
| GET | `/auth/passkeys` | JwtAuthGuard | `usePasskey.fetchPasskeys()` via `passkey-api.ts` |
| PATCH | `/auth/passkeys/:id` | JwtAuthGuard | `usePasskey.renamePasskey()` via `passkey-api.ts` |
| DELETE | `/auth/passkeys/:id` | JwtAuthGuard | `usePasskey.deletePasskey()` via `passkey-api.ts` |

### SessionController (`/auth`)
| Method | Route | Guard | Frontend Call |
|--------|-------|-------|--------------|
| GET | `/auth/sessions` | JwtAuthGuard | `ActiveSessions.fetchSessions()` |
| DELETE | `/auth/sessions/:id` | JwtAuthGuard | `ActiveSessions.revokeSession()` |
| POST | `/auth/trusted-devices` | JwtAuthGuard | `TrustedDevices.handleTrust()` via `useTrustedDevices` |
| GET | `/auth/trusted-devices` | JwtAuthGuard | `TrustedDevices.fetchDevices()` via `useTrustedDevices` |
| DELETE | `/auth/trusted-devices` | JwtAuthGuard | `TrustedDevices.handleRevokeAll()` via `useTrustedDevices` |
| DELETE | `/auth/trusted-devices/:id` | JwtAuthGuard | `TrustedDevices.handleRevoke()` via `useTrustedDevices` |

**Total backend endpoints**: 42 (previous audit documented 41; `POST /auth/link/code` was overlooked)

---

## Detailed Check Results

### FE-01 | Endpoint Coverage | HIGH | PASS

**Verification**: Compared all 42 backend auth controller endpoints against frontend API calls.

**Result**: All 42 endpoints have corresponding frontend integrations. The previous audit's inventory of 41 was missing `POST /auth/link/code` — confirmed now integrated in `lib/oauth-api.ts:generateLinkCode()`. The only endpoint without a direct frontend `fetch()` call is `GET /auth/admin`, which is a role-verification endpoint — the frontend correctly uses client-side role checking via `AdminRoute`.

**Evidence**:
- `lib/api.ts` — central `ApiClient` class handles all auth-related calls
- `context/AuthContext.tsx` — login, register, refresh, logout, MFA verify, OAuth exchange, forgot/reset password, verify email
- `lib/oauth-api.ts:generateLinkCode()` → `POST /auth/link/code`
- `components/profile/` — MfaSetup, PasskeyManager, ActiveSessions, TrustedDevices, ConnectedAccounts, ChangePasswordForm, ChangeEmailForm, DeleteAccount
- `hooks/usePasskey.ts`, `hooks/useTrustedDevices.ts` — dedicated hooks for complex flows

**Standard**: OWASP ASVS 1.2.1

---

### FE-02 | Auth Headers — Bearer Token | CRITICAL | PASS

**Verification**: Read `lib/api.ts` lines 32-36.

**Result**: Authorization Bearer header is correctly applied on all protected endpoint calls through the centralized `ApiClient`.

**Evidence** (`lib/api.ts:34`):
```typescript
...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
```

The `accessToken` is set after login/refresh via `apiClient.setAccessToken()` and cleared on logout via `apiClient.clearAccessToken()`. All API calls route through `apiClient.request()`, ensuring consistent header application. No auth header is attached when `accessToken` is null (unauthenticated routes).

**Standard**: RFC 6750 (Bearer Token), OWASP ASVS 3.5.3

---

### FE-03 | CSRF Integration | CRITICAL | PASS

**Verification**: Read `lib/csrf.ts` and `lib/api.ts` CSRF handling (lines 38-85).

**Result**: CSRF token is fetched from `GET /auth/csrf-token`, cached with deduplication, and attached as `X-CSRF-Token` header on all state-changing requests (POST, PUT, PATCH, DELETE). Includes automatic retry on 403 CSRF errors (clear cached token → re-fetch → retry once).

**Evidence** (`lib/api.ts:38-43`):
```typescript
if (CSRF_METHODS.has(method)) {
  const csrfToken = await getCsrfToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
}
```

CSRF retry logic at lines 59-85 handles token expiration gracefully. Concurrent deduplication in `csrf.ts:9` (`if (tokenFetchPromise) return tokenFetchPromise`) prevents thundering-herd on simultaneous page loads.

**Standard**: OWASP ASVS 4.2.2, CWE-352

---

### FE-04 | Token Refresh — 401 Silent Refresh | HIGH | PASS

**Verification**: Read `lib/api.ts` `silentRefresh()` (lines 171-194) and `context/AuthContext.tsx` `refreshSession()` (lines 182-202).

**Result**: Full implementation of silent token refresh with concurrent deduplication and logout on persistent failure.

**Findings**:
1. **401 triggers refresh** (`api.ts:88-115`): On 401 with existing access token, calls `silentRefresh()` then retries the original request with the new token. Re-fetches CSRF token for the retry if method is state-changing.
2. **Concurrent deduplication** (`api.ts:172`): `if (this.refreshPromise) return this.refreshPromise;` ensures only one refresh fires at a time for concurrent requests.
3. **Logout on failure** (`AuthContext.tsx:191-193`): `refreshSession()` dispatches `LOGOUT` if the refresh response is not OK.
4. **Startup refresh** (`AuthContext.tsx:211-220`): Silent refresh is attempted on mount to restore session from httpOnly cookie. A `mountedRef` guard prevents React StrictMode double-fire.
5. **OAuth callback skip** (`AuthContext.tsx:214-217`): Refresh is skipped on `/auth/callback` path to prevent race condition between refresh's `LOGOUT` and the OAuth exchange `AUTH_SUCCESS`.

**Standard**: OWASP ASVS 3.3.1, RFC 6749

---

### FE-05 | MFA Flow — mfaRequired Handling | HIGH | PASS

**Verification**: Read `LoginForm.tsx`, `MfaTotpStep.tsx`, `AuthContext.tsx`.

**Result**: Complete MFA login flow implemented.

**Findings**:
1. **mfaRequired detection** (`AuthContext.tsx:232-238`): `isMfaResponse()` type guard checks `data.mfaRequired === true`, dispatches `MFA_REQUIRED` with `mfaToken`.
2. **TOTP input** (`MfaTotpStep.tsx:248-264`): 6-digit individual-box input with `aria-label="Digit N"`, auto-advance on fill, auto-submit on full completion, paste support (strips non-digits, handles partial paste).
3. **Recovery code fallback** (`MfaTotpStep.tsx:107-223`): Toggle to recovery code text input with monospace field and `xxxx-xxxx-xxxx` placeholder.
4. **Trust device checkbox** (both views): `trustDevice` boolean sent in verify-login request body.
5. **Rate limit handling** (`MfaTotpStep.tsx:33-38`): Catches `RateLimitError`, shows `RateLimitBanner` with countdown.
6. **Cancel MFA** (`MfaTotpStep.tsx`): Cancel button dispatches `LOGOUT` via `cancelMfa()`.

**Standard**: OWASP ASVS 2.8.1, NIST 800-63B

---

### FE-06 | MFA Setup — Enable/Disable/Recovery Codes | HIGH | PASS

**Verification**: Read `components/profile/MfaSetup.tsx`.

**Result**: Complete MFA management lifecycle implemented across four views (`status`, `setup`, `verify`, `recovery-codes`, `disable`, `regenerate`).

**Findings**:
1. **Enable/QR setup**: `POST /auth/mfa/setup` → displays QR code from `qrCodeDataUrl`, manual secret with copy button, 6-digit verification field with `autoComplete="one-time-code"`.
2. **Verify setup**: `POST /auth/mfa/verify-setup` → transitions to `recovery-codes` view on success.
3. **Recovery codes display**: Grid layout, `select-all` CSS on each code for easy selection, "Copy all" button.
4. **Disable**: `DELETE /auth/mfa` with password body — danger variant button, password confirmation required.
5. **Regenerate codes**: `POST /auth/mfa/recovery-codes` with password — warning banner about invalidating existing codes.
6. **Status view**: Shows `ShieldCheck`/`Shield` icon, MFA enabled state, remaining recovery codes count from `GET /auth/mfa/status`.

Note: The `DELETE /auth/mfa` call at line 81 bypasses `apiClient.delete()` by calling `apiClient.delete()` with a manual body option — this works because `apiClient.delete()` proxies to `request()` which accepts `options`, but the `Content-Type` header is passed manually. This is a minor inconsistency vs `apiClient.deleteWithBody()` used elsewhere but functionally correct since CSRF is still applied via the `request()` method.

**Standard**: OWASP ASVS 2.8.4, NIST 800-63B

---

### FE-07 | Passkey Registration | MEDIUM | PASS

**Verification**: Read `components/profile/PasskeyManager.tsx`, `hooks/usePasskey.ts`.

**Result**: Full WebAuthn registration flow implemented using `@simplewebauthn/browser`.

**Findings**:
1. Registration flow: `POST /auth/passkeys/register/options` → `startRegistration()` → `POST /auth/passkeys/register/verify`.
2. Optional passkey name input before biometric prompt.
3. Max 10 passkeys limit enforced at UI level with user-facing message.
4. Browser support detection with `window.PublicKeyCredential` guard before rendering registration UI.

**Standard**: WebAuthn Level 3, FIDO2

---

### FE-08 | Passkey Login | MEDIUM | PASS

**Verification**: Read `components/auth/LoginForm.tsx` (lines 64-72, 102-111), `hooks/usePasskey.ts`.

**Result**: Passkey login fully integrated with two distinct methods.

**Findings**:
1. **Explicit button** (`LoginForm.tsx:247-274`): "Sign in with passkey" button with `Key` icon and `aria-label="Sign in with passkey"`. Shown when `passkeySupported` is true. Passes optional email hint.
2. **Conditional UI / Autofill** (`LoginForm.tsx:65-72`): `startConditionalUI()` called on mount when `isConditionalAvailable`. Uses `useBrowserAutofill: true` in `startRegistration()` options.
3. **Autofill hint**: Email `<input>` has `autoComplete="username webauthn"` enabling browser passkey suggestions in the credential picker.
4. **Abort on transition**: `abortConditionalUI()` called when moving from email step to password step to prevent interference.

**Standard**: WebAuthn Level 3, FIDO2 Passkeys

---

### FE-09 | Passkey Management — List/Rename/Delete | MEDIUM | PASS

**Verification**: Read `components/profile/PasskeyManager.tsx`.

**Result**: Full passkey CRUD implemented.

**Findings**:
1. **List**: `GET /auth/passkeys` — displays name, device type icon, "Synced" badge for cross-device passkeys, last-used timestamp.
2. **Rename**: `PATCH /auth/passkeys/:id` — modal dialog with name input.
3. **Delete**: `DELETE /auth/passkeys/:id` — modal with password confirmation, danger variant button.
4. Each passkey row has `Pencil` (rename) and `Trash2` (delete) icon buttons.

**Standard**: FIDO2, OWASP ASVS 2.5.4

---

### FE-10 | Trusted Device Fingerprint — X-Device-Fingerprint Header | HIGH | PASS

**Verification**: Read `lib/fingerprint.ts`, `lib/api.ts:35`, `context/AuthContext.tsx:212-213`.

**Result**: Device fingerprint is generated on mount and attached to all API requests.

**Evidence**:
1. `fingerprint.ts`: Uses `@fingerprintjs/fingerprintjs` to generate `visitorId`. Cached in module-level variable with a singleton promise to prevent concurrent loads. Fail-open: returns empty string on error so login still functions.
2. `api.ts:35`: `...(this.deviceFingerprint && { 'X-Device-Fingerprint': this.deviceFingerprint })` — attached to every request where fingerprint is available.
3. `AuthContext.tsx:212-213`: `getFingerprint()` resolved on mount before `refreshSession()`, then `apiClient.setDeviceFingerprint(fp)` called.
4. Backend reads it: `auth.controller.ts` reads `req.headers?.[DEVICE_FINGERPRINT_HEADER]` on login.

**Standard**: OWASP ASVS 3.3.4

---

### FE-11 | Trust Device After MFA | MEDIUM | PASS

**Verification**: Read `MfaTotpStep.tsx`, `AuthContext.tsx:399-444`.

**Result**: "Trust this device for 30 days" checkbox is present in both TOTP and recovery code views, and the value is correctly passed to the backend.

**Evidence**:
- `MfaTotpStep.tsx:288-299` (TOTP view): checkbox sets `trustDevice` state.
- `MfaTotpStep.tsx:167-178` (recovery code view): same `trustDevice` state is shared.
- `AuthContext.tsx:411-413`: `if (trustDevice) { body.trustDevice = true; }` — sent in `POST /auth/mfa/verify-login` body.
- Backend `mfa.controller.ts:115-122` reads `dto.trustDevice` and calls `trustedDeviceService.trustDevice()`.

**Standard**: OWASP ASVS 3.3.4, NIST 800-63B

---

### FE-12 | Trusted Device Management | MEDIUM | PASS

**Verification**: Read `components/profile/TrustedDevices.tsx`, `hooks/useTrustedDevices.ts`.

**Result**: Complete trusted device management interface.

**Findings**:
1. **List**: `GET /auth/trusted-devices` — shows device name, IP address, last verified timestamp, expiration date.
2. **Revoke single**: `DELETE /auth/trusted-devices/:id` — Trash icon per device with `ConfirmModal` confirmation.
3. **Revoke all**: `DELETE /auth/trusted-devices` — "Revoke All" button with `ConfirmModal`.
4. **Trust current device**: `POST /auth/trusted-devices` — accessible from profile page.

**Standard**: OWASP ASVS 3.3.4

---

### FE-13 | Session Management — List/Revoke | HIGH | PASS

**Verification**: Read `components/profile/ActiveSessions.tsx`.

**Result**: Complete session management interface.

**Findings**:
1. **Session list**: `GET /auth/sessions` — shows browser/OS user-agent, IP address, last active timestamp.
2. **Current session badge**: "Current" badge visually distinguishes the active session row.
3. **Revoke single**: `DELETE /auth/sessions/:id` — Trash icon per non-current session.
4. **Revoke all others**: `POST /auth/logout-all` — "Revoke all others" button.

**Standard**: OWASP ASVS 3.3.1

---

### FE-14 | Account Lockout UX | HIGH | PASS

**Verification**: Read `LoginForm.tsx`, `RateLimitBanner.tsx`, `lib/error-constants.ts`, `context/AuthContext.tsx`.

**Result**: Lockout detection, countdown timer, and differentiated lockout-vs-throttle UX implemented.

**Findings**:
1. `AuthContext.tsx:249-257`: Detects `retryAfter` in error response, throws typed `RateLimitError(retryAfter, message, kind)`.
2. `LoginForm.tsx:127-135`: Catches `RateLimitError`, calls `setRateLimit(err.retryAfter, err.message, 'throttle')`.
3. `RateLimitBanner.tsx`: Shows `Lock` icon for lockout kind, `AlertTriangle` for throttle. Includes `CountdownTimer` with auto-clear on expiry.
4. `AuthContext.tsx:158-160`: `detectRateLimitKind()` distinguishes lockout (`FORBIDDEN` error code) from throttle (other codes).
5. Form inputs and submit button are disabled during rate limit period.

**Standard**: OWASP ASVS 2.2.1, CWE-307

---

### FE-15 | Rate Limit UX — 429 Handling | MEDIUM | PASS

**Verification**: Read `lib/api.ts:148-168`, `hooks/useRateLimit.ts`, `components/ui/RateLimitBanner.tsx`.

**Result**: 429 detection and `Retry-After` header parsing implemented at the API client layer.

**Evidence** (`api.ts:152-157`):
```typescript
if (body?.error && (response.status === 429 || response.status === 401)) {
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter && !body.error.retryAfter) {
    body.error.retryAfter = parseInt(retryAfter, 10);
  }
}
```

Rate limit handling confirmed in: login, register, MFA verify-login, forgot-password, reset-password, and resend-verification flows.

**Standard**: RFC 6585, OWASP ASVS 2.2.1

---

### FE-16 | Change Email Flow | MEDIUM | PASS

**Verification**: Read `components/profile/ChangeEmailForm.tsx`, `lib/email-change-api.ts`, `app/verify-email-change/page.tsx`.

**Result**: Email change flow implemented with password confirmation and OAuth-user guard.

**Findings**:
1. New email input with client-side validation (format check, not same as current email).
2. Password confirmation required for all email changes.
3. OAuth-only users (no password set): UI shows info message directing to "Set Password" first.
4. Calls `requestEmailChange()` from `lib/email-change-api.ts` → backend sends verification email.
5. Backend verify endpoint: `POST /auth/verify-email-change` has a dedicated page at `app/verify-email-change/page.tsx`.

**Standard**: OWASP ASVS 2.5.1

---

### FE-17 | Delete Account | MEDIUM | PASS

**Verification**: Read `components/profile/DeleteAccount.tsx`, `lib/delete-account-api.ts`.

**Result**: Account deletion with comprehensive safety UX.

**Findings**:
1. "Danger Zone" card with red-bordered "Delete Account" button.
2. Confirmation modal with two-factor confirmation: type "DELETE" text AND enter current password.
3. Focus trap: keyboard Tab cycles within modal, Escape closes modal.
4. SUPERADMIN protection: backend returns 403 if SUPERADMIN tries to delete own account; frontend shows specific error message.
5. Calls `deleteAccount()` from `lib/delete-account-api.ts`, then `logout()` on success.

**Standard**: OWASP ASVS 2.5.4, GDPR Art. 17

---

### FE-18 | Unlink OAuth | MEDIUM | PASS

**Verification**: Read `components/profile/ConnectedAccounts.tsx`, `lib/oauth-api.ts`.

**Result**: OAuth disconnect per provider with password confirmation and last-method protection.

**Findings**:
1. Shows Google and GitHub providers with connected/disconnected state per `user.oauthProviders`.
2. "Disconnect" button opens modal with password confirmation field.
3. "Connect" button: calls `generateLinkCode()` (`POST /auth/link/code`) to get a short-lived code, then redirects to `/auth/link/{provider}?code={code}`. This code-based approach (added since SCRUM-218) avoids passing JWT in query string directly.
4. Last auth method protection: if `!user.hasPassword && user.oauthProviders.length === 1`, shows "Set a password first" text instead of "Disconnect" button.
5. Calls `unlinkOAuth(provider, password)` → `DELETE /users/me/oauth/{provider}`.
6. GitHub tooltip: informs user that their active GitHub session will be used for linking.

**Standard**: OWASP ASVS 2.5.4, SCRUM-218 (V8.3.1 fix — JWT removed from OAuth link query param)

---

### FE-19 | Password Management | HIGH | PASS

**Verification**: Read `components/profile/ChangePasswordForm.tsx`, `components/auth/ForgotPasswordForm.tsx`, `components/auth/ResetPasswordForm.tsx`.

**Result**: Complete password lifecycle covered.

**Findings**:
1. **Change password**: Current password + new password + confirm, calls `PATCH /users/me/password`. Forces logout after change to invalidate existing sessions.
2. **Set password** (OAuth-only users): Same `ChangePasswordForm` component — `hasPassword: false` hides the "current password" field, shows "Set Password" header.
3. **Forgot password**: Email + Turnstile CAPTCHA, calls `POST /auth/forgot-password`. Always shows success message to prevent user enumeration (consistent with backend).
4. **Reset password**: `POST /auth/validate-reset-token` on mount (validates token before showing form). New password + confirm with `validatePassword()` check, calls `POST /auth/reset-password`.

**Standard**: OWASP ASVS 2.1.1, NIST 800-63B

---

### FE-20 | OAuth Flow — Google/GitHub | HIGH | PASS

**Verification**: Read `components/auth/OAuthButtons.tsx`, `components/auth/OAuthCallbackHandler.tsx`, `app/auth/callback/page.tsx`, `context/AuthContext.tsx`.

**Result**: Complete OAuth login/register flow.

**Findings**:
1. **Login buttons** (`OAuthButtons.tsx`): Google and GitHub `<a>` tags redirect to backend OAuth initiation (`GET /auth/google`, `GET /auth/github`).
2. **Callback handler** (`app/auth/callback/page.tsx` + `OAuthCallbackHandler.tsx`): Reads `code` from URL params, calls `AuthContext.handleOAuthCallback(code)` → `POST /auth/oauth/exchange`.
3. **OAuth actions**: `oauthAction === "created"` shows "Account created" success toast; `oauthAction === "linked"` shows "Account linked to {Provider}" toast.
4. **OAuth error**: Login page reads `oauth_error` query param from URL and shows error toast (prevents showing raw backend error in URL permanently).
5. **Race condition prevention**: OAuth callback page sets `AUTH_STOP` on mount, skipping the startup `refreshSession()` that would interfere with the exchange.

**Standard**: OAuth 2.0 RFC 6749, OWASP ASVS 2.5.6

---

### FE-21 | Email Verification | HIGH | PASS

**Verification**: Read `components/auth/VerifyEmailStatus.tsx`, `app/verify-email/page.tsx`, `app/activation/check-email/page.tsx`, `AuthContext.tsx`.

**Result**: Email verification callback and re-verification flows fully implemented.

**Findings**:
1. `app/verify-email/page.tsx` renders `VerifyEmailStatus` component.
2. `VerifyEmailStatus.tsx`: Reads `token` from URL params, calls `POST /auth/verify-email`, displays success/failure UI with appropriate icons and links.
3. Post-registration redirect to `/activation/check-email` (check-email page).
4. `ProtectedRoute` checks `user.emailVerified === false` → redirects to `/activation/check-email`. This prevents access to protected routes until email is verified.
5. Resend verification (authenticated from check-email page): `POST /auth/resend-verification`.
6. Resend verification (public fallback, e.g., login error): `POST /auth/resend-verification-public` with Turnstile CAPTCHA.

**Standard**: OWASP ASVS 2.5.3

---

### FE-22 | Route Guards — Protected/Admin/Guest | CRITICAL | PASS

**Verification**: Read `components/guards/ProtectedRoute.tsx`, `components/guards/AdminRoute.tsx`, `components/guards/GuestRoute.tsx`, `components/guards/PermissionRoute.tsx`, `components/guards/Can.tsx`.

**Result**: Comprehensive route guard system covering all access control scenarios.

**Findings**:
1. **ProtectedRoute**: Waits for `isInitialized` (session check complete). If not authenticated → `router.replace('/login')`. If authenticated but `emailVerified === false` → `router.replace('/activation/check-email')`. Shows `RingSpinner` during initialization; renders `null` during redirect to prevent content flash.
2. **AdminRoute**: Wraps `ProtectedRoute`, inner `AdminCheck` component verifies `user.role === 'ADMIN' || 'SUPERADMIN'`. Non-admin authenticated users → `router.replace('/dashboard')`.
3. **GuestRoute**: If authenticated → `router.replace('/dashboard')`. Used on login, register, forgot-password pages. Shows `RingSpinner` during initialization.
4. **PermissionRoute**: Permission-key-based route guard from `PermissionsContext` (fine-grained access control for sub-features).
5. **Can**: Component-level permission check (inline conditional render based on permission key).

**Standard**: OWASP ASVS 4.1.1, 4.1.2, 4.1.3

---

### FE-23 | Security Headers — CSP / Nonce | HIGH | WARN

**Verification**: Read `middleware.ts`.

**Result**: CSP with nonce generation is implemented with strong defaults. One known weakness (`style-src 'unsafe-inline'`) is an accepted trade-off.

**Findings** (positive):
1. **CSP implemented**: `Content-Security-Policy` header set on all responses via Next.js middleware.
2. **Nonce generation** (`middleware.ts:50-53`): Cryptographic nonce via `crypto.getRandomValues(new Uint8Array(16))`, base64-encoded.
3. **`strict-dynamic`**: Used in `script-src` for defense-in-depth (allows nonce-tagged scripts to load further scripts).
4. **`frame-ancestors 'none'`**: Clickjacking protection.
5. **`object-src 'none'`**, **`base-uri 'self'`**, **`form-action 'self'`**: Tight default-deny.
6. **`upgrade-insecure-requests`**: Forces HTTPS.
7. **Dev/Prod differentiation**: Dev mode adds `'unsafe-eval'` (required for webpack HMR) and `ws://localhost:3001`; production uses stricter policy.

**Warning**: `style-src 'unsafe-inline'` is present. This is required by Tailwind CSS utility classes and Next.js internal style injection. Removing it would require full CSS-in-JS with nonce injection or a hash-based CSP, which conflicts with Tailwind's JIT compilation model. This is a known and documented trade-off in the frontend standards.

**Standard**: OWASP ASVS 14.4.3, SOC 2 CC6.1

---

### FE-24 | Error Boundaries | MEDIUM | PASS

**Verification**: Read `app/error.tsx`, `app/global-error.tsx`.

**Result**: Error boundaries present at page and global levels.

**Findings**:
1. **Page-level** (`error.tsx`): Next.js `error.tsx` boundary. Shows `error.message` in development, generic "An unexpected error occurred" in production. Displays `error.digest` reference code for support tracing. Provides "Try again" (reset) and "Go back home" buttons.
2. **Global-level** (`global-error.tsx`): Standalone HTML/CSS (no theme/context dependencies, as it catches framework-level errors that may prevent providers from rendering). "Try again" and "Go to login" buttons.
3. Both levels log errors via `console.error()`.

**Note from SCRUM-201**: Auth routes now also have `error.tsx` boundaries at the route-segment level (added in Sprint 8). This provides granular error containment within auth flows.

**Standard**: OWASP ASVS 7.4.1, SOC 2 A1.2

---

### FE-25 | Form Validation Consistency with Backend DTOs | MEDIUM | WARN

**Verification**: Read `lib/validation.ts`, compared with backend DTOs.

**Result**: Validation is mostly consistent. One minor intentional gap exists.

**Findings**:
1. **Password min/max length** (`validation.ts:2-4`): `PASSWORD_MIN_LENGTH = 8`, `PASSWORD_MAX_LENGTH = 128`. Comments explicitly reference backend DTOs: `@MinLength(8)` / `@MaxLength(128)` in `register.dto.ts` and `reset-password.dto.ts`. Correct alignment.
2. **Email regex**: Frontend uses `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` (same pattern in both `LoginForm.tsx:23` and `RegisterForm.tsx:20`). Backend uses `class-validator` `@IsEmail()` (RFC 5322). The frontend regex is slightly less strict but functionally equivalent for common email formats.
3. **`validatePassword()` called in**: `RegisterForm.tsx:55`, `ResetPasswordForm.tsx` — correct for forms where password format matters.

**Warning**: `LoginForm.tsx` password step does NOT call `validatePassword()` before submission (only checks `!formData.password` for emptiness). This is intentional: the login form should not reveal password constraints to unauthenticated users to avoid aiding password guessing. The backend validates anyway and returns generic error messages. Minor inconsistency, security-positive design decision.

**Standard**: OWASP ASVS 2.1.1, CWE-203

---

### FE-26 | Accessibility on Auth Flows — Labels, aria-live, Keyboard Nav | MEDIUM | WARN

**Verification**: Read auth form components, `components/ui/Input.tsx`, `MfaTotpStep.tsx`.

**Result**: Strong accessibility foundation with two specific gaps that persist from the previous audit (SCRUM-231 open).

**Findings** (positive):
1. **Labels**: `Input` component (`Input.tsx:42-45`) uses `<label htmlFor={inputId}>` linked to `<input id={inputId}>`. `inputId` defaults to `props.name` if no explicit `id` passed.
2. **`aria-invalid`**: Set on `<input>` when `error` prop is truthy (`Input.tsx:65`).
3. **`aria-describedby`**: Links to error message `<div id={inputId}-error}>` when error is present (`Input.tsx:66`).
4. **`aria-live="polite"`**: Present on error containers in `LoginForm.tsx` (both email and password steps), `RegisterForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`, and `MfaTotpStep.tsx` recovery view.
5. **`role="alert"`**: On error containers in `LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`, `MfaTotpStep.tsx` recovery view, `RateLimitBanner`, passkey error.
6. **Keyboard navigation**: Tab order follows visual layout. DeleteAccount modal has full focus trap with Escape close. Passkey rename/delete modals managed via state-controlled overlays.
7. **`aria-hidden`**: On decorative `AuthGridLines` component.
8. **`aria-label`**: On passkey button (`aria-label="Sign in with passkey"`), MFA TOTP digit inputs (`aria-label="Digit N"`), password show/hide toggle (`aria-label="Show/Hide password"`).

**Warning — Gap 1** (`MfaTotpStep.tsx:274`): The error container in the **TOTP view** (when `useRecovery === false`) is missing `role="alert"`. The div at line 274-286 only has CSS classes, not `role="alert"` or `aria-live`. The recovery code view at line 149 correctly has both `role="alert"` and `aria-live="polite"`. Screen readers will not announce TOTP verification errors automatically.

**Warning — Gap 2** (`Input.tsx:76`): The password show/hide toggle has `tabIndex={-1}`, which prevents keyboard-only users from accessing the toggle. The button does have `aria-label` for screen reader discovery via virtual cursor, but keyboard users cannot Tab to it. This is a deliberate UX trade-off to prevent accidental toggling during form navigation, but creates a barrier for keyboard-only users.

**Jira**: SCRUM-231 (LOW, WARN) created in Sprint 10 for remediation. Not yet applied.

**Standard**: WCAG 2.1 AA (SC 4.1.3 Status Messages, SC 2.1.1 Keyboard), OWASP ASVS 1.1.7

---

## Endpoint Coverage Matrix

| # | Backend Endpoint | Frontend Integration | Status |
|---|-----------------|---------------------|--------|
| 1 | `GET /auth/csrf-token` | `lib/csrf.ts:getCsrfToken()` | PASS |
| 2 | `POST /auth/register` | `AuthContext.register()` | PASS |
| 3 | `POST /auth/login` | `AuthContext.login()` | PASS |
| 4 | `POST /auth/refresh` | `AuthContext.refreshSession()`, `api.ts:silentRefresh()` | PASS |
| 5 | `POST /auth/logout` | `AuthContext.logout()` | PASS |
| 6 | `POST /auth/logout-all` | `ActiveSessions.revokeAllOtherSessions()` | PASS |
| 7 | `GET /auth/me` | `AuthContext` (post-login/refresh) | PASS |
| 8 | `GET /auth/admin` | `AdminRoute` (client-side role check) | PASS |
| 9 | `POST /auth/mfa/setup` | `MfaSetup.handleSetup()` | PASS |
| 10 | `POST /auth/mfa/verify-setup` | `MfaSetup.handleVerifySetup()` | PASS |
| 11 | `POST /auth/mfa/verify-login` | `AuthContext.verifyMfaLogin()` | PASS |
| 12 | `DELETE /auth/mfa` | `MfaSetup.handleDisable()` | PASS |
| 13 | `POST /auth/mfa/recovery-codes` | `MfaSetup.handleRegenerate()` | PASS |
| 14 | `GET /auth/mfa/status` | `MfaSetup.fetchStatus()` | PASS |
| 15 | `POST /auth/verify-email` | `VerifyEmailStatus` component | PASS |
| 16 | `POST /auth/verify-email-change` | `app/verify-email-change/page.tsx` | PASS |
| 17 | `POST /auth/resend-verification` | `AuthContext.resendVerification()` | PASS |
| 18 | `POST /auth/resend-verification-public` | `AuthContext.resendVerificationPublic()` | PASS |
| 19 | `POST /auth/forgot-password` | `AuthContext.forgotPassword()` | PASS |
| 20 | `POST /auth/reset-password` | `AuthContext.resetPassword()` | PASS |
| 21 | `POST /auth/validate-reset-token` | `AuthContext.validateResetToken()` | PASS |
| 22 | `GET /auth/google` | `OAuthButtons` (anchor href) | PASS |
| 23 | `GET /auth/google/callback` | Backend redirect (no direct call needed) | PASS |
| 24 | `GET /auth/github` | `OAuthButtons` (anchor href) | PASS |
| 25 | `GET /auth/github/callback` | Backend redirect (no direct call needed) | PASS |
| 26 | `POST /auth/oauth/exchange` | `AuthContext.handleOAuthCallback()` | PASS |
| 27 | `POST /auth/link/code` *(new)* | `oauth-api.ts:generateLinkCode()` | PASS |
| 28 | `GET /auth/link/google` | `ConnectedAccounts.handleConnect()` (redirect after code) | PASS |
| 29 | `GET /auth/link/github` | `ConnectedAccounts.handleConnect()` (redirect after code) | PASS |
| 30 | `POST /auth/passkeys/register/options` | `usePasskey.registerPasskey()` | PASS |
| 31 | `POST /auth/passkeys/register/verify` | `usePasskey.registerPasskey()` | PASS |
| 32 | `POST /auth/passkeys/login/options` | `usePasskey.loginWithPasskey()` | PASS |
| 33 | `POST /auth/passkeys/login/verify` | `AuthContext.passkeyLogin()` | PASS |
| 34 | `GET /auth/passkeys` | `usePasskey.fetchPasskeys()` | PASS |
| 35 | `PATCH /auth/passkeys/:id` | `usePasskey.renamePasskey()` | PASS |
| 36 | `DELETE /auth/passkeys/:id` | `usePasskey.deletePasskey()` | PASS |
| 37 | `GET /auth/sessions` | `ActiveSessions.fetchSessions()` | PASS |
| 38 | `DELETE /auth/sessions/:id` | `ActiveSessions.revokeSession()` | PASS |
| 39 | `POST /auth/trusted-devices` | `TrustedDevices.handleTrust()` | PASS |
| 40 | `GET /auth/trusted-devices` | `TrustedDevices.fetchDevices()` | PASS |
| 41 | `DELETE /auth/trusted-devices` | `TrustedDevices.handleRevokeAll()` | PASS |
| 42 | `DELETE /auth/trusted-devices/:id` | `TrustedDevices.handleRevoke()` | PASS |

**Coverage**: 42/42 endpoints integrated (100%)
**Correction vs previous audit**: Previous audit documented 41 endpoints. `POST /auth/link/code` (`oauth.controller.ts:179`) was missed. Frontend integration via `generateLinkCode()` was already present in `ConnectedAccounts.tsx` — no gap existed, only a documentation gap in the previous audit.

---

## WARN Findings Summary

| Check | Finding | Severity | Jira | Standard |
|-------|---------|----------|------|----------|
| FE-23 | `style-src 'unsafe-inline'` in CSP — accepted trade-off for Tailwind CSS JIT | HIGH | None (accepted) | OWASP ASVS 14.4.3 |
| FE-25 | Login form intentionally omits password format validation client-side (anti-enumeration) | MEDIUM | None (accepted design) | OWASP ASVS 2.1.1, CWE-203 |
| FE-26 | MFA TOTP error container missing `role="alert"` + `aria-live`; password toggle `tabIndex={-1}` blocks keyboard access | MEDIUM | SCRUM-231 (open) | WCAG 2.1 AA SC 4.1.3, SC 2.1.1 |

---

## Architecture Observations

1. **Centralized API client** (`lib/api.ts`): Single `ApiClient` class handles auth headers, CSRF, silent token refresh, device fingerprint, and error parsing. Clean separation of concerns — all auth mechanics in one well-tested location.

2. **State management**: `AuthContext` uses `useReducer` with typed discriminated union actions — clean, predictable state transitions. MFA state (`mfaRequired`, `mfaToken`) is integral to the auth state machine.

3. **Hook encapsulation**: Complex flows (passkeys, trusted devices, rate limiting) are encapsulated in dedicated hooks (`usePasskey`, `useTrustedDevices`, `useRateLimit`). Components remain thin.

4. **OAuth code-exchange pattern**: Backend uses ephemeral authorization codes (`POST /auth/oauth/exchange`) rather than direct tokens in the URL — correct security pattern avoiding token exposure in browser history, Referer headers, or server logs.

5. **OAuth link code intermediary** (`POST /auth/link/code`): Account linking now uses a server-generated short-lived code rather than passing the JWT directly as a query parameter. This was added as the remediation for SCRUM-218 (V8.3.1 — Remove JWT from query param in OAuth link). Implementation confirmed correct.

6. **Conditional UI (passkeys)**: Progressive enhancement — conditional mediation detected at runtime via `PublicKeyCredential.isConditionalMediationAvailable()`, with graceful degradation if unsupported.

7. **Race condition prevention**: OAuth callback page skips initial refresh (`mountedRef.current = true` + `AUTH_STOP` on `/auth/callback`) to prevent race between refresh's `LOGOUT` and exchange's `AUTH_SUCCESS`.

8. **Fingerprint fail-open**: `fingerprint.ts` catches FingerprintJS load errors and returns empty string, ensuring login continues even if the fingerprinting library fails. Device fingerprint is a convenience feature, not a hard security gate.
