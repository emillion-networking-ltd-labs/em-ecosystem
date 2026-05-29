# SCRUM-302 — Implementation Record

## Ticket
**Summary**: Send welcome email on first account activation
**Sprint**: 14 — UI Foundation
**Status**: Done
**Commit**: 7d5ba88
**PR**: #182 (merged 2026-03-29)

## Changes (7 files, 114 insertions)

| File | Change |
|------|--------|
| `src/mail/templates/welcome.hbs` | NEW: Responsive HTML welcome email template (matches existing style) |
| `src/mail/mail.service.ts` | New `sendWelcomeEmail(email, firstName)` method |
| `src/auth/email-verification.service.ts` | After verifyEmail transaction → send welcome email |
| `src/auth/password-reset.service.ts` | `wasUnverified` check before transaction, send welcome after if true |
| `src/users/users.service.ts` | Welcome email on OAuth auto-verify (paths A, B) and new user creation (path C) |
| `src/users/tests/users.service.spec.ts` | Added `sendWelcomeEmail` mock |
| `src/auth/tests/auth-test.helpers.ts` | Added `sendWelcomeEmail` mock to shared test helpers |

## Welcome Email Trigger Matrix

| Scenario | emailVerified before | after | Welcome email? |
|---|---|---|---|
| Email verification link | false | true | YES |
| Password reset (unverified account) | false | true | YES |
| Password reset (verified account) | true | true | NO |
| OAuth auto-verify (Step 1 re-login) | false | true | YES |
| OAuth auto-verify (Step 2 first link) | false | true | YES |
| OAuth new user creation | N/A (new) | true | YES |
| OAuth normal login | true | true | NO |

## Deviations
None
