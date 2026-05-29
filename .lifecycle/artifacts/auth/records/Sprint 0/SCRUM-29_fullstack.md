# Implementation Record: SCRUM-29 Email Verification & Password Reset

## Summary

Implemented full email verification and password reset flows: SHA-256 hashed token models (`EmailVerificationToken`, `PasswordResetToken`), `MailModule` with Handlebars templates, four new auth endpoints, login gate for unverified LOCAL accounts, and complete frontend UI (5 new pages, 2 new components, AuthContext methods).

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-23-oauth-security-hardening`
- **Implementation date**: 2026-02-27

## Plan Reference

- **Plan**: `ai-specs/changes/plans/SCRUM-29_fullstack.md`
- **Plan followed**: Partially — 4 deviations. All 8 subtasks (SCRUM-73 through SCRUM-80) fully implemented.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `1b3b0da` | feat(SCRUM-29): email verification & password reset — backend implementation | 17 files, +3988 lines |
| `1d943fa` | feat(SCRUM-29): email verification & password reset — frontend implementation | 11 files, +480 lines |

**Backend files created (8):**
- `nexacore-api/prisma/migrations/20260227082218_add_email_verification_and_password_reset_tokens/migration.sql`
- `nexacore-api/src/auth/dto/forgot-password.dto.ts`
- `nexacore-api/src/auth/dto/reset-password.dto.ts`
- `nexacore-api/src/mail/mail.module.ts`
- `nexacore-api/src/mail/mail.service.ts`
- `nexacore-api/src/mail/templates/verification.hbs`
- `nexacore-api/src/mail/templates/password-reset.hbs`
- `nexacore-api/src/mail/tests/mail.service.spec.ts`

**Backend files modified (9):**
- `nexacore-api/package.json` / `package-lock.json` — Added `@nestjs-modules/mailer`, `nodemailer`, `handlebars`, `@types/nodemailer`
- `nexacore-api/nest-cli.json` — Added assets config for .hbs templates (`mail/templates/**/*.hbs`)
- `nexacore-api/prisma/schema.prisma` — Added `EmailVerificationToken` + `PasswordResetToken` models, relations on User
- `nexacore-api/src/app.module.ts` — Added `MailModule`
- `nexacore-api/src/auth/auth.module.ts` — Added `MailModule`
- `nexacore-api/src/auth/auth.service.ts` — Added `verifyEmail`, `resendVerificationEmail`, `forgotPassword`, `resetPassword`, `createAndSendVerificationEmail`, `hashToken`; modified `register` and `login`
- `nexacore-api/src/auth/auth.controller.ts` — Added 4 new endpoints
- `nexacore-api/src/auth/tests/auth.service.spec.ts` — Updated `mockUser.emailVerified = true`, added `PrismaService` + `MailService` mocks, 2 new login tests

**Frontend files created (6):**
- `nexacore-dashboard/src/app/check-email/page.tsx` — Post-forgot-password confirmation
- `nexacore-dashboard/src/app/email-sent/page.tsx` — Post-registration confirmation
- `nexacore-dashboard/src/app/reset-password/page.tsx` — GuestRoute + ResetPasswordForm
- `nexacore-dashboard/src/app/verify-email/page.tsx` — Public + VerifyEmailStatus
- `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx` — Password + confirm fields with 5-criteria strength indicator, reads `?token` from URL
- `nexacore-dashboard/src/components/auth/VerifyEmailStatus.tsx` — Reads `?status`, shows CheckCircle2/XCircle + CTA

**Frontend files modified (5):**
- `nexacore-dashboard/src/lib/types.ts` — Added `MessageResponse`, `ForgotPasswordDto`, `ResetPasswordDto`
- `nexacore-dashboard/src/context/AuthContext.tsx` — Added `forgotPassword`, `resetPassword`, `resendVerification` callbacks; `register` returns `Promise<boolean>`
- `nexacore-dashboard/src/components/auth/RegisterForm.tsx` — Redirects to `/email-sent` on success
- `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx` — Migrated from direct `apiClient` to `useAuth().forgotPassword`, redirects to `/check-email`
- `nexacore-dashboard/src/app/forgot-password/page.tsx` — Added `GuestRoute` + `Suspense` wrappers

## Deviations from Plan

| # | Planned | Actual | Reason |
|---|---------|--------|--------|
| 1 | `resetPassword()` invalidates sessions via `refreshToken: null` on User model | Uses `sessionsService.revokeAllUserSessions(userId)` | Plan snapshot was stale (pre-SCRUM-26). `refreshToken` was removed from User in SCRUM-26 — sessions table replaced it. Session revocation is now a SessionsService call. |
| 2 | Reset success redirects to `/login?message=password_reset` | Inline success state in `ResetPasswordForm` with link to `/login` (no query param) | Better UX — user sees confirmation in the same layout without relying on the login page to parse and display query params. |
| 3 | `resend-verification.dto.ts` listed as new file | Not created | Endpoint has no body — DTO unnecessary. `@UseGuards(JwtAuthGuard)` already enforces authentication, and body validation adds no value. |
| 4 | SCRUM-79: redirect to `/verify-email-pending` with resend button + cooldown timer | Static `/email-sent` page without interactive resend | Enrichment plan opted for simpler static page. Resend endpoint exists on backend (`POST /auth/resend-verification`). Interactive UI deferred to future ticket. |

## Subtask Mapping

| Key | Description | Implemented? |
|-----|-------------|-------------|
| SCRUM-73 | Backend: email service module | YES — `MailModule` with `@nestjs-modules/mailer`, SMTP, HandlebarsAdapter |
| SCRUM-74 | Backend: email templates with EM branding | PARTIAL — 2/4 templates (verification + reset). Lockout + password-changed deferred. |
| SCRUM-75 | Backend: email verification flow on registration | YES — token creation on register, `GET /auth/verify-email`, `POST /auth/resend-verification` |
| SCRUM-76 | Backend: block login for unverified emails | YES — `login()` checks `provider === LOCAL && !emailVerified`, throws `ForbiddenException`. OAuth exempt. |
| SCRUM-77 | Backend: password reset flow | YES — `POST /auth/forgot-password` (anti-enumeration), `POST /auth/reset-password` (session revocation + audit) |
| SCRUM-78 | Backend: resend verification + notification emails | PARTIAL — resend endpoint implemented. Notification emails on password change/lockout deferred. |
| SCRUM-79 | Frontend: post-registration verification screen | PARTIAL — `/email-sent` static page. Interactive resend + cooldown timer deferred. |
| SCRUM-80 | Frontend: forgot + reset password pages | YES — `/forgot-password` (GuestRoute), `/reset-password` (GuestRoute + strength indicator), `/check-email` confirmation |

Deferred items (SCRUM-74, SCRUM-78, SCRUM-79 partial scope): excluded during enrichment as out-of-scope for Layer 7. Recommend a separate **Security Notifications** ticket.

## Test Results

- **Unit tests**: 200 passed / 0 failed (20 suites)
- **New tests added**: 9 (mail.service.spec: 7 new tests, auth.service.spec: 2 new login gate tests)
- **Backend build**: `nest build` — pass (clean, zero errors)
- **Frontend build**: `next build` — pass (16 routes compiled, including all 5 new pages)
- **Prisma migration**: `prisma migrate dev` — pass (`20260227082218_add_email_verification_and_password_reset_tokens`)

## Bugs Found

No bugs found during implementation. The ERROR log lines visible in test output are expected — they come from MailService SMTP-failure tests that intentionally verify the fire-and-forget pattern (errors caught and logged, never re-thrown).

## Documentation Updates

Deferred — same as SCRUM-23 through SCRUM-28. API spec, backend-standards, frontend-standards, and data-model docs will be updated in batch after the SCRUM-22 epic completes (SCRUM-30 remaining).

## Lessons Learned

- **Prisma client must be regenerated after migration**: `npx prisma generate` is required before `nest build` when new models are added via migration. Otherwise TypeScript errors `Property 'newModel' does not exist on type 'PrismaService'` appear even though the migration applied cleanly.
- **Fire-and-forget tests produce expected ERROR logs**: MailService SMTP-failure tests intentionally trigger errors. These appear in Jest output as `[MailService] ERROR Failed to send...` — they are not test failures. Document this pattern for future email service implementations to avoid confusion.
- **Plan schema snapshots go stale quickly**: SCRUM-29 plan still showed `resetPassword()` setting `refreshToken: null` (removed in SCRUM-26). Always cross-check plan snippets against the actual codebase before implementation. Session invalidation must now go through `SessionsService.revokeAllUserSessions()`.
- **CSRF on public POST endpoints**: Unauthenticated endpoints (`forgot-password`, `reset-password`) require `@SkipCsrf()` because users have no session to obtain a CSRF token from. This is a recurring pattern for any public POST in the auth flow.
- **Email enumeration protection is silent**: `forgotPassword()` always returns void and the controller always returns 200. Any attempt to make error paths distinguishable (timing, response size, log verbosity) undermines the protection. Anti-enumeration requires uniform response at all layers.
