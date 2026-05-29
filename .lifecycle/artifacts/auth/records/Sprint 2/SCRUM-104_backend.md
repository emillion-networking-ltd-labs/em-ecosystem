# Implementation Record: SCRUM-104 Email Change Flow with Re-verification

## Summary

Implemented a secure email change flow for local accounts: authenticated users request an email change via `POST /users/me/email` (password-verified, rate-limited), receive a verification link at the new address, and upon clicking `GET /auth/verify-email-change?token=xxx` the email is atomically swapped, all sessions are revoked, and a confirmation is sent to the old email. Both request and completion are audit-logged.

- **Scope**: backend
- **Branch**: `feature/SCRUM-104-backend`
- **Implementation date**: 2026-03-02

## Plan Reference

- **Plan**: `ai-specs/ai-specs/changes/plans/SCRUM-104_backend.md`
- **Plan was followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `d6356b6` | feat(SCRUM-104): add email change flow with verification | 18 files: schema.prisma, migration, audit-action.enum.ts, auth.controller.ts, auth.service.ts, mail.service.ts, 3 .hbs templates, users.controller.ts, users.service.ts, user.entity.ts, change-email.dto.ts, 5 test files |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Test suites**: 36 passed / 0 failed
- **Tests**: 538 passed / 0 failed (31 new tests, baseline was 507)
- **Coverage**: stmts 98.32%, branches 86.99%, funcs 93.7%, lines 98.54%
- **Manual verification**: N/A (all scenarios covered by unit tests)
- **Skipped tests**: None

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/ai-specs/specs/integration-state.md` | Added SCRUM-104 changelog entry, added `POST /me/email` and `GET /verify-email-change` to controller guard chains (done during implementation) |
| `ai-specs/ai-specs/specs/data-model.md` | pendingEmail on User, EmailVerificationTokenType enum, type on EmailVerificationToken, EMAIL_CHANGE_REQUESTED/EMAIL_CHANGED AuditAction values, ChangeEmailDto, SafeUser Omit update, cross-flow guard invariant (done during implementation). Fixed stale "immutable email" business invariant. |
| `ai-specs/ai-specs/specs/api-spec.yml` | Added POST /users/me/email and GET /auth/verify-email-change endpoints, ChangeEmailDto schema (done during implementation) |

## Lessons Learned

- Reusing the existing EmailVerificationToken model with a type discriminator (REGISTRATION vs EMAIL_CHANGE) worked cleanly and avoided a new model, while cross-flow guards prevent token misuse.
- The `hashToken()` one-liner duplication in UsersService (already private in AuthService) was acceptable — extracting to a shared utility would be premature abstraction for 1 line.
- The plan's step-by-step approach matched the dependency order perfectly — schema → enums → DTO → mail → service → controller → tests required no backtracking.
