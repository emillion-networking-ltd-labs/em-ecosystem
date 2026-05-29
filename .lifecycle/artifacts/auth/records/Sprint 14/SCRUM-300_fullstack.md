# SCRUM-300 — Implementation Record

## Ticket
**Summary**: Restore resend verification email with CWE-203 safe approach
**Sprint**: 14 — UI Foundation
**Status**: Done
**Commits**: 755066b, 74c172c, ab201f4
**PR**: #180 (merged 2026-03-28) + direct-to-main fixes (2026-03-29)

## Changes (6 files total across 3 commits)

| File | Change |
|------|--------|
| `nexacore-api/src/auth/login.service.ts` | Removed silent auto-send verification email from login flow (email bombing vector). |
| `nexacore-api/src/auth/password-reset.service.ts` | forgotPassword: removed `!passwordHash` guard — now sends reset email for all accounts including OAuth-only (Firebase/Notion model). resetPassword: sets `emailVerified: true` in transaction — password reset via email proves inbox ownership, implicitly activates unverified accounts. |
| `nexacore-dashboard/src/components/auth/LoginForm.tsx` | Removed inline resend verification code (loginFailed state, resendCooldown, handleResendVerification, CountdownTimer). Login errors show only toast + "Forgot password?" — matches Google/GitHub/Microsoft pattern. |
| `nexacore-dashboard/src/context/AuthContext.tsx` | AUTH_ERROR dispatch reverted to AUTH_STOP (error shown via toast only, not inline). Login catch re-throws for caller awareness. |
| `nexacore-dashboard/src/app/resend-verification/page.tsx` | DELETED — replaced by universal forgot-password flow. |
| `nexacore-dashboard/src/components/auth/ResendVerificationForm.tsx` | DELETED — replaced by universal forgot-password flow. |

## Security
- CWE-203 compliant: login error is always "Invalid credentials" via toast
- No auto-send on login eliminates email bombing vector
- forgotPassword: same response regardless of account state (CWE-203)
- resetPassword: email link proves inbox ownership → safe to activate account
- "Forgot password?" serves as universal recovery (unverified, OAuth-only, normal)

## Deviations
- **Accepted-Quality**: Initial implementation had /resend-verification page + inline resend button. Removed after UX testing — "Forgot password?" covers all scenarios per Google/GitHub/Microsoft model. No code lost (endpoint `resend-verification-public` preserved in backend for future use).
