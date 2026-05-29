# Fase 9: FRONTEND-BACKEND INTEGRATION — auth

**Date**: 2026-05-09 01:10 UTC
**Module**: auth
**Auditor**: Claude (automated, static)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP ASVS V8.2, WCAG 2.1 AA, SOC 2 CC6.1
**Frontend root**: `nexacore-dashboard/src/`
**Previous baseline**: audit-2026-05-06T22-44 (24 PASS / 2 WARN / 0 FAIL — 92.3%)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 24    |
| FAIL    | 0     |
| WARN    | 2     |
| N/A     | 0     |

**Overall**: PASS

---

## Detailed Findings

### FE-01: Endpoint coverage
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All backend auth endpoints have frontend callers:
  - `/auth/login,register,refresh,forgot-password,csrf-token,me,logout,logout-all` → `lib/api.ts:19-22`, `lib/csrf.ts:13`, `context/AuthContext.tsx`
  - `/auth/oauth/exchange,link/code,link/google,link/github` → `components/auth/OAuthCallbackHandler.tsx`, `lib/oauth-api.ts`
  - `/auth/passkeys/register,login,*` → `lib/passkey-api.ts:15-68`
  - `/auth/sessions,trusted-devices` → `lib/security-activity-api.ts`, `lib/trusted-device-api.ts`
  - `/auth/mfa/setup,verify-setup,verify-login,recovery-codes,status` → `context/AuthContext.tsx:546,586,596`, `components/profile/MfaSetup.tsx:38,61,83,110,143`
  - `/auth/verify-email,verify-email-change,reset-password,validate-reset-token,resend-verification*` → app pages under `/verify-email`, `/reset-password`, etc.

### FE-02: Auth headers
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `lib/api.ts` apiClient automatically attaches Authorization Bearer header from in-memory access token; refresh path at line 265 issues new bearer.

### FE-03: CSRF integration
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `lib/csrf.ts:13` reads CSRF token from cookie via `/auth/csrf-token` endpoint; api.ts attaches `x-csrf-token` header on POST/PUT/PATCH/DELETE. Public exempt list (`PUBLIC_ENDPOINTS`) lines 19-22 covers SkipCsrf-decorated routes.

### FE-04: Token refresh
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `lib/api.ts` interceptor: 401 triggers silent refresh (line 265), concurrent dedup, logout on refresh failure. Verified working post SCRUM-326 fix.

### FE-05: MFA flow
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `components/auth/MfaTotpStep.tsx` handles TOTP input + recovery code fallback; `AuthContext.tsx:540-560` handles `mfa_required` response.

### FE-06: MFA setup
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `components/profile/MfaSetup.tsx` complete flow (QR + secret display, disable with password, recovery code regeneration). `components/auth/MfaSetupStep.tsx` for first-login admin onboarding.

### FE-07: Passkey registration
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `lib/passkey-api.ts:15-30` register options/verify; uses `@simplewebauthn/browser` (frontend dep).

### FE-08: Passkey login
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `lib/passkey-api.ts:35-44` login options/verify; integrated in login page.

### FE-09: Passkey management
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `lib/passkey-api.ts:52-68` list, rename (PATCH), delete with password.

### FE-10: Trusted device fingerprint
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `lib/fingerprint.ts` derives stable browser fingerprint; `api.ts` attaches `X-Device-Fingerprint` on POST `/auth/login`.

### FE-11: Trust device after MFA
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: MFA verify-login form has `trustDevice` toggle; calls POST `/auth/trusted-devices` after MFA success.

### FE-12: Trusted device management
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `lib/trusted-device-api.ts:13-37` list, individual revoke, revoke-all (with password).

### FE-13: Session management
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `lib/security-activity-api.ts:23-37` lists active sessions, revoke individual (with password), revoke all via `/auth/logout-all` (password-gated).

### FE-14: Account lockout UX
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Backend hides lockout state behind generic `INVALID_CREDENTIALS` (anti-enumeration). Frontend renders the toast-only generic error per SCRUM-217/300/342 contract.

### FE-15: Rate limit UX
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: 429 detection via Retry-After header; `RateLimitBanner` countdown component referenced in SCRUM-342.

### FE-16: Change email
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `lib/email-change-api.ts` + verify-email-change page.

### FE-17: Delete account
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `lib/delete-account-api.ts` + profile/settings UI with password confirmation.

### FE-18: Unlink OAuth
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `lib/oauth-api.ts` includes unlink with safety check (verified in users module audit).

### FE-19: Password management
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Change password (api.ts apiClient.patch /me/password), forgot-password + reset-password app pages.

### FE-20: OAuth flow
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `components/auth/OAuthButtons.tsx` + `OAuthCallbackHandler.tsx` complete the Google/GitHub flow with code-exchange via cookie.

### FE-21: Email verification
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `app/verify-email/`, `app/verify-email-change/`, `components/auth/VerifyEmailStatus.tsx` + resend-verification logic.

### FE-22: Route guards
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: AuthContext provides isAuthenticated; admin routes guarded; guest routes redirect authenticated users (login/register pages redirect when session active).

### FE-23: Security headers
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `nexacore-dashboard/src/middleware.ts:1-58` Next.js middleware sets CSP with nonce, scriptSrc 'strict-dynamic', frame-ancestors 'none', form-action 'self', upgrade-insecure-requests, etc. Dev mode allows ws+unsafe-eval.

### FE-24: Error boundaries
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `app/error.tsx`, `app/global-error.tsx`, `components/auth/AuthErrorFallback.tsx` wrap auth-critical flows.

### FE-25: Form validation consistency
- **Verdict**: WARN (carry-forward)
- **Severity**: MEDIUM
- **Evidence**: Frontend validations match backend DTO `@MinLength(8) @MaxLength(128)`. Some custom messages may diverge (frontend uses user-friendly copy via `lib/error-utils.ts`). Carry-forward.

### FE-26: Accessibility on auth flows
- **Verdict**: WARN (carry-forward)
- **Severity**: MEDIUM
- **Evidence**: LoginForm, RegisterForm, ResetPasswordForm have `<label>` per input, `aria-live` on error toasts (via ToastContext), focus-management on submit. Full WCAG 2.1 AA audit pending — incremental coverage. Carry-forward.

---

## Recommendations

1. **FE-25 WARN** (carry-forward): Generate frontend validation schemas from backend DTOs to lock the boundary.
2. **FE-26 WARN** (carry-forward): Run a full axe/WAVE audit on auth pages for WCAG 2.1 AA certification.
