# Fase 9: FRONTEND-BACKEND — Auth

**Date**: 2026-03-12 02:40
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: ISO 25010 §4.2.5, CWE-602, OWASP ASVS V13

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 20    |
| FAIL    | 1     |
| WARN    | 5     |
| N/A     | 0     |

**Overall**: FAIL (1 FAIL, 5 WARN)

---

## Detailed Findings

### FE-01: All spec endpoints called
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 38/39 spec endpoints have corresponding frontend calls. `DELETE /auth/admin/users/:id` not called from any frontend component (admin feature not yet built).

### FE-02: HTTP methods match spec
- **Verdict**: PASS
- **Evidence**: All frontend API calls use correct HTTP methods matching api-spec.yml.

### FE-03: Request DTOs match spec schemas
- **Verdict**: PASS
- **Evidence**: All request payloads align with backend DTO validation schemas.

### FE-04: Response types match spec schemas
- **Verdict**: PASS
- **Evidence**: Frontend TypeScript types match backend response shapes.

### FE-05: Auth header sent on protected endpoints
- **Verdict**: PASS
- **Evidence**: Axios interceptor attaches Bearer token on all authenticated requests. Cookie-based refresh handled automatically.

### FE-06: Error codes handled
- **Verdict**: PASS
- **Evidence**: 401 triggers token refresh, 403 shows access denied, 429 shows rate limit message, 500 shows generic error.

### FE-07: Loading states
- **Verdict**: PASS
- **Evidence**: All auth forms show loading spinners during API calls.

### FE-08: Optimistic updates
- **Verdict**: PASS
- **Evidence**: No optimistic updates in auth module (correct — auth operations require server confirmation).

### FE-09: CSRF token flow
- **Verdict**: PASS
- **Evidence**: CSRF token fetched on app init, sent as `x-csrf-token` header on all state-changing requests.

### FE-10: Token refresh flow
- **Verdict**: PASS
- **Evidence**: 401 interceptor retries with refreshed token. Concurrent requests queued during refresh.

### FE-11: Trusted device prompt
- **Verdict**: FAIL
- **Severity**: HIGH
- **Evidence**: MFA verification flow (`mfa-verify` step) does not include "Trust this device" checkbox. Backend endpoint `POST /auth/mfa/verify` accepts `trustDevice` boolean but frontend never sends it. `TrustedDeviceService` fully implemented on backend but unused from frontend.
- **Expected**: "Trust this device" prompt during MFA verification
- **Actual**: No UI element to trigger trusted device flow
- **Standard**: ISO 25010 §4.2.5

### FE-12: OAuth callback handling
- **Verdict**: PASS
- **Evidence**: OAuth callback page extracts code from URL, exchanges via backend, handles errors.

### FE-13: Passkey registration flow
- **Verdict**: PASS
- **Evidence**: WebAuthn credential creation options fetched from backend, navigator.credentials.create called, attestation sent back.

### FE-14: Passkey authentication flow
- **Verdict**: PASS
- **Evidence**: WebAuthn assertion options fetched, navigator.credentials.get called, assertion verified by backend.

### FE-15: Session management UI
- **Verdict**: PASS
- **Evidence**: Active sessions listed with device info, revoke individual and revoke-all functional.

### FE-16: Password reset flow
- **Verdict**: PASS
- **Evidence**: Forgot password → email sent → token validated → new password set. Full flow works.

### FE-17: Email verification flow
- **Verdict**: PASS
- **Evidence**: Verify email page reads token from URL, calls backend, shows success/error.

### FE-18: MFA setup flow
- **Verdict**: PASS
- **Evidence**: QR code displayed from backend TOTP secret, verification code submitted, recovery codes shown.

### FE-19: Account linking UI
- **Verdict**: PASS
- **Evidence**: Connected accounts page shows linked providers, link/unlink buttons functional.

### FE-20: Form validation alignment
- **Verdict**: PASS
- **Evidence**: Frontend validation rules match backend DTO constraints for all auth forms.

### FE-21: Rate limit feedback
- **Verdict**: PASS
- **Evidence**: 429 responses show user-friendly "Too many attempts" message with retry guidance.

### FE-22: Logout flow
- **Verdict**: PASS
- **Evidence**: Logout calls backend, clears local tokens, redirects to login.

### FE-23: Route protection
- **Verdict**: PASS
- **Evidence**: Auth middleware redirects unauthenticated users. Protected routes check session validity.

### FE-24: Error boundaries
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: No React ErrorBoundary wrapping auth components. Unhandled render errors show blank screen.

### FE-25: Password strength enforcement
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: Frontend shows password strength indicator but does not enforce minimum length before submit. Backend rejects, but UX could prevent invalid submissions.

### FE-26: Accessibility
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: Auth forms missing some aria-labels on icon buttons. Tab order generally correct. No screen reader testing performed.

---

## Recommendations

1. **FE-11** (FAIL): Add "Trust this device" checkbox to MFA verification step. Wire `trustDevice: true` to `POST /auth/mfa/verify` request body. Backend already supports it.
2. **FE-24** (WARN): Wrap auth page components in React ErrorBoundary with fallback UI.
3. **FE-25** (WARN): Add client-side minimum length check (8 chars) to prevent unnecessary server round-trips.
4. **FE-26** (WARN): Add aria-labels to all interactive elements in auth forms. Run axe-core audit.
