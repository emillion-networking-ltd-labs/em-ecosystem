# Implementation Record: SCRUM-141 Registration Anti-Enumeration

## 1. Summary

Eliminated email enumeration on the registration endpoint (`POST /auth/register`). Both existing and new emails now return identical HTTP 200 responses with a generic message. Added `bcrypt.compare` timing protection against `DUMMY_PASSWORD_HASH` for the existing-email path to prevent timing side-channel attacks. New security notification email alerts existing users of registration attempts. Frontend adapted to new response shape (no `user` object).

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-141-fullstack`
- **Implementation date**: 2026-03-08
- **PR**: #35
- **Security references**: CWE-200, CWE-203, OWASP ASVS V2.1.1, NIST SP 800-63B §5.1.1.1

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 5/SCRUM-141_fullstack.md`
- **Plan was followed**: Yes

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `aac8f30` | fix(SCRUM-141): prevent email enumeration on registration endpoint | 7 files (5 backend source/test + 1 template + 1 frontend) |

## 4. Deviations from Plan

| # | Deviation | Reason | Follow-up |
|---|-----------|--------|-----------|
| 1 | `bcrypt.compare` test asserts `expect.anything()` via `mock.calls[0][0]` instead of `expect.any(String)` | `DUMMY_PASSWORD_HASH` is `undefined` in test environment because `bcrypt.hashSync` is fully mocked via `jest.mock('bcrypt')`. The constant is computed at import time with real bcrypt, but the mock replaces it. | Accepted — test correctly verifies the behavior (bcrypt.compare is called with the submitted password). |

## 5. Files Changed

### Modified Source Files (4)
| File | Changes |
|------|---------|
| `nexacore-api/src/auth/auth.service.ts` | `RegisterResult` interface: removed `user: SafeUser`. `register()` rewritten: existing-email path returns `{ message: CHECK_EMAIL }` with `bcrypt.compare(DUMMY_PASSWORD_HASH)` timing protection + `sendRegistrationAttemptNotification`. New-email path returns same message (no `user`). Removed `ConflictException` import (unused). Audit log includes `outcome` field. |
| `nexacore-api/src/auth/auth.controller.ts` | `@HttpCode(HttpStatus.OK)` (was CREATED/201). Removed `@ApiResponse({ status: 409 })`. Response: `{ message }` only (no `user`). |
| `nexacore-api/src/mail/mail.service.ts` | Added `sendRegistrationAttemptNotification(email, firstName?)` — sends security alert email to existing users when someone attempts registration with their email. |
| `nexacore-dashboard/src/context/AuthContext.tsx` | `register()`: changed `apiClient.post` generic type from `{ message: string; user: SafeUser }` to `{ message: string }`. |

### New Files (1)
| File | Purpose |
|------|---------|
| `nexacore-api/src/mail/templates/registration-attempt.hbs` | Email template for registration attempt notification. Matches existing template style (EM NexaCore branding, card layout, CTA buttons for login and password reset). |

### Modified Test Files (2)
| File | Changes |
|------|---------|
| `nexacore-api/src/auth/tests/auth.service.spec.ts` | Register tests: removed "return SafeUser" and "throw ConflictException" tests. Added 4 anti-enumeration tests (same response shape, bcrypt.compare timing, no user creation, notification sent). Updated 3 existing tests (message text, no `user` property). Added `sendRegistrationAttemptNotification` to MailService mock. Added top-level `mailService` variable. Removed unused `ConflictException` import. |
| `nexacore-api/src/auth/tests/auth.controller.spec.ts` | Register tests: replaced "message + user" test with "only message" test. Replaced "propagate ConflictException" test with "same response for existing and new emails" test. Removed unused `ConflictException` import. |

## 6. Test Results

- **Backend**: 44 suites, 818 tests — all pass
- **Frontend**: 7 suites, 31 tests — all pass
- **TypeScript**: `nest build` compiles clean, `next build` compiles clean
- **Net test change**: +4 new, -2 removed = +2 net (register anti-enumeration tests)

## 7. Bugs Found

No bugs found during implementation.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry added. No module/guard/DI/controller/permission/schema changes — behavior-only remediation + new mail method. |

## 9. Lessons Learned

- **`jest.mock('bcrypt')` and import-time constants**: `DUMMY_PASSWORD_HASH` is computed at module load via `bcrypt.hashSync()`. When bcrypt is fully mocked, `hashSync` returns `undefined`, so the constant is `undefined` in tests. Tests must assert on `bcrypt.compare` being called rather than asserting on the second argument's value.
- **`expect.anything()` vs `undefined`**: Jest's `expect.anything()` matcher does NOT match `undefined` or `null` — it only matches "something". Use `mock.calls[0][0]` direct access when the second argument may be undefined in the test environment.
- **Anti-enumeration pattern reusable**: The same pattern (identical response + timing protection + notification email) applies to SCRUM-145 (forgot-password) and SCRUM-146 (resend-verification). The `DUMMY_PASSWORD_HASH` constant and `bcrypt.compare` timing technique are already in place.
