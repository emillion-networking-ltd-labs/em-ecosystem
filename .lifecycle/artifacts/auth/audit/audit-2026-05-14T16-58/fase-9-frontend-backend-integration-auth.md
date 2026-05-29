---
schema: ai-specs/schemas/audit-phase-report.schema.yml
phase: frontend
module: auth
audit_folder: ai-specs/changes/auth/audit/audit-2026-05-14T16-58
date: 2026-05-14T16:58:00Z
framework_version: audit-standards.mdc v1.0
auditor: Claude (automated)
standards_covered:
  - OWASP ASVS V8.2
  - WCAG 2.1 AA
  - SOC 2 CC6.1
checks_summary:
  pass: 22
  fail: 0
  warn: 4
  na: 6
  total: 32
overall_verdict: PASS
checks:
  - check_id: FE-01
    requirement: Endpoint coverage — every backend auth endpoint has a corresponding frontend call
    verdict: WARN
    severity: HIGH
    standard: SOC 2 CC6.1
    evidence: "Covered endpoints confirmed: POST /auth/login (AuthContext.tsx:385), POST /auth/register (AuthContext.tsx:445), POST /auth/refresh (AuthContext.tsx:226 + api.ts:265), POST /auth/logout (AuthContext.tsx:568), POST /auth/logout-all (security-activity-api.ts:37), GET /auth/me (AuthContext.tsx:237), GET /auth/csrf-token (csrf.ts:13), GET /auth/google (OAuthButtons.tsx:11), GET /auth/github (OAuthButtons.tsx:21), POST /auth/oauth/exchange (AuthContext.tsx:481), GET /auth/link/google + /auth/link/github (ConnectedAccounts.tsx:118 via link_code), POST /auth/link/code (oauth-api.ts:19), POST /auth/verify-email (VerifyEmailStatus.tsx:21), POST /auth/verify-email-change (verify-email-change/page.tsx:23), POST /auth/forgot-password (AuthContext.tsx:673), POST /auth/reset-password (AuthContext.tsx:706), POST /auth/validate-reset-token (AuthContext.tsx:765), POST /auth/resend-verification (AuthContext.tsx:738), POST /auth/resend-verification-public (AuthContext.tsx:778), POST /auth/mfa/setup (MfaSetup.tsx:61 + AuthContext.tsx:635), POST /auth/mfa/verify-setup (MfaSetup.tsx:83 + AuthContext.tsx:649), POST /auth/mfa/verify-login (AuthContext.tsx:598), DELETE /auth/mfa (MfaSetup.tsx:110), POST /auth/mfa/recovery-codes (MfaSetup.tsx:144), GET /auth/mfa/status (MfaSetup.tsx:37), POST /auth/passkeys/register/options (passkey-api.ts:14), POST /auth/passkeys/register/verify (passkey-api.ts:21), POST /auth/passkeys/login/options (passkey-api.ts:32), POST /auth/passkeys/login/verify (passkey-api.ts:40), GET /auth/passkeys (passkey-api.ts:51), PATCH /auth/passkeys/:id (passkey-api.ts:56), DELETE /auth/passkeys/:id (passkey-api.ts:64), POST /auth/trusted-devices (trusted-device-api.ts:13), GET /auth/trusted-devices (trusted-device-api.ts:19), DELETE /auth/trusted-devices/:id (trusted-device-api.ts:23), DELETE /auth/trusted-devices (trusted-device-api.ts:33), GET /auth/sessions (security-activity-api.ts:23), DELETE /auth/sessions/:id (security-activity-api.ts:27), GET /users/me/security-activity (security-activity-api.ts:9), PATCH /users/me (ProfileForm.tsx:159), POST /users/me/avatar (ProfileForm.tsx:122), DELETE /users/me/avatar (ProfileForm.tsx:137), PATCH /users/me/password (ChangePasswordForm.tsx:44), POST /users/me/email (email-change-api.ts:8), DELETE /users/me (delete-account-api.ts:8), GET /users/me/oauth (oauth-api.ts:15), DELETE /users/me/oauth/:provider (oauth-api.ts:8). NOT COVERED: /auth/sessions (no DELETE for revoke-ALL pattern — /auth/logout-all is used instead — acceptable alias; individual session revoke uses DELETE /auth/sessions/:id correctly). WARN: GET /users/me/oauth is fetched in oauth-api.ts:15 but ConnectedAccounts.tsx does not call getLinkedProviders() — it derives state from user.oauthProviders (AuthContext user object). The user object is populated from GET /auth/me which lacks a dedicated OAuth providers list endpoint. This means the oauth list endpoint exists but is unused; the UI reads from the auth/me cache instead."
    expected: "Every backend auth endpoint has a corresponding frontend call or explicit UI coverage."
    actual: "GET /users/me/oauth is defined in oauth-api.ts but never called by ConnectedAccounts.tsx — it reads user.oauthProviders from AuthContext instead. The endpoint is reachable code but dead from the UI perspective."
    recommendation: "Either remove getLinkedProviders() from oauth-api.ts (dead code) or wire ConnectedAccounts.tsx to call it on mount to ensure the provider list stays fresh after linking. Using the AuthContext user object works but relies on a manual refreshSession() call after OAuth actions. Low severity but creates a stale-data risk window."
  - check_id: FE-02
    requirement: Auth headers — Bearer token on all authenticated requests
    verdict: PASS
    severity: CRITICAL
    standard: OWASP ASVS V8.2
    evidence: "api.ts:59: `...(this.accessToken && { Authorization: \\`Bearer \\${this.accessToken}\\` })` — Bearer header injected on every request that has a non-null accessToken. Header is also re-injected after silent refresh on retry (api.ts:137: `headers.Authorization = \\`Bearer \\${newToken}\\``). FormData uploads skip Content-Type but retain Authorization (api.ts:56-63)."
  - check_id: FE-03
    requirement: CSRF integration — x-csrf-token header on mutating requests; cookie reading; retry on 403
    verdict: PASS
    severity: CRITICAL
    standard: OWASP ASVS V8.2
    evidence: "api.ts:13: `const CSRF_METHODS = new Set(['POST','PUT','PATCH','DELETE'])`. api.ts:65-69: token fetched via getCsrfToken() and set as X-CSRF-Token header for all mutating requests. csrf.ts:13: getCsrfToken() fetches from GET /auth/csrf-token with credentials:include (reads HttpOnly CSRF cookie server-side). api.ts:89-130: 403 handler detects CSRF error via DETECTION_CSRF_ERROR constant, calls clearCsrfToken(), fetches new token, retries once. Logout and refresh calls in AuthContext.tsx also pass CSRF token directly (AuthContext.tsx:225-229, 567-568)."
  - check_id: FE-04
    requirement: Token refresh — 401 triggers silent refresh; concurrent refresh dedup; logout on refresh failure
    verdict: PASS
    severity: HIGH
    standard: OWASP ASVS V8.2
    evidence: "api.ts:134: `if (response.status === 401 && !SKIP_REFRESH_ON_401.has(endpoint))` — triggers silentRefresh(). api.ts:18-23: SKIP_REFRESH_ON_401 set excludes /auth/login, /auth/register, /auth/refresh, /auth/forgot-password — prevents refresh loop on genuine auth endpoints. api.ts:260-284: silentRefresh() uses promise deduplication: `if (this.refreshPromise) return this.refreshPromise`. api.ts:169-174: on refresh failure, accessToken cleared, onAuthFailure called once (authFailureTriggered guard), SessionExpiredError thrown. AuthContext.tsx:289-294: handleAuthFailure() fires toast + LOGOUT dispatch + router.replace('/login')."
  - check_id: FE-05
    requirement: MFA login flow — mfaRequired response handling, TOTP input, recovery code fallback
    verdict: PASS
    severity: HIGH
    standard: SOC 2 CC6.1
    evidence: "AuthContext.tsx:391-397: isMfaResponse() check dispatches MFA_REQUIRED with mfaToken. LoginForm.tsx:181-182: renders MfaTotpStep when mfaRequired. MfaTotpStep.tsx:17-245: full TOTP flow — 6-digit MfaDigitInput (line 176), recovery code toggle (useRecovery state, line 26), 'Use recovery code' button (line 210). MfaTotpStep.tsx:103-109: 'Trust this device for 30 days' Checkbox renders trustDevice param passed to verifyMfaLogin. AuthContext.tsx:583-628: verifyMfaLogin() calls POST /auth/mfa/verify-login with optional recoveryCode and trustDevice fields."
  - check_id: FE-06
    requirement: MFA setup — enable (QR+secret), disable (password), recovery codes regenerate
    verdict: PASS
    severity: HIGH
    standard: SOC 2 CC6.1
    evidence: "MfaSetup.tsx:57-77: handleSetup() calls POST /auth/mfa/setup, receives QR + secret + recoveryCodes. MfaSetup.tsx:79-99: submitVerifyCode() calls POST /auth/mfa/verify-setup. MfaSetup.tsx:231-271: Setup modal shows QrCodeCard + MfaDigitInput. MfaSetup.tsx:102-131: handleDisable() calls DELETE /auth/mfa with password. MfaSetup.tsx:134-159: handleRegenerate() calls POST /auth/mfa/recovery-codes with password. MfaSetup.tsx:36-43: fetchStatus() calls GET /auth/mfa/status. Recovery codes shown in RecoveryCodesGrid modal (line 293)."
  - check_id: FE-07
    requirement: Passkey registration — WebAuthn registration UI using @simplewebauthn/browser
    verdict: PASS
    severity: MEDIUM
    standard: OWASP ASVS V8.2
    evidence: "PasskeyManager.tsx:124-504: full registration UI with password confirmation modal (line 408-446). passkey-api.ts:11-28: passkeyRegisterOptions() → POST /auth/passkeys/register/options; passkeyRegisterVerify() → POST /auth/passkeys/register/verify. usePasskey hook (referenced at PasskeyManager.tsx:15) wraps @simplewebauthn/browser startRegistration. Rate-limit handling present (PasskeyManager.tsx:193-204)."
  - check_id: FE-08
    requirement: Passkey login — 'sign in with passkey' option in login page, WebAuthn authentication flow
    verdict: PASS
    severity: MEDIUM
    standard: OWASP ASVS V8.2
    evidence: "LoginForm.tsx:52-56: usePasskey() hook imported with isSupported, loginWithPasskey, isConditionalAvailable, startConditionalUI, abortConditionalUI. LoginForm.tsx:84-91: useEffect starts WebAuthn Conditional UI (passkey autofill) on mount. LoginForm.tsx:276-295: 'Sign in with passkey' button rendered when passkeySupported, calls loginWithPasskey(). AuthContext.tsx:539-563: passkeyLogin() calls passkeyLoginVerify() → POST /auth/passkeys/login/verify."
  - check_id: FE-09
    requirement: Passkey management — list, rename, delete (with password) in profile/security page
    verdict: PASS
    severity: MEDIUM
    standard: SOC 2 CC6.1
    evidence: "PasskeyManager.tsx:129: fetchPasskeys() on mount via usePasskey. PasskeyManager.tsx:224-235: handleRenameSubmit() calls renamePasskey() → PATCH /auth/passkeys/:id. PasskeyManager.tsx:237-267: handleDeleteSubmit() calls deletePasskey() with password → DELETE /auth/passkeys/:id. Delete modal at line 473-500 requires password input. DevicesPanel.tsx renders PasskeyManager alongside TrustedDevices."
  - check_id: FE-10
    requirement: Trusted device fingerprint — X-Device-Fingerprint header sent on POST /auth/login
    verdict: PASS
    severity: HIGH
    standard: SOC 2 CC6.1
    evidence: "fingerprint.ts:1: imports @fingerprintjs/fingerprintjs. AuthContext.tsx:371-373: `const fp = await getFingerprint(); if (fp) apiClient.setDeviceFingerprint(fp)` — executed on mount before refreshSession(). api.ts:60-62: `...(this.deviceFingerprint && { 'X-Device-Fingerprint': this.deviceFingerprint })` — header injected on ALL requests including POST /auth/login. fingerprint.ts:21: fail-open on error ('login still works, just can't skip MFA')."
  - check_id: FE-11
    requirement: Trust device after MFA — 'trust this device' option after MFA, calls POST /auth/trusted-devices
    verdict: PASS
    severity: MEDIUM
    standard: SOC 2 CC6.1
    evidence: "MfaTotpStep.tsx:27: `const [trustDevice, setTrustDevice] = useState(false)`. MfaTotpStep.tsx:103-108: Checkbox 'Trust this device for 30 days' — present in both TOTP flow (line 199-202) and recovery code flow (line 103-107). AuthContext.tsx:583-628: verifyMfaLogin(code, isRecovery, trustDevice) passes trustDevice to POST /auth/mfa/verify-login body. trusted-device-api.ts:9-16: trustDevice() → POST /auth/trusted-devices also available from TrustedDevices.tsx:122-143 (Trust This Device button in profile)."
  - check_id: FE-12
    requirement: Trusted device management — list, revoke individual, revoke all in profile/security
    verdict: PASS
    severity: MEDIUM
    standard: SOC 2 CC6.1
    evidence: "TrustedDevices.tsx:88-95: fetchDevices() on mount. TrustedDevices.tsx:146-172: handleRevoke() calls revokeDevice(id, password) → DELETE /auth/trusted-devices/:id. TrustedDevices.tsx:174-199: handleRevokeAll() calls revokeAllDevices(password) → DELETE /auth/trusted-devices. TrustedDevices.tsx:244-255: 'Trust This Device' button calls trustCurrentDevice() → POST /auth/trusted-devices. Individual revoke modal requires password (line 387-415). Rate-limit handling with RateLimitBanner (line 348-357)."
  - check_id: FE-13
    requirement: Session management — active session list, individual revoke, revoke all others
    verdict: PASS
    severity: HIGH
    standard: SOC 2 CC6.1
    evidence: "ActiveSessions.tsx:117-130: fetchSessions() calls GET /auth/sessions. ActiveSessions.tsx:177-212: handleRevokeSubmit() calls apiRevokeSession(id, password) → DELETE /auth/sessions/:id. ActiveSessions.tsx:221-263: signOutAllSessions() calls apiRevokeAllSessions(password) → POST /auth/logout-all. Current session highlighted with 'Current' badge (line 326-332). Revoke modal requires password. Focus refresh on tab visibility change (ActiveSessions.tsx:145-159)."
  - check_id: FE-14
    requirement: Account lockout UX — lockout detection (retryAfter, lockoutLevel), countdown timer
    verdict: WARN
    severity: HIGH
    standard: SOC 2 CC6.1
    evidence: "AuthContext.tsx:176-189: detectRateLimitKind() maps ERROR_CODE.FORBIDDEN → 'lockout', else 'throttle'. AuthContext.tsx:416-424: RateLimitError thrown with retryAfter + kind. LoginForm.tsx:148-168: handles RateLimitError, calls setRateLimit() + addToast. LoginForm.tsx:395-401: RateLimitBanner displayed with countdown on rateLimitInfo.isRateLimited. WARN: lockoutLevel field is defined in ApiError type (AuthContext.tsx:183) and parsed by parseErrorResponse (api.ts:241) but never surfaced in the UI. detectRateLimitKind() uses ERROR_CODE.FORBIDDEN (HTTP 403) as the lockout discriminator, but audit-standards §Phase 9 FE-14 expects lockoutLevel to drive differentiated UX. The current UX shows an identical countdown banner for both throttle and lockout, which hides the distinction."
    expected: "Lockout (lockoutLevel > 0 / HTTP 403) shows distinct UX from throttle (HTTP 429), with a countdown timer visible in both cases."
    actual: "Both lockout and throttle show RateLimitBanner with countdown. lockoutLevel is parsed from response body (AuthContext.tsx:183) but never read downstream to differentiate the UX message."
    recommendation: "In detectRateLimitKind() or LoginForm.tsx RateLimitError handler, read lockoutLevel from errObj.error.lockoutLevel when kind==='lockout' and pass it to RateLimitBanner or addToast so users understand that their ACCOUNT is locked (not just a rate limit). This is a UX clarity gap, not a security gap — backend already hides lockout behind generic 'Invalid credentials' per SCRUM-217."
  - check_id: FE-15
    requirement: Rate limit UX — 429 detection, Retry-After header parsing, countdown display
    verdict: PASS
    severity: MEDIUM
    standard: OWASP ASVS V8.2
    evidence: "api.ts:240-245: parseErrorResponse() reads Retry-After header and sets body.error.retryAfter for 429 AND 401 responses. AuthContext.tsx:416-424: RateLimitError thrown with retryAfter from errObj.error.retryAfter. LoginForm.tsx:154-168: FIRST vs REPEAT detection via throttleWindowEndsAtRef; first hit → AUTH_TOAST.TOO_MANY_ATTEMPTS_FIRST with email hint; repeat hit → AUTH_TOAST.TOO_MANY_ATTEMPTS_REPEAT. LoginForm.tsx:395-401: RateLimitBanner renders countdown. RegisterForm.tsx:74-82: same pattern for registration. ForgotPasswordForm also uses useRateLimit."
  - check_id: FE-16
    requirement: Change email — email change form (newEmail + currentPassword), verify-email-change callback page
    verdict: PASS
    severity: MEDIUM
    standard: SOC 2 CC6.1
    evidence: "ChangeEmailForm.tsx:36-58: handleSubmit() calls requestEmailChange(newEmail, password) → POST /users/me/email. ChangeEmailForm.tsx:14: EMAIL_REGEX validated client-side. ChangeEmailForm.tsx:24-26: OAuth-only users shown informational message (isOAuthOnly guard). verify-email-change/page.tsx:22-24: POST /auth/verify-email-change called with token from URL query param on mount. Success state redirects to login with message about sessions revoked."
  - check_id: FE-17
    requirement: Delete account — account deletion UI with password confirmation
    verdict: PASS
    severity: MEDIUM
    standard: SOC 2 CC6.1
    evidence: "DeleteAccount.tsx:38-67: handleDelete() calls deleteAccount(password) → DELETE /users/me. Requires typing 'DELETE' in confirmation input (line 27: `confirmText === 'DELETE'`). Password required when user.hasPassword (line 26). SUPERADMIN accounts show disabled button with explanation (line 71-72). DeleteAccount.tsx:50-52: calls logout() then router.push('/login') on success."
  - check_id: FE-18
    requirement: Unlink OAuth — OAuth disconnect button per provider with safety check
    verdict: PASS
    severity: MEDIUM
    standard: SOC 2 CC6.1
    evidence: "ConnectedAccounts.tsx:154-158: isLastAuthMethod guard — if user has no password and only one OAuth provider, 'Set a password first' is shown instead of Disconnect (prevents lockout). ConnectedAccounts.tsx:74-108: handleUnlink() calls unlinkOAuth(provider, password) → DELETE /users/me/oauth/:provider. ConnectedAccounts.tsx:112-135: handleConnect() calls generateLinkCode() → POST /auth/link/code then navigates to /auth/link/:provider?link_code=. Password confirmation modal required for disconnect."
  - check_id: FE-19
    requirement: Password management — change password form (current + new), forgot/reset password flow
    verdict: PASS
    severity: HIGH
    standard: SOC 2 CC6.1
    evidence: "ChangePasswordForm.tsx:42-46: PATCH /users/me/password with currentPassword + newPassword. ForgotPasswordForm exists at src/components/auth/ForgotPasswordForm.tsx (confirmed by file listing) and calls /auth/forgot-password via AuthContext.forgotPassword(). ResetPasswordForm.tsx exists and calls /auth/reset-password. AuthContext.tsx:762-775: validateResetToken() → POST /auth/validate-reset-token. validation.ts:2-4: PASSWORD_MIN_LENGTH=8 / PASSWORD_MAX_LENGTH=128 exported constants used in forms."
  - check_id: FE-20
    requirement: OAuth flow — Google/GitHub buttons, callback page with code exchange
    verdict: PASS
    severity: HIGH
    standard: SOC 2 CC6.1
    evidence: "OAuthButtons.tsx:11: `href={\\`\\${API_BASE_URL}/auth/google\\`}` — direct redirect to backend OAuth. OAuthButtons.tsx:21: `href={\\`\\${API_BASE_URL}/auth/github\\`}`. OAuthCallbackHandler.tsx exists in components/auth/. app/auth/callback/page.tsx: OAuth callback landing page. AuthContext.tsx:475-537: handleOAuthCallback() calls POST /auth/oauth/exchange, handles oauthAction values ('created', 'auto-verified', 'linked') with appropriate toasts."
  - check_id: FE-21
    requirement: Email verification — verification callback page, resend verification
    verdict: PASS
    severity: HIGH
    standard: SOC 2 CC6.1
    evidence: "app/verify-email/page.tsx renders VerifyEmailStatus.tsx. VerifyEmailStatus.tsx:21: POST /auth/verify-email with token from URL. ProtectedRoute.tsx:23-26: guards redirect unverified users to /activation/check-email. app/activation/check-email/page.tsx exists (confirmed by file listing). AuthContext.tsx:735-760: resendVerification() → POST /auth/resend-verification (authenticated). AuthContext.tsx:777-789: resendVerificationPublic() → POST /auth/resend-verification-public (unauthenticated)."
  - check_id: FE-22
    requirement: Route guards — protected routes require auth, admin routes require role, guest routes redirect authenticated
    verdict: PASS
    severity: CRITICAL
    standard: SOC 2 CC6.1
    evidence: "ProtectedRoute.tsx:16-21: redirects unauthenticated users to /login. ProtectedRoute.tsx:23-26: redirects authenticated but unverified users to /activation/check-email. GuestRoute.tsx:16-20: redirects authenticated users to /dashboard. AdminRoute.tsx:27-37: wraps ProtectedRoute + AdminCheck; AdminCheck.tsx:12: `user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'`. PermissionRoute.tsx exists for fine-grained permissions. All guards check isInitialized before redirecting (ProtectedRoute.tsx:17, GuestRoute.tsx:17) to prevent flash-of-wrong-content during session bootstrap."
  - check_id: FE-23
    requirement: Security headers — CSP, nonce generation in Next.js middleware/proxy
    verdict: PASS
    severity: HIGH
    standard: OWASP ASVS V8.2
    evidence: "proxy.ts:4: generateNonce() using crypto.getRandomValues(). proxy.ts:12-13: CSP script-src includes nonce (dev: unsafe-eval for webpack; prod: strict-dynamic only). proxy.ts:18-32: full CSP directive set: default-src 'self', style-src unsafe-inline, img-src scoped to self+data+blob+apiUrl+google/github avatar CDNs, connect-src scoped, frame-src Cloudflare only, frame-ancestors 'none', object-src 'none', base-uri 'self', form-action 'self', upgrade-insecure-requests. proxy.ts:44: Content-Security-Policy response header set. proxy.ts:36-37: nonce forwarded to request headers (x-nonce) for server components to consume."
  - check_id: FE-24
    requirement: Error boundaries — ErrorBoundary wrapping auth-critical flows (login, MFA, passkey)
    verdict: WARN
    severity: MEDIUM
    standard: SOC 2 CC6.1
    evidence: "AuthErrorFallback.tsx exists as a dedicated auth error UI component. app/login/error.tsx:3-13: Next.js route-level error boundary renders AuthErrorFallback with context='login'. app/register/error.tsx exists (confirmed by file listing). app/forgot-password/error.tsx, app/reset-password/error.tsx, app/verify-email/error.tsx, app/verify-email-change/error.tsx all exist (confirmed by ls output). However, per Next.js App Router semantics, error.tsx is a route-level boundary — it catches errors thrown during SERVER rendering. Client components (LoginForm, MfaTotpStep, PasskeyManager) render inside 'use client' boundaries where runtime errors in event handlers (e.g., WebAuthn API throw) are NOT caught by error.tsx. No explicit React ErrorBoundary class wraps the MfaTotpStep or PasskeyManager client-side render trees."
    expected: "React ErrorBoundary (or equivalent) wrapping client-side MFA and Passkey components to catch runtime WebAuthn/TOTP errors and prevent full-page blank-screen crashes."
    actual: "Route error.tsx boundaries cover SSR render phase. Client-side runtime errors in MfaTotpStep / PasskeyManager / OAuthCallbackHandler are caught locally via try/catch in event handlers (LoginForm.tsx:122-130, PasskeyManager.tsx:173-222) but not wrapped in a declarative ErrorBoundary. A React rendering error (not a thrown promise or event handler error) in these trees would surface a white screen."
    recommendation: "Wrap MfaTotpStep, MfaSetupStep, and PasskeyManager render trees in a React ErrorBoundary using a thin client-side wrapper (e.g., import from 'react-error-boundary') with AuthErrorFallback as the fallback UI. Low implementation cost; closes the white-screen risk for WebAuthn API incompatibilities."
  - check_id: FE-25
    requirement: Form validation consistency — frontend regex/min-max vs backend DTOs
    verdict: WARN
    severity: MEDIUM
    standard: OWASP ASVS V8.2
    evidence: "Password: backend register.dto.ts:23-24 `@MinLength(8) @MaxLength(128)`. Frontend validation.ts:2-4: `PASSWORD_MIN_LENGTH = 8`, `PASSWORD_MAX_LENGTH = 128` — comment on line 1 explicitly says 'Must match backend DTOs'. Exact match confirmed. Email: RegisterForm.tsx:21 `isValidEmail = (email) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email)`. Backend register.dto.ts:15: `@IsEmail({})` (class-validator IsEmail uses validator.js which accepts internationalized emails with more permissive rules). Frontend regex rejects some valid RFC 5321 emails that backend accepts (e.g., emails with + aliasing and long TLDs may have edge cases). WARN: the frontend regex `/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/` requires minimum 2-char TLD suffix — backend @IsEmail() has no such explicit minimum TLD constraint. This can reject technically valid emails the backend would accept, causing a confusing UX where frontend blocks but backend would succeed."
    expected: "Frontend email regex is equivalent to or more permissive than backend @IsEmail() validator."
    actual: "Frontend regex enforces 2-char minimum TLD (`[^\\s@]{2,}`) not present in backend @IsEmail(). Edge case mismatch: new TLDs with non-standard formats could fail frontend validation while passing backend."
    recommendation: "Either align frontend regex with class-validator's IsEmail behavior (use the same validator.js isEmail function via import) or document the intentional stricter frontend rule in validation.ts. The gap is edge-case only and has no security impact (backend validates independently), but could frustrate users with unusual email addresses."
  - check_id: FE-26
    requirement: Accessibility on auth forms — aria-live, label association, focus management, keyboard navigation
    verdict: PASS
    severity: MEDIUM
    standard: WCAG 2.1 AA
    evidence: "Input.tsx:88-94: label element with htmlFor={inputId} for all labelled inputs. Input.tsx:114-115: aria-invalid={!!error} + aria-describedby={error ? `${inputId}-error` : undefined}. Input.tsx:124: aria-label on show/hide password toggle. LoginForm.tsx:251: `aria-live='polite'` on error container. LoginForm.tsx:286: `aria-label='Sign in with passkey'` on passkey button. RegisterForm.tsx:145: `aria-live='polite'`. MfaTotpStep.tsx:96, 170, 194: aria-live='polite' + htmlFor='totp-digit-0' label association for TOTP input. MfaSetupStep.tsx:174: aria-label on copy button; line 298: htmlFor='setup-digit-0'; line 310: aria-live='polite'. ResetPasswordForm.tsx:154: aria-live='polite'. ChangePasswordForm.tsx:133: `role='alert' aria-live='polite'` on localError. ActiveSessions.tsx:289: `role='alert' aria-live='polite'` on load error. All form inputs use autoFocus for focus management on step transitions."
  - check_id: FE-27
    requirement: "(Phase 9b) Login OK redirects to dashboard"
    verdict: N/A
    severity: HIGH
    standard: ISO 25010
    evidence: "Phase 9b Playwright E2E infrastructure tracked in SCRUM-350, not yet implemented per audit-standards.mdc §Phase 9b notes."
  - check_id: FE-28
    requirement: "(Phase 9b) Login with wrong password shows correct error"
    verdict: N/A
    severity: HIGH
    standard: ISO 25010
    evidence: "Phase 9b Playwright E2E infrastructure tracked in SCRUM-350, not yet implemented per audit-standards.mdc §Phase 9b notes."
  - check_id: FE-29
    requirement: "(Phase 9b) Non-registered email shows same toast as wrong password (anti-enumeration)"
    verdict: N/A
    severity: CRITICAL
    standard: ISO 25010
    evidence: "Phase 9b Playwright E2E infrastructure tracked in SCRUM-350, not yet implemented per audit-standards.mdc §Phase 9b notes."
  - check_id: FE-30
    requirement: "(Phase 9b) Locked account shows 'Invalid credentials' without revealing lockout"
    verdict: N/A
    severity: CRITICAL
    standard: ISO 25010
    evidence: "Phase 9b Playwright E2E infrastructure tracked in SCRUM-350, not yet implemented per audit-standards.mdc §Phase 9b notes."
  - check_id: FE-31
    requirement: "(Phase 9b) Throttler trip shows countdown + first/repeat toast escalation"
    verdict: N/A
    severity: HIGH
    standard: ISO 25010
    evidence: "Phase 9b Playwright E2E infrastructure tracked in SCRUM-350, not yet implemented per audit-standards.mdc §Phase 9b notes."
  - check_id: FE-32
    requirement: "(Phase 9b) Genuine session-expired triggers toast and redirect"
    verdict: N/A
    severity: CRITICAL
    standard: ISO 25010
    evidence: "Phase 9b Playwright E2E infrastructure tracked in SCRUM-350, not yet implemented per audit-standards.mdc §Phase 9b notes."
---

# Fase 9: FRONTEND-BACKEND INTEGRATION — auth

**Date**: 2026-05-14 16:58 UTC
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP ASVS V8.2 (Client-side Data Protection), WCAG 2.1 AA (Accessibility), SOC 2 CC6.1 (Logical Access)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 22    |
| FAIL    | 0     |
| WARN    | 4     |
| N/A     | 6     |

**Overall**: WARN

---

## Detailed Findings

### FE-01: Endpoint coverage
- **Verdict**: WARN
- **Severity**: HIGH
- **Evidence**: All 44+ backend auth endpoints are covered by frontend calls. One dead-code gap: `getLinkedProviders()` in `nexacore-dashboard/src/lib/oauth-api.ts:15` calls `GET /users/me/oauth` but `ConnectedAccounts.tsx` reads `user.oauthProviders` from AuthContext instead. The endpoint is callable but never invoked by the UI.
- **Expected**: Every frontend-defined API function is actively called by a UI component, or removed.
- **Actual**: `oauth-api.ts:15 getLinkedProviders()` is dead code — `ConnectedAccounts.tsx` derives provider state from `user.oauthProviders` (populated via `GET /auth/me`), not a dedicated OAuth list fetch.
- **Recommendation**: Remove `getLinkedProviders()` from `oauth-api.ts` (dead code cleanup), or call it from `ConnectedAccounts.tsx` on mount to keep the list fresh after linking without relying on a full `refreshSession()`.
- **Standard**: SOC 2 CC6.1

---

### FE-02: Auth headers
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `api.ts:59`: `Authorization: \`Bearer ${this.accessToken}\`` injected on every request where `accessToken` is non-null. `api.ts:137`: re-injected after silent refresh on retry. FormData uploads retain Authorization while omitting Content-Type (correct multipart behavior).
- **Standard**: OWASP ASVS V8.2

---

### FE-03: CSRF integration
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `api.ts:13`: `CSRF_METHODS = Set(['POST','PUT','PATCH','DELETE'])`. `api.ts:65-69`: `X-CSRF-Token` header set from `getCsrfToken()` for all mutating requests. `csrf.ts:13`: token fetched from `GET /auth/csrf-token` with `credentials: include`. `api.ts:89-130`: 403 CSRF-error handler clears token, re-fetches, and retries once. Logout (`AuthContext.tsx:567`) and refresh (`AuthContext.tsx:225`) also explicitly pass CSRF tokens.
- **Standard**: OWASP ASVS V8.2

---

### FE-04: Token refresh
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `api.ts:134`: 401 triggers `silentRefresh()` except for endpoints in `SKIP_REFRESH_ON_401`. `api.ts:260`: promise dedup via `if (this.refreshPromise) return this.refreshPromise`. `api.ts:169-174`: on refresh failure: token cleared, `onAuthFailure` called once (guarded by `authFailureTriggered`), `SessionExpiredError` thrown. `AuthContext.tsx:289-294`: `handleAuthFailure()` shows toast, dispatches LOGOUT, calls `router.replace('/login')`.
- **Standard**: OWASP ASVS V8.2

---

### FE-05: MFA login flow
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `AuthContext.tsx:391-397`: `isMfaResponse()` dispatches `MFA_REQUIRED`. `LoginForm.tsx:181-182`: renders `MfaTotpStep`. `MfaTotpStep.tsx`: 6-digit TOTP input, recovery code fallback toggle (line 26), "Trust this device for 30 days" checkbox (line 103). `AuthContext.tsx:583-628`: `verifyMfaLogin()` → `POST /auth/mfa/verify-login`.
- **Standard**: SOC 2 CC6.1

---

### FE-06: MFA setup
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `MfaSetup.tsx:57-77`: `handleSetup()` → `POST /auth/mfa/setup` (QR + secret + recovery codes). `MfaSetup.tsx:79-99`: `submitVerifyCode()` → `POST /auth/mfa/verify-setup`. `MfaSetup.tsx:102-131`: `handleDisable()` → `DELETE /auth/mfa` (password-gated). `MfaSetup.tsx:134-159`: `handleRegenerate()` → `POST /auth/mfa/recovery-codes` (password-gated). `MfaSetup.tsx:36-43`: `fetchStatus()` → `GET /auth/mfa/status`.
- **Standard**: SOC 2 CC6.1

---

### FE-07: Passkey registration
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `PasskeyManager.tsx:124-504`: registration UI with password-confirmation modal. `passkey-api.ts:11-28`: wraps `POST /auth/passkeys/register/options` and `POST /auth/passkeys/register/verify`. `usePasskey` hook calls `@simplewebauthn/browser` `startRegistration`. Rate-limit detection and banner present (`PasskeyManager.tsx:193-204`).
- **Standard**: OWASP ASVS V8.2

---

### FE-08: Passkey login
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `LoginForm.tsx:84-91`: Conditional UI (passkey autofill) started on mount via `startConditionalUI()`. `LoginForm.tsx:276-295`: "Sign in with passkey" button (`aria-label` set, line 286) calls `loginWithPasskey()`. `AuthContext.tsx:539-563`: `passkeyLogin()` → `POST /auth/passkeys/login/verify`.
- **Standard**: OWASP ASVS V8.2

---

### FE-09: Passkey management
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `PasskeyManager.tsx:165-171`: `fetchPasskeys()` on mount. Rename modal → `PATCH /auth/passkeys/:id` (`passkey-api.ts:56`). Delete modal (password required) → `DELETE /auth/passkeys/:id` (`passkey-api.ts:64`). Max-10 enforcement in UI (line 379). `DevicesPanel.tsx:8`: renders `PasskeyManager` + `TrustedDevices` side by side.
- **Standard**: SOC 2 CC6.1

---

### FE-10: Trusted device fingerprint
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `fingerprint.ts:1`: `@fingerprintjs/fingerprintjs` loaded. `AuthContext.tsx:371-373`: fingerprint computed on mount, stored via `apiClient.setDeviceFingerprint(fp)`. `api.ts:60-62`: `X-Device-Fingerprint` header injected on all requests. Fail-open on error (fingerprint.ts comment).
- **Standard**: SOC 2 CC6.1

---

### FE-11: Trust device after MFA
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `MfaTotpStep.tsx:103-108`: "Trust this device for 30 days" Checkbox in both TOTP and recovery flows. `AuthContext.tsx:595-597`: `trustDevice` boolean passed to `POST /auth/mfa/verify-login` body. `TrustedDevices.tsx:115-143`: separate "Trust This Device" button in profile also calls `POST /auth/trusted-devices`.
- **Standard**: SOC 2 CC6.1

---

### FE-12: Trusted device management
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `TrustedDevices.tsx:88-95`: `fetchDevices()` on mount. Individual revoke: `DELETE /auth/trusted-devices/:id` with password modal. Revoke-all: `DELETE /auth/trusted-devices` with password modal. `RateLimitBanner` shown on 429 (`TrustedDevices.tsx:348-357`).
- **Standard**: SOC 2 CC6.1

---

### FE-13: Session management
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `ActiveSessions.tsx:117-130`: `GET /auth/sessions` on mount + focus/visibilitychange refresh. Individual revoke: `DELETE /auth/sessions/:id` with password confirmation modal. Revoke-all: `POST /auth/logout-all` with password, followed by `logout()` to clear local state. Current session badge (line 326-332). `stalenessClass()` color cue for stale sessions (line 82-89).
- **Standard**: SOC 2 CC6.1

---

### FE-14: Account lockout UX
- **Verdict**: WARN
- **Severity**: HIGH
- **Evidence**: Countdown timer via `RateLimitBanner` is present for both throttle and lockout cases. `AuthContext.tsx:183`: `lockoutLevel` field defined in `ApiError` type. `api.ts:241-244`: `retryAfter` parsed from `Retry-After` header. However, `lockoutLevel` is never read after parsing — `detectRateLimitKind()` (`AuthContext.tsx:187-189`) uses only `ERROR_CODE.FORBIDDEN` vs non-FORBIDDEN to distinguish, and the UI shows an identical countdown banner in both cases.
- **Expected**: lockoutLevel drives differentiated UX between throttle (temporary rate limit) and account lockout (credentials locked).
- **Actual**: lockoutLevel is parsed but silently discarded; UX is identical for both scenarios.
- **Recommendation**: Surface `lockoutLevel` in `RateLimitBanner` copy or via a distinct toast variant when kind==='lockout'. Avoids user confusion about whether to wait (throttle) or contact support (hard lockout). No security impact — backend already hides lockout behind generic "Invalid credentials" (SCRUM-217).
- **Standard**: SOC 2 CC6.1

---

### FE-15: Rate limit UX
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `api.ts:240-245`: `Retry-After` header parsed into `body.error.retryAfter` for 429+401 responses. `LoginForm.tsx:154-168`: FIRST vs REPEAT toast differentiation using `throttleWindowEndsAtRef`. `RegisterForm.tsx:74-82`: same pattern. `RateLimitBanner` with countdown renders in all auth forms.
- **Standard**: OWASP ASVS V8.2

---

### FE-16: Change email
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `ChangeEmailForm.tsx:40-57`: `requestEmailChange(newEmail, password)` → `POST /users/me/email`. OAuth-only guard shown for users without password. `verify-email-change/page.tsx:22-24`: `POST /auth/verify-email-change` on mount with URL token. Success page informs user all sessions were revoked.
- **Standard**: SOC 2 CC6.1

---

### FE-17: Delete account
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `DeleteAccount.tsx:38-67`: `deleteAccount(password)` → `DELETE /users/me`. Requires "DELETE" confirmation text + password. SUPERADMIN accounts disabled with explanation. `logout()` + `router.push('/login')` on success.
- **Standard**: SOC 2 CC6.1

---

### FE-18: Unlink OAuth
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `ConnectedAccounts.tsx:154-158`: last-auth-method guard prevents lockout. `handleUnlink()` → `DELETE /users/me/oauth/:provider` via `unlinkOAuth()`. `handleConnect()` → `POST /auth/link/code` then redirect to `/auth/link/:provider?link_code=`. Password confirmation required for disconnect.
- **Standard**: SOC 2 CC6.1

---

### FE-19: Password management
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `ChangePasswordForm.tsx:44`: `PATCH /users/me/password`. `AuthContext.tsx:673`: `forgotPassword()` → `POST /auth/forgot-password`. `AuthContext.tsx:706`: `resetPassword()` → `POST /auth/reset-password`. `AuthContext.tsx:765`: `validateResetToken()` → `POST /auth/validate-reset-token`. `validation.ts`: `PASSWORD_MIN_LENGTH=8`, `PASSWORD_MAX_LENGTH=128` (documented as matching backend DTOs).
- **Standard**: SOC 2 CC6.1

---

### FE-20: OAuth flow
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `OAuthButtons.tsx:11,21`: full-page redirect to `GET /auth/google` and `GET /auth/github`. `app/auth/callback/page.tsx` + `OAuthCallbackHandler.tsx`: OAuth landing page. `AuthContext.tsx:475-537`: `handleOAuthCallback()` → `POST /auth/oauth/exchange` with `oauthAction` toast variants ('created', 'auto-verified', 'linked').
- **Standard**: SOC 2 CC6.1

---

### FE-21: Email verification
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `VerifyEmailStatus.tsx:21`: `POST /auth/verify-email`. `ProtectedRoute.tsx:23-26`: unverified users redirected to `/activation/check-email`. `AuthContext.tsx:735-760`: `resendVerification()` → `POST /auth/resend-verification`. `AuthContext.tsx:777-789`: `resendVerificationPublic()` → `POST /auth/resend-verification-public`.
- **Standard**: SOC 2 CC6.1

---

### FE-22: Route guards
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `ProtectedRoute.tsx`: unauthenticated → `/login`; verified check → `/activation/check-email`. `GuestRoute.tsx`: authenticated → `/dashboard`. `AdminRoute.tsx`: wraps `ProtectedRoute` + role check (`ADMIN` or `SUPERADMIN`). `PermissionRoute.tsx`: fine-grained RBAC. All guards wait for `isInitialized` before redirecting to prevent flash of wrong state.
- **Standard**: SOC 2 CC6.1

---

### FE-23: Security headers
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `proxy.ts:4`: `generateNonce()` via `crypto.getRandomValues()`. CSP set with `nonce-${nonce}` + `strict-dynamic` (prod) / `unsafe-eval` (dev-only). `frame-ancestors 'none'` (clickjacking), `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`. Nonce forwarded via `x-nonce` request header for server components.
- **Standard**: OWASP ASVS V8.2

---

### FE-24: Error boundaries
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: Next.js route-level `error.tsx` files exist for `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/verify-email-change`, `/profile` — all render `AuthErrorFallback`. However, these boundaries only catch SSR render errors. Client-side rendering errors inside `MfaTotpStep`, `PasskeyManager`, and `OAuthCallbackHandler` (all `"use client"`) are handled via `try/catch` in event handlers but not wrapped in a declarative React `ErrorBoundary` — a React render-phase exception in these trees would produce a white screen.
- **Expected**: Client-side React ErrorBoundary wrapping MFA, passkey, and OAuth callback component trees.
- **Actual**: Event-handler errors are caught; React render-phase errors in client components are not bounded.
- **Recommendation**: Add a lightweight `<ErrorBoundary fallback={<AuthErrorFallback />}>` wrapper around `MfaTotpStep`, `MfaSetupStep`, and `PasskeyManager` in their respective parent render locations. The `AuthErrorFallback` component already exists and is appropriate for this purpose.
- **Standard**: SOC 2 CC6.1

---

### FE-25: Form validation consistency
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: Password: `validation.ts:2-4` matches backend `register.dto.ts:23-24` exactly (`@MinLength(8) @MaxLength(128)`). Email: frontend `RegisterForm.tsx:21` uses `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` — requires ≥2-char TLD suffix. Backend `register.dto.ts:15` uses `@IsEmail()` (class-validator / validator.js) which has different TLD acceptance rules and no explicit minimum TLD length. Edge-case mismatch: unusual TLD formats valid per class-validator may fail the frontend regex.
- **Expected**: Frontend email validation is equivalent to or more permissive than `class-validator @IsEmail()`.
- **Actual**: Frontend adds an implicit 2-char minimum TLD constraint not present in the backend validator. Gap is edge-case only with no security impact.
- **Recommendation**: Import `isEmail` from `validator` (already a transitive dependency via class-validator) in `validation.ts` and use it client-side, or document the intentional stricter rule. Prevents subtle "email valid on server, rejected on client" UX edge cases.
- **Standard**: OWASP ASVS V8.2

---

### FE-26: Accessibility on auth forms
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `Input.tsx:88-94`: `<label htmlFor={inputId}>` for all inputs with `label` prop. `Input.tsx:114-115`: `aria-invalid` + `aria-describedby` on error state. `Input.tsx:124`: `aria-label` on password-toggle button. All auth forms have `aria-live="polite"` regions for error messages: `LoginForm.tsx:251`, `RegisterForm.tsx:145`, `MfaTotpStep.tsx:96,194`, `MfaSetupStep.tsx:310`, `ResetPasswordForm.tsx:154`. `ChangePasswordForm.tsx:133`: `role="alert" aria-live="polite"`. `ActiveSessions.tsx:289`: `role="alert" aria-live="polite"` on load error. `autoFocus` used for focus management on form step transitions. Passkey button has explicit `aria-label` (`LoginForm.tsx:286`).
- **Standard**: WCAG 2.1 AA

---

### FE-27 through FE-32: Phase 9b Playwright E2E Tests
- **Verdict**: N/A (×6)
- **Justification**: Phase 9b Playwright E2E infrastructure tracked in SCRUM-350, not yet implemented per audit-standards.mdc §Phase 9b notes. All six checks (FE-27 through FE-32) are deferred pending SCRUM-350 delivery. FE-32 additionally requires SCRUM-347 backend deny-list for deterministic session expiry testing.

---

## Recommendations

1. **FE-01 (WARN)**: Remove dead `getLinkedProviders()` from `nexacore-dashboard/src/lib/oauth-api.ts` or actively call it in `ConnectedAccounts.tsx` to keep the OAuth provider list fresh without depending on `refreshSession()`. ~10-minute cleanup.

2. **FE-14 (WARN)**: Read `lockoutLevel` from `errObj.error.lockoutLevel` in `AuthContext.tsx:detectRateLimitKind()` and pass it downstream to `RateLimitBanner` or a distinct toast copy when kind==='lockout'. No security impact — purely a UX clarity improvement for hard-locked accounts vs rate-throttled logins.

3. **FE-24 (WARN)**: Wrap `MfaTotpStep`, `MfaSetupStep`, and `PasskeyManager` in a declarative React `ErrorBoundary` using `AuthErrorFallback` as the fallback. The existing component is ready; only a thin boundary wrapper is needed. Closes the white-screen risk from WebAuthn API incompatibilities in render phase.

4. **FE-25 (WARN)**: Align email validation in `nexacore-dashboard/src/lib/validation.ts` with `class-validator`'s `isEmail()` by importing from the `validator` package (already a transitive dependency). Prevents edge-case TLD rejections on the frontend that the backend would accept.
