# Implementation Record: SCRUM-201 Split auth.service.spec.ts into Per-Domain Test Files

## 2. Summary

Split the 2,958-line monolithic `auth.service.spec.ts` into 6 focused domain test files with a shared helper, eliminating ~210 lines of duplicated mock setup per file.

- **Scope**: backend
- **Branch**: `feature/SCRUM-201-backend`
- **Date**: 2026-03-13

## 3. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 8/SCRUM-201_backend.md`
- **Plan was followed**: Yes

## 4. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `e147010` | refactor(auth): split auth.service.spec.ts into per-domain test files (SCRUM-201) | `auth-test.helpers.ts` (new), `auth.service.spec.ts` (slimmed), `auth-login.spec.ts` (new), `auth-token.spec.ts` (new), `auth-oauth.spec.ts` (new), `auth-email.spec.ts` (new), `auth-password.spec.ts` (new) |

## 5. Deviations from Plan

Implementation followed the plan exactly.

## 6. Test Results

- **Overall**: 846 tests passing, 54 suites
- **Split file verification**: 152 tests across 6 files (identical to original)
- **Per-file breakdown**:
  - `auth.service.spec.ts`: 35 tests (core register, login, logout, fire-and-forget)
  - `auth-login.spec.ts`: 42 tests (MFA, lockout, travel, suspicious, device detection)
  - `auth-token.spec.ts`: 20 tests (refresh, MFA tokens, idle timeout, concurrent sessions)
  - `auth-oauth.spec.ts`: 10 tests (validateOAuthUser, code exchange, audit actions)
  - `auth-email.spec.ts`: 29 tests (verifyEmail, verifyEmailChange, resend)
  - `auth-password.spec.ts`: 16 tests (forgot, reset, validate token)
- **Build**: `nest build` passes

## 7. Bugs Found

No bugs found during implementation.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Added changelog entry for SCRUM-201, updated header |

## 9. Lessons Learned

- The shared `createAuthTestModule()` helper pattern cleanly eliminates ~210 lines of duplicated mock setup per file while keeping each test file independently runnable.
- The `AuthTestContext` interface provides full type safety for all mocked services, improving IDE support in each domain file.
- Careful test counting is critical during splits — the original had a `fire-and-forget resilience` block with 10 tests (not 3) that was easy to undercount due to its position mid-file.
