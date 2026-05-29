# Implementation Record: SCRUM-175 E2E Tests for Auth Critical Flows

## 1. Summary

Created comprehensive E2E integration tests for all 5 critical auth flows: Register→Verify→Login, MFA lifecycle, OAuth code exchange, Password Reset, and Session Management + Account Lockout. 57 tests across 3 test suites, all passing.

- **Scope**: backend
- **Branch**: `feature/SCRUM-175-backend`
- **Implementation date**: 2026-03-12

## 2. Plan Reference

- **Plan**: `ai-specs/ai-specs/changes/plans/Sprint 7/SCRUM-175_backend.md`
- **Plan was followed**: Yes, with minor deviations (see section 4)

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `5e17e8f` | feat(SCRUM-175): add E2E integration tests for auth critical flows | `test/auth-e2e/setup.ts`, `test/auth-e2e/helpers.ts`, `test/auth-e2e/auth-flows.e2e-spec.ts`, `test/auth-e2e/mfa-flows.e2e-spec.ts`, `test/auth-e2e/oauth-flows.e2e-spec.ts`, `test/jest-e2e.json` |

## 4. Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| MFA TOTP generation | Use `authenticator` from otplib | Used `TOTP` class with `NobleCryptoPlugin` + `ScureBase32Plugin` | otplib v13 CJS build does not export `authenticator` | Accepted |
| Jest config | No transform config needed | Added `transformIgnorePatterns` to `jest-e2e.json` | otplib ESM-only deps need Jest transform | Accepted |
| Guard bypass | Use `overrideGuard()` / `overrideProvider()` | `jest.spyOn()` on prototype | `APP_GUARD` multi-providers can't be overridden via TestingModule | Accepted |
| MFA setup status code | Expect 200 | Expect 201 | `@Post('setup')` has no `@HttpCode` decorator — NestJS defaults POST to 201 | Accepted |

## 5. Test Results

- **New E2E tests**: 57 passed / 0 failed
  - `auth-flows.e2e-spec.ts`: 35 tests (registration, login, email verification, refresh, logout, password reset, session management, account lockout, admin RBAC)
  - `mfa-flows.e2e-spec.ts`: 14 tests (MFA setup, verify-setup, verify-login, disable, status, edge cases, admin enforcement)
  - `oauth-flows.e2e-spec.ts`: 8 tests (code exchange, invalid code, single-use, missing code, oauthAction filtering)
- **Existing unit tests**: 829 passed / 0 failed (no regressions)
- **Pre-existing `app.e2e-spec.ts`**: Already broken before this branch (PermissionsService.onModuleInit — not caused by this ticket)

## 6. Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `test/auth-e2e/setup.ts` | Created | E2E infrastructure: MockStore, createMockPrisma (all 10 models), createMockRedis, createMockMailService, createE2EApp with guard bypasses |
| `test/auth-e2e/helpers.ts` | Created | Reusable request helpers, token extractors, store utilities, response types |
| `test/auth-e2e/auth-flows.e2e-spec.ts` | Created | Flows 1, 1b, 4, 5, 5b + Admin RBAC (35 tests) |
| `test/auth-e2e/mfa-flows.e2e-spec.ts` | Created | Flow 2 + MFA edge cases + admin MFA enforcement (14 tests) |
| `test/auth-e2e/oauth-flows.e2e-spec.ts` | Created | Flow 3: OAuth code exchange (8 tests) |
| `test/jest-e2e.json` | Modified | Added `transformIgnorePatterns` for ESM otplib deps |

## 7. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Pre-existing broken `app.e2e-spec.ts` (missing `permission.upsert` mock, undefined `store` variable) | MEDIUM | Deferred to SCRUM-184 | Pre-existing on `main` — not caused by this ticket |

No production bugs found.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/records/Sprint 7/SCRUM-175_backend.md` | Created implementation record |
| `ai-specs/specs/integration-state.md` | Added changelog entry for SCRUM-175 |

## 9. Lessons Learned

- NestJS `APP_GUARD` multi-providers cannot be overridden via `overrideGuard()` or `overrideProvider()`. The reliable approach is `jest.spyOn(GuardClass.prototype, 'canActivate')`.
- `otplib` v13 CJS build exports `TOTP`, `generate`, `verify` etc. but NOT `authenticator`. Must construct `TOTP` with explicit `NobleCryptoPlugin` and `ScureBase32Plugin`.
- `cookieParser()` middleware must be explicitly applied in E2E test app setup for cookie-based refresh token flows.
- JwtStrategy.validate() re-fetches user from DB, so RBAC tests can promote user role in the mock store after initial login and the access token will reflect the updated role.
