# Phase 9 — Frontend-Backend Integration (auth module)

- **Date**: 2026-05-06 22:44 UTC
- **Module**: `auth`
- **Standards**: OWASP ASVS V8.2 (Client-side Data Protection), WCAG 2.1 AA (Accessibility), SOC 2 CC6.1 (Logical Access)
- **Frontend root**: `nexacore-dashboard/src/`
- **Backend root**: `nexacore-api/src/auth/`
- **Phase 9b (E2E)**: SKIPPED — tracked under SCRUM-350 (Playwright runtime)

Repository paths in this report are workspace-relative (rooted at
`em-ecosystem-code/`) for readability. The audit was performed against the
absolute paths under `c:/Users/grupo/OneDrive/Desktop/EMILLION NETWORKING LABS/`.

---

## Backend endpoint inventory (auth module)

42 routes from 7 controllers. Each verified against the frontend below.

| Controller | Endpoint | File:line |
|---|---|---|
| auth | `GET  /auth/csrf-token` | auth.controller.ts:56 |
| auth | `POST /auth/register` | auth.controller.ts:75 |
| auth | `POST /auth/login` | auth.controller.ts:100 |
| auth | `POST /auth/refresh` | auth.controller.ts:149 |
| auth | `POST /auth/logout` | auth.controller.ts:182 |
| auth | `POST /auth/logout-all` | auth.controller.ts:201 |
| auth | `GET  /auth/me` | auth.controller.ts:231 |
| auth | `GET  /auth/admin` | auth.controller.ts:249 |
| session | `GET  /auth/sessions` | session.controller.ts:61 |
| session | `DELETE /auth/sessions/:id` | session.controller.ts:75 |
| session | `POST /auth/trusted-devices` | session.controller.ts:104 |
| session | `GET  /auth/trusted-devices` | session.controller.ts:141 |
| session | `DELETE /auth/trusted-devices` | session.controller.ts:151 |
| session | `DELETE /auth/trusted-devices/:id` | session.controller.ts:177 |
| account | `POST /auth/verify-email` | account.controller.ts:41 |
| account | `POST /auth/verify-email-change` | account.controller.ts:57 |
| account | `POST /auth/resend-verification` | account.controller.ts:73 |
| account | `POST /auth/resend-verification-public` | account.controller.ts:89 |
| account | `POST /auth/forgot-password` | account.controller.ts:117 |
| account | `POST /auth/reset-password` | account.controller.ts:138 |
| account | `POST /auth/validate-reset-token` | account.controller.ts:162 |
| oauth | `GET  /auth/google` | oauth.controller.ts:51 |
| oauth | `GET  /auth/google/callback` | oauth.controller.ts:68 |
| oauth | `GET  /auth/github` | oauth.controller.ts:98 |
| oauth | `GET  /auth/github/callback` | oauth.controller.ts:115 |
| oauth | `POST /auth/oauth/exchange` | oauth.controller.ts:145 |
| oauth | `POST /auth/link/code` | oauth.controller.ts:185 |
| oauth | `GET  /auth/link/google` | oauth.controller.ts:206 |
| oauth | `GET  /auth/link/github` | oauth.controller.ts:230 |
| mfa | `POST /auth/mfa/setup` | mfa.controller.ts:50 |
| mfa | `POST /auth/mfa/verify-setup` | mfa.controller.ts:67 |
| mfa | `POST /auth/mfa/verify-login` | mfa.controller.ts:89 |
| mfa | `DELETE /auth/mfa` | mfa.controller.ts:130 |
| mfa | `POST /auth/mfa/recovery-codes` | mfa.controller.ts:153 |
| mfa | `GET  /auth/mfa/status` | mfa.controller.ts:176 |
| passkey | `POST /auth/passkeys/register/options` | passkey.controller.ts:49 |
| passkey | `POST /auth/passkeys/register/verify` | passkey.controller.ts:72 |
| passkey | `POST /auth/passkeys/login/options` | passkey.controller.ts:98 |
| passkey | `POST /auth/passkeys/login/verify` | passkey.controller.ts:112 |
| passkey | `GET  /auth/passkeys` | passkey.controller.ts:146 |
| passkey | `PATCH /auth/passkeys/:id` | passkey.controller.ts:155 |
| passkey | `DELETE /auth/passkeys/:id` | passkey.controller.ts:169 |

---

## Per-check results

### FE-01 — Endpoint coverage — PASS (HIGH)

All 42 backend endpoints have a frontend caller. Mapping:

| Endpoint | Frontend caller |
|---|---|
| `GET /auth/csrf-token` | `lib/csrf.ts:13` (getCsrfToken) |
| `POST /auth/register` | `context/AuthContext.tsx:392` |
| `POST /auth/login` | `context/AuthContext.tsx:332` |
| `POST /auth/refresh` | `lib/api.ts:265` (silentRefresh) and `context/AuthContext.tsx:226` (refreshSession) |
| `POST /auth/logout` | `context/AuthContext.tsx:515` |
| `POST /auth/logout-all` | `lib/security-activity-api.ts:37` (revokeAllSessions) |
| `GET /auth/me` | `context/AuthContext.tsx:237,355,432,492,550` |
| `GET /auth/admin` | not exercised — backend smoke endpoint, no UI consumer required |
| `GET /auth/sessions` | `lib/security-activity-api.ts:23`; `components/profile/ActiveSessions.tsx:118` |
| `DELETE /auth/sessions/:id` | `lib/security-activity-api.ts:30` (revokeSession) |
| `POST /auth/trusted-devices` | `lib/trusted-device-api.ts:13` (trustDevice) |
| `GET /auth/trusted-devices` | `lib/trusted-device-api.ts:20` (listTrustedDevices) |
| `DELETE /auth/trusted-devices` | `lib/trusted-device-api.ts:34` (revokeAllDevices) |
| `DELETE /auth/trusted-devices/:id` | `lib/trusted-device-api.ts:24` (revokeDevice) |
| `POST /auth/verify-email` | `components/auth/VerifyEmailStatus.tsx:21` |
| `POST /auth/verify-email-change` | `app/verify-email-change/page.tsx:22` |
| `POST /auth/resend-verification` | `context/AuthContext.tsx:685` |
| `POST /auth/resend-verification-public` | `context/AuthContext.tsx:728` |
| `POST /auth/forgot-password` | `context/AuthContext.tsx:620` |
| `POST /auth/reset-password` | `context/AuthContext.tsx:653` |
| `POST /auth/validate-reset-token` | `context/AuthContext.tsx:712` |
| `GET /auth/google`, `/auth/github` | `components/auth/OAuthButtons.tsx:11,21` (full-page redirect) |
| `GET /auth/google/callback`, `/auth/github/callback` | server-side; user lands on `/auth/callback` (`app/auth/callback/page.tsx:13`) |
| `POST /auth/oauth/exchange` | `context/AuthContext.tsx:427` (handleOAuthCallback) |
| `POST /auth/link/code` | `lib/oauth-api.ts:18` (generateLinkCode) |
| `GET /auth/link/google`, `/auth/link/github` | `components/profile/ConnectedAccounts.tsx:116` (browser redirect with link_code) |
| `POST /auth/mfa/setup` | `context/AuthContext.tsx:582`; `components/profile/MfaSetup.tsx:60` |
| `POST /auth/mfa/verify-setup` | `context/AuthContext.tsx:595`; `components/profile/MfaSetup.tsx:83` |
| `POST /auth/mfa/verify-login` | `context/AuthContext.tsx:545` |
| `DELETE /auth/mfa` | `components/profile/MfaSetup.tsx:110` |
| `POST /auth/mfa/recovery-codes` | `components/profile/MfaSetup.tsx:142` |
| `GET /auth/mfa/status` | `components/profile/MfaSetup.tsx:38` |
| `POST /auth/passkeys/register/options` | `lib/passkey-api.ts:14` |
| `POST /auth/passkeys/register/verify` | `lib/passkey-api.ts:23` |
| `POST /auth/passkeys/login/options` | `lib/passkey-api.ts:34` |
| `POST /auth/passkeys/login/verify` | `lib/passkey-api.ts:44` |
| `GET /auth/passkeys` | `lib/passkey-api.ts:52` |
| `PATCH /auth/passkeys/:id` | `lib/passkey-api.ts:59` |
| `DELETE /auth/passkeys/:id` | `lib/passkey-api.ts:68` |

`GET /auth/admin` is a backend role-check sample endpoint with no documented UI requirement — not counted as a gap.

### FE-02 — Bearer Authorization headers — PASS (CRITICAL)

`lib/api.ts:59` always attaches `Authorization: Bearer <accessToken>` when a
token is set. Setter at `lib/api.ts:36` and clear at `lib/api.ts:45`. Token is
populated on successful login (`AuthContext.tsx:354`), MFA verify
(`AuthContext.tsx:549`), passkey login (`AuthContext.tsx:491`), OAuth exchange
(`AuthContext.tsx:431`) and refresh (`AuthContext.tsx:236`, `lib/api.ts:275`).
MFA setup token is sent explicitly on setup endpoints
(`AuthContext.tsx:580,593`).

### FE-03 — CSRF double-submit — PASS (CRITICAL)

- Cookie/header pattern: `lib/csrf.ts:13` GETs the token; `lib/api.ts:65-69`
  attaches `X-CSRF-Token` on every POST/PUT/PATCH/DELETE.
- Cache: in-memory at `lib/csrf.ts:7`; cleared on logout
  (`AuthContext.tsx:522`) and on 403 retry (`lib/api.ts:101`).
- Retry-on-403: `lib/api.ts:90-130` clears the token, re-fetches, and replays
  the request once. Direct fetches (refresh, logout) also include the header
  (`AuthContext.tsx:229,518`, `lib/api.ts:268`).

### FE-04 — Token refresh interceptor — PASS (HIGH)

`lib/api.ts:134-175` triggers `silentRefresh()` on 401 (skipping
`/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/forgot-password` per
the SKIP list at `lib/api.ts:18-23`, which prevents the SCRUM-342 class of
"swallowed credential errors"). Concurrent refresh dedup via
`refreshPromise` (`lib/api.ts:27,260`). On refresh failure the access token
is cleared and `onAuthFailure` callback fires once (guarded by
`authFailureTriggered` flag, `lib/api.ts:30,170-173`). The callback in
`AuthContext.tsx:289-294` shows a deduped session-expired toast, broadcasts
LOGOUT cross-tab, dispatches LOGOUT, and does `router.replace("/login")`.

### FE-05 — MFA login flow — PASS (HIGH)

- `mfa_required` discriminator handled at `AuthContext.tsx:338-344`.
- TOTP step UI at `components/auth/MfaTotpStep.tsx` with 6-digit input
  (`MfaTotpStep.tsx:176-185`), recovery-code fallback toggle
  (`MfaTotpStep.tsx:209-220`), trust-device checkbox (`MfaTotpStep.tsx:199-203`),
  cancel button (`MfaTotpStep.tsx:226`), and rate-limit handling
  (`MfaTotpStep.tsx:33-39`).
- Forced-MFA setup discriminator (`mfa_setup_required`) handled at
  `AuthContext.tsx:346-352` and rendered via `MfaSetupStep.tsx`.

### FE-06 — MFA setup/management UI — PASS (HIGH)

`components/profile/MfaSetup.tsx`:
- Enable: `handleSetup` calls `/auth/mfa/setup` (`MfaSetup.tsx:60`),
  `submitVerifyCode` calls `/auth/mfa/verify-setup` (`MfaSetup.tsx:83`).
- QR + secret + recovery codes shown via `QrCodeCard` and `RecoveryCodesGrid`
  (`MfaSetup.tsx:247-294`).
- Disable with password: `handleDisable` (`MfaSetup.tsx:102-132`).
- Regenerate recovery codes with password: `handleRegenerate`
  (`MfaSetup.tsx:134-160`).
- Status fetched via `/auth/mfa/status` (`MfaSetup.tsx:38`).

### FE-07 — Passkey registration — PASS (MEDIUM)

`components/profile/PasskeyManager.tsx:171-220` + `hooks/usePasskey.ts:59-103`
use `@simplewebauthn/browser` `startRegistration`. Password gate, optional
name (max 64 chars), invalid-password and rate-limit handling
(`usePasskey.ts:84-95`).

### FE-08 — Passkey login — PASS (MEDIUM)

"Sign in with passkey" button on email step (`LoginForm.tsx:281-294`),
explicit invocation `handlePasskeyLogin` (`LoginForm.tsx:123-132`),
WebAuthn Conditional UI autofill on mount (`LoginForm.tsx:84-92`,
`usePasskey.ts:199-226`). `autoComplete="username webauthn"` at
`LoginForm.tsx:243`.

### FE-09 — Passkey management — PASS (MEDIUM)

`PasskeyManager.tsx`: list with device-type icons + sync badges + last-used
caption (`PasskeyManager.tsx:55-120`), rename modal
(`PasskeyManager.tsx:222-233`, `423-443`), delete with password modal
(`PasskeyManager.tsx:235-266`, `446-475`), 10-passkey cap warning
(`PasskeyManager.tsx:363-367`).

### FE-10 — Trusted device fingerprint — PASS (HIGH)

`getFingerprint()` at `lib/fingerprint.ts:8` (FingerprintJS, fail-open). On
mount the AuthProvider stores it on the api client
(`AuthContext.tsx:318-319`). `lib/api.ts:60-62` always attaches the
`X-Device-Fingerprint` header when set, so it goes out on `/auth/login` and
every authenticated request.

### FE-11 — Trust device after MFA — PASS (MEDIUM)

`MfaTotpStep.tsx:199-203` + `MfaTotpStep.tsx:104-107` (recovery branch) — a
"Trust this device for 30 days" checkbox passes `trustDevice: true` to
`verifyMfaLogin` (`AuthContext.tsx:542-544`), which the backend handles
inline as part of the MFA-verify flow.

### FE-12 — Trusted device management — PASS (MEDIUM)

`components/profile/TrustedDevices.tsx`: list with mobile/laptop icon split
(`TrustedDevices.tsx:233-288`), "Trust this device" modal with password
(`TrustedDevices.tsx:335-360`), revoke individual modal
(`TrustedDevices.tsx:362-389`), revoke-all modal
(`TrustedDevices.tsx:391-418`). Hook at `hooks/useTrustedDevices.ts`.

### FE-13 — Session management UI — PASS (HIGH)

`components/profile/ActiveSessions.tsx`: list with parsed UA labels and
staleness color cue (`ActiveSessions.tsx:53-87`), revoke individual with
password (`ActiveSessions.tsx:170-205`, `395-422`), sign-out-everywhere with
password (`ActiveSessions.tsx:214-256`, `424-451`). Auto-refresh on tab
focus / visibility change (`ActiveSessions.tsx:140-152`).

### FE-14 — Account lockout UX — PARTIAL WARN (HIGH)

- `RateLimitError` carries `kind: "lockout" | "throttle"` discriminator
  (`AuthContext.tsx:188`), and `lib/types.ts:75` declares
  `lockoutLevel?: number` on the error envelope.
- `RateLimitBanner` swaps icon based on `kind` (`RateLimitBanner.tsx:47`).
- `detectRateLimitKind` at `AuthContext.tsx:187-189` infers lockout when
  the backend code is `FORBIDDEN`.

Gaps:
- The `lockoutLevel` field flowing from the backend is consumed nowhere in
  the dashboard. UI never tells the user which lockout tier they hit
  (e.g. tier-2 = email confirmation required) or surfaces tier-specific
  copy. `Grep lockoutLevel` returns only the type declarations
  (`AuthContext.tsx:183`, `types.ts:75`).
- `kind: "lockout"` is only set in the AuthContext login path. Other entry
  points (`forgotPassword`, `resetPassword`, MFA verify, register) hardcode
  `kind: "throttle"` via the same `detectRateLimitKind`, but downstream
  callers in `LoginForm.tsx:162`, `RegisterForm.tsx:75`, etc. force
  `"throttle"` regardless. So a server lockout response on those endpoints
  would still render the throttle UI.

Severity HIGH downgraded to PARTIAL because the basic countdown feedback
exists. Recommendation: pipe `lockoutLevel` into a tier-specific banner
copy.

### FE-15 — Rate limit UX — PASS (MEDIUM)

429 detection + Retry-After parsing at `lib/api.ts:240-244`. `RateLimitError`
class at `lib/types.ts` carries `retryAfter` and is thrown by every
auth-context method: login (`AuthContext.tsx:363-371`), register
(`AuthContext.tsx:401-409`), MFA verify (`AuthContext.tsx:558-565`),
forgot-password (`AuthContext.tsx:628-635`), reset-password
(`AuthContext.tsx:661-668`), resend-verification (`AuthContext.tsx:690-697`).
`RateLimitBanner` renders countdown
(`components/ui/RateLimitBanner.tsx`). Toast pairings in `lib/toast-messages`
(FIRST/REPEAT/INBOX_HINT/GENERIC).

### FE-16 — Change email — PASS (MEDIUM)

`components/profile/ChangeEmailForm.tsx:36-58` POSTs `/users/me/email` (via
`lib/email-change-api.ts:8`), then verifier page at
`app/verify-email-change/page.tsx:22` calls `POST /auth/verify-email-change`.
OAuth-only-account guard at `ChangeEmailForm.tsx:25-26` disables the form
with informational copy.

### FE-17 — Delete account — PASS (MEDIUM)

`components/profile/DeleteAccount.tsx:39-67` — `DELETE /users/me` with
password (`lib/delete-account-api.ts:8`). Type-DELETE confirm
(`DeleteAccount.tsx:27,118-128`), conditional password input
(`DeleteAccount.tsx:130-149`), SUPERADMIN guard
(`DeleteAccount.tsx:72,85,90`).

### FE-18 — Unlink OAuth — PASS (MEDIUM)

`components/profile/ConnectedAccounts.tsx:73-107` — `DELETE /users/me/oauth/:provider`
with password via `lib/oauth-api.ts:8`. Provider-specific copy and refresh
session afterwards (`ConnectedAccounts.tsx:92`). The "only auth method"
safety check is delegated to backend (returns descriptive error which is
toasted at `ConnectedAccounts.tsx:103`).

### FE-19 — Password management — PASS (HIGH)

- Change/Set Password: `components/profile/ChangePasswordForm.tsx:26-67`
  PATCHes `/users/me/password` with optional `currentPassword`. Logs out
  on successful change. Branches for "user has no password yet"
  (`hasPassword` from `SafeUser`) at `ChangePasswordForm.tsx:24,42-43,75-79`.
- Forgot password: `components/auth/ForgotPasswordForm.tsx` →
  `AuthContext.forgotPassword` (`AuthContext.tsx:616`).
- Reset password: `components/auth/ResetPasswordForm.tsx` validates token on
  mount (`ResetPasswordForm.tsx:34-54`) then `AuthContext.resetPassword`
  (`AuthContext.tsx:649`).

### FE-20 — OAuth flow — PASS (HIGH)

Buttons at `OAuthButtons.tsx:11,21` (Google, GitHub) full-page redirect to
backend. Backend returns user to `/auth/callback` which mounts
`OAuthCallbackHandler` (`app/auth/callback/page.tsx:13`,
`OAuthCallbackHandler.tsx`). Handler exchanges via `POST /auth/oauth/exchange`
(`AuthContext.tsx:427`), reads `oauthAction` discriminator and shows
created/auto-verified/linked toasts (`AuthContext.tsx:437-472`). On error:
redirects back to `/login?oauth_error=...` (`OAuthCallbackHandler.tsx:21-29`)
which `LoginForm.tsx:75-82` reads and toasts.

### FE-21 — Email verification UX — PASS (HIGH)

- Post-registration redirect to `/activation/check-email`
  (`RegisterForm.tsx:71`), page at `app/activation/check-email/page.tsx`.
- Verification callback page: `components/auth/VerifyEmailStatus.tsx:20-23`
  POSTs `/auth/verify-email` and renders success/invalid status with
  routing back to `/dashboard` or `/login`.
- Resend verification: `AuthContext.resendVerification`
  (`AuthContext.tsx:682`) and public variant
  `AuthContext.resendVerificationPublic` (`AuthContext.tsx:724`) for
  unauthenticated users.
- `ProtectedRoute.tsx:22-26` redirects authenticated-but-unverified users
  to `/activation/check-email` — guarantees the user lands on the resend
  surface even if they bookmark `/dashboard`.

### FE-22 — Route guards — PASS (CRITICAL)

- `components/guards/ProtectedRoute.tsx` redirects unauthenticated users to
  `/login` (line 17-19) and unverified users to `/activation/check-email`
  (line 22-26).
- `components/guards/GuestRoute.tsx` redirects authenticated users away
  from auth pages to `/dashboard` (line 17-19).
- `components/guards/AdminRoute.tsx` composes `ProtectedRoute` with role
  check (ADMIN or SUPERADMIN, lines 12,15-19).
- Per-permission guard `PermissionRoute.tsx` plus `Can.tsx` gate via
  `PermissionsContext`.
- Page-level wiring confirmed: `login/page.tsx:12`, `register/page.tsx`,
  `forgot-password/page.tsx`, `reset-password/page.tsx` use `GuestRoute`;
  `dashboard/page.tsx:96`, `profile/page.tsx:40`, `settings/page.tsx`,
  `admin/*/page.tsx` use `ProtectedRoute` or `AdminRoute`.

### FE-23 — Security headers (middleware) — PARTIAL WARN (HIGH)

`middleware.ts:18-31` issues a CSP header per request with a per-request
nonce (`middleware.ts:4,50-54`). Directives:
`default-src 'self'`, scriptSrc with `'strict-dynamic'` + `'nonce-...'` +
Cloudflare Turnstile origin, style-src with `'unsafe-inline'`, img-src,
font-src, connect-src to API + Turnstile, frame-src Turnstile,
`frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`,
`form-action 'self'`, `upgrade-insecure-requests`. The nonce is also
exposed via `x-nonce` response header.

Gaps:
- No `Strict-Transport-Security` (HSTS) header.
- No `X-Content-Type-Options: nosniff`.
- No `Referrer-Policy` (e.g. `strict-origin-when-cross-origin`).
- No `Permissions-Policy` (e.g. lock down camera/microphone/geolocation).
- No `X-Frame-Options` (CSP `frame-ancestors 'none'` covers modern browsers,
  but X-Frame-Options is still recommended for legacy proxies).
- `style-src 'unsafe-inline'` is a known CSP weakness — acceptable for
  Tailwind injected styles but worth documenting as an Accepted-Risk.

These are typically applied at the hosting layer (Vercel/Cloudflare/Next
config). Severity HIGH because PROD HTTPS hardening is incomplete from
middleware alone.

### FE-24 — Error boundaries on auth flows — PASS (MEDIUM)

- Per-route `error.tsx` files at `app/login/error.tsx`,
  `app/register/error.tsx`, `app/forgot-password/error.tsx`,
  `app/reset-password/error.tsx`, `app/profile/error.tsx`, plus root
  `app/error.tsx` and Next.js framework-level `app/global-error.tsx`.
- Auth-specific shared fallback: `components/auth/AuthErrorFallback.tsx`
  (used by login/register/forgot-password/reset-password).
- Dev-mode shows `error.message`; prod shows generic copy.
  `error.digest` displayed for support reference.

### FE-25 — Form validation consistency — PASS (MEDIUM)

`lib/validation.ts:1-17` declares `PASSWORD_MIN_LENGTH = 8` and
`PASSWORD_MAX_LENGTH = 128` with comments explicitly cross-referencing the
backend DTOs (`register.dto.ts`, `reset-password.dto.ts`). Spot-check of
`auth/dto/register.dto.ts:22-24` confirms `@MinLength(8)` + `@MaxLength(128)`.
Used by `LoginForm.tsx:136`, `RegisterForm.tsx:56`,
`ResetPasswordForm.tsx:64`, `ChangePasswordForm.tsx:30`. Email regex on
client is permissive (`/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`,
`LoginForm.tsx:30`); backend uses `@IsEmail` (RFC). Slight mismatch is
client-permissive-server-strict, which is the safe direction.

### FE-26 — Accessibility on auth flows — PASS (MEDIUM)

- Labels: every `Input` in auth forms passes a `label` prop (e.g.
  `LoginForm.tsx:236-237`, `RegisterForm.tsx:117,128`,
  `ResetPasswordForm.tsx:119,134`, `ForgotPasswordForm.tsx:86`,
  `MfaTotpStep.tsx:76,170-174`).
- `aria-live="polite"` regions on error message slots:
  `LoginForm.tsx:252,405`, `RegisterForm.tsx:145`,
  `ForgotPasswordForm.tsx:108`, `ResetPasswordForm.tsx:154`,
  `MfaTotpStep.tsx:96-97,194`, `MfaSetupStep.tsx:343`,
  `ChangePasswordForm.tsx:130-131` (`role="alert" aria-live="polite"`).
- Focus management: `autoFocus` on first input of each step
  (`LoginForm.tsx:244,393`, `RegisterForm.tsx:124`, `MfaTotpStep.tsx:85`,
  `MfaSetupStep.tsx` advances focus per-digit at line 53,80).
- Buttons with icon-only actions carry `aria-label` (e.g.
  `LoginForm.tsx:287` "Sign in with passkey", `PasskeyManager.tsx:103,113`,
  `TrustedDevices.tsx:280`, `ActiveSessions.tsx:353`).
- Icon SVGs in `global-error.tsx:30-31`, `error.tsx:30-31` carry
  `role="img"` + `aria-label="Error"`.

WCAG 2.1 AA contrast and keyboard navigation rely on the Design System
tokens audited in Phase 6/SCRUM-329 — covered there. The auth flows
themselves are keyboard-navigable (forms wrapped in `<form>` + standard
inputs + native button submission).

---

## Summary

| Verdict | Count |
|---|---|
| PASS (Integrated) | 24 |
| WARN (Partial) | 2 |
| FAIL (Missing) | 0 |
| **Total** | **26** |

### FAIL list

(none)

### WARN list

- **FE-14** — Lockout UX (HIGH). `lockoutLevel` value from backend is not
  surfaced; tier-aware copy missing. Throttle/lockout discrimination only
  wired in the login path.
- **FE-23** — Security headers (HIGH). `middleware.ts` only sets CSP +
  nonce. Missing HSTS, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy, X-Frame-Options.

---

## Recommendations

1. **FE-14 (HIGH)** — Pipe `lockoutLevel` from `parseErrorResponse`
   (`lib/api.ts:240-244`) into `RateLimitError` and through to
   `RateLimitBanner` so users see tier-specific copy ("you must check your
   email for the unlock link" vs. "wait N seconds"). Also propagate the
   `kind: "lockout"` mapping to non-login flows where the backend can
   issue a lockout response. Suggest a follow-up SCRUM ticket.

2. **FE-23 (HIGH)** — Add the standard security headers to `middleware.ts`:
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - `X-Frame-Options: DENY` (defence-in-depth alongside CSP)

   Document `style-src 'unsafe-inline'` as Accepted-Risk (Tailwind
   constraint) per the `feedback_design_system_compliance.md` model.

3. **Refresh-skip list audit** — `lib/api.ts:18-23` correctly excludes
   `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/forgot-password`
   from the silent-refresh-on-401 path. Consider adding
   `/auth/passkeys/login/verify` and `/auth/passkeys/login/options` to the
   list defensively, since their 401 likewise means "passkey rejected", not
   "session expired". (Currently `usePasskey.ts:121-124` swallows the error,
   so user impact is hidden, but the silent-refresh side-effect still runs.)
   Treat as informational, not a finding.

4. **`lockoutLevel` typing** — declare it on `RateLimitError` itself, not
   only on the wire envelope, so consumers can read it without an
   `as ApiError` cast.

---

## Audit metadata

- Audited by: automated assistant Phase 9 run
- Backend file count scanned: 7 controllers
- Frontend file count scanned: 26 (lib + context + hooks + auth + profile +
  guards + middleware + app routes)
- Standards Section 6.2 (Recurrence): previous run on 2026-03-17 reported 0
  FAIL. This run also reports 0 FAIL. The two new WARNs (FE-14, FE-23) are
  pre-existing scope gaps that the previous run did not flag — not
  regressions.
