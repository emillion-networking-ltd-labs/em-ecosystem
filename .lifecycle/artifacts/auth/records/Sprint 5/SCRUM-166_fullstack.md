# Implementation Record: SCRUM-166 Cloudflare Turnstile CAPTCHA + Lockout Email Notification

## Summary

Integrated Cloudflare Turnstile (managed mode) on 4 public auth endpoints to filter bot traffic. Added account-locked email notification with unlock time and password reset link. Fixed password reset unlocking the account. Fixed pre-existing validateResetToken GET/POST mismatch. Fixed OAuth callback race condition.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-166-fullstack`
- **PR**: #49
- **Date**: 2026-03-10

## Plan Reference

No formal plan — ticket was created and implemented in the same sprint as a security hardening measure.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `e9ce4ce` | feat(SCRUM-166): add Cloudflare Turnstile CAPTCHA to auth forms and lockout email notification | 22 files (see below) |

### Key files changed

**Backend (nexacore-api)**:
- `src/security/turnstile.service.ts` — NEW: Cloudflare siteverify API client
- `src/security/turnstile.guard.ts` — NEW: NestJS guard extracting turnstileToken from request body
- `src/security/security.module.ts` — Updated: exports TurnstileService + TurnstileGuard
- `src/auth/auth.controller.ts` — Added `@UseGuards(TurnstileGuard)` to 4 endpoints
- `src/auth/auth.service.ts` — Send lockout email on account lock; unlock account on password reset; fix lockout threshold (`> MAX_FAILED_ATTEMPTS` not `>=`)
- `src/auth/dto/login.dto.ts` — Added optional `turnstileToken` field
- `src/auth/dto/register.dto.ts` — Added optional `turnstileToken` field
- `src/auth/dto/forgot-password.dto.ts` — Added optional `turnstileToken` field
- `src/auth/dto/resend-verification-public.dto.ts` — Added optional `turnstileToken` field
- `src/mail/mail.service.ts` — Added `sendAccountLockedEmail()` with duration formatting
- `src/mail/templates/account-locked.hbs` — NEW: lockout email template
- `.env.example` — Added `TURNSTILE_SECRET_KEY`

**Frontend (nexacore-dashboard)**:
- `src/components/ui/TurnstileWidget.tsx` — NEW: reusable Turnstile component with theme sync + resetKey
- `src/components/auth/LoginForm.tsx` — Integrated TurnstileWidget, added turnstileToken state + resetKey
- `src/components/auth/RegisterForm.tsx` — Integrated TurnstileWidget
- `src/components/auth/ForgotPasswordForm.tsx` — Integrated TurnstileWidget
- `src/context/AuthContext.tsx` — Fixed validateResetToken (GET→POST); skip refreshSession on /auth/callback
- `src/middleware.ts` — CSP: added challenges.cloudflare.com to script-src, connect-src, frame-src
- `package.json` — Added `@marsidev/react-turnstile`

**Tests**:
- `src/auth/tests/auth.controller.spec.ts` — Added TurnstileService mock provider
- `src/auth/tests/auth.service.spec.ts` — Updated lockout mocks (failedAttempts: 5→6), added sendAccountLockedEmail mock

## Deviations from Plan

| # | Item | Detail | Category | Follow-up |
|---|------|--------|----------|-----------|
| 1 | No formal plan existed | Ticket was ad-hoc security hardening | Accepted | — |
| 2 | Added lockout email notification | Not in original ticket scope — user requested during verification | Accepted | Enhances UX |
| 3 | Added account unlock on password reset | Discovered during verification — locked accounts couldn't recover | Accepted | Industry best practice |
| 4 | Fixed validateResetToken GET/POST mismatch | Pre-existing bug blocking password reset flow | Pre-existing | Fixed in this PR (3-line fix) |
| 5 | Fixed OAuth callback race condition | Pre-existing: refreshSession LOGOUT could overwrite OAuth AUTH_SUCCESS | Pre-existing | Fixed in this PR |

## Test Results

- **Unit tests**: 189 passed / 0 failed (auth.service.spec + auth.controller.spec)
- **Manual verification**: Full checklist (15 cases) — all passed:
  - Login: widget visible, submit works, token regenerates, lockout email sent, reset unlocks account, IP throttle works
  - Register: widget visible, submit works, anti-enumeration preserved, rate limit 5/60s
  - Forgot Password: widget visible, submit works, rate limit 3/15min
  - OAuth: Google/GitHub flow unaffected
  - Turnstile theme: syncs with app dark/light mode

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| validateResetToken used GET instead of POST | HIGH | Fixed | Changed `apiClient.get` to `apiClient.post` in AuthContext.tsx |
| OAuth callback race condition (refreshSession vs handleOAuthCallback) | MEDIUM | Fixed | Skip refreshSession when `pathname === '/auth/callback'` |
| CSP blocking Turnstile iframe (`frame-src 'none'`) | HIGH | Fixed | Added `challenges.cloudflare.com` to frame-src, script-src, connect-src |
| DTO whitelist rejecting turnstileToken | HIGH | Fixed | Added `turnstileToken?: string` to 4 DTOs |
| Turnstile `theme: 'auto'` uses OS theme, not app theme | LOW | Fixed | Use `useTheme()` hook to pass dynamic theme |
| Turnstile token single-use: second submit fails | MEDIUM | Fixed | Added `resetKey` prop (React key) to force re-mount |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | SecurityModule exports updated, TurnstileGuard added, AuthController guard chains updated, changelog entry |

## Lessons Learned

- **CSP is a common blocker for third-party widgets** — always check frame-src, script-src, connect-src when adding external services
- **NestJS `forbidNonWhitelisted: true`** rejects any field not declared in the DTO — new body fields must be added to all affected DTOs
- **Turnstile tokens are single-use** — the widget must be re-mounted (via React key) after each form submission
- **Race conditions in auth context** — when multiple async flows (refreshSession, OAuth exchange) dispatch to the same reducer, the last one wins; guard against this by skipping unnecessary flows
- **Password reset should always unlock the account** — the user proved email ownership, which is a stronger auth factor than the password itself
