# Implementation Record: SCRUM-98 Password Breach Check (HaveIBeenPwned)

## 1. Ticket

- **ID**: SCRUM-98
- **Title**: Password Breach Check — HaveIBeenPwned k-Anonymity Integration
- **Branch**: `feature/SCRUM-98-backend`
- **Base**: `feature/SCRUM-97-fullstack`
- **Commit**: `fa9a71c`

## 2. Summary

Integrated HaveIBeenPwned (HIBP) Pwned Passwords API using the k-anonymity approach to check passwords against known breach databases. Applied to all three password-setting flows: registration, password reset, and password change. Uses native Node.js `crypto` and `fetch` — no new dependencies.

## 3. Files Changed

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `nexacore-api/src/auth/password-breach.service.ts` | CREATE | HIBP k-anonymity service — SHA-1 prefix (5 chars), 3s timeout, fail-open |
| 2 | `nexacore-api/src/auth/auth.module.ts` | MODIFY | Added PasswordBreachService to providers + exports, forwardRef for UsersModule |
| 3 | `nexacore-api/src/auth/auth.service.ts` | MODIFY | Injected PasswordBreachService, breach check in register() and resetPassword() |
| 4 | `nexacore-api/src/users/users.service.ts` | MODIFY | Injected PasswordBreachService via forwardRef, breach check in changePassword() |
| 5 | `nexacore-api/src/users/users.module.ts` | MODIFY | Added AuthModule import via forwardRef (circular dependency resolution) |
| 6 | `nexacore-api/src/auth/tests/password-breach.service.spec.ts` | CREATE | 8 test cases covering match, no-match, timeout, 5xx, network error, malformed, prefix validation, empty password |
| 7 | `nexacore-api/src/auth/tests/auth.service.spec.ts` | MODIFY | Added PasswordBreachService mock + 2 breached password tests (register + resetPassword) |
| 8 | `nexacore-api/src/users/tests/users.service.spec.ts` | MODIFY | Added PasswordBreachService mock + 1 breached password test (changePassword) |
| 9 | `ai-specs/specs/api-spec.yml` | MODIFY | Updated 400 descriptions for register, reset-password, change-password |
| 10 | `ai-specs/specs/integration-state.md` | MODIFY | AuthModule/UsersModule entries, forwardRef notes, changelog entry |

## 4. Deviations from Plan

| # | Planned | Actual | Reason |
|---|---------|--------|--------|
| 1 | Branch from `main` | Branch from `feature/SCRUM-97-fullstack` | Main branch only has up to SCRUM-21. Plan was verified against post-SCRUM-97 state which is on the feature branch. |
| 2 | Simple import in AuthModule | forwardRef on both AuthModule and UsersModule | Circular dependency AuthModule ↔ UsersModule confirmed. forwardRef() on both sides + @Inject(forwardRef()) in UsersService constructor. |

## 5. Test Results

- **Suites**: 35 passed
- **Tests**: 453 passed (11 new)
- **Coverage**: stmts 98.41%, branches 86.58%, funcs 95.61%, lines 98.52%
- **Build**: `nest build` — clean

## 6. New Tests Added

| File | Test | Type |
|------|------|------|
| password-breach.service.spec.ts | Password found in breach DB → returns true | Unit |
| password-breach.service.spec.ts | Password NOT in breach DB → returns false | Unit |
| password-breach.service.spec.ts | API timeout → returns false (fail-open) | Unit |
| password-breach.service.spec.ts | API 5xx → returns false (fail-open) | Unit |
| password-breach.service.spec.ts | Network error → returns false (fail-open) | Unit |
| password-breach.service.spec.ts | Malformed response → returns false | Unit |
| password-breach.service.spec.ts | SHA-1 prefix is exactly 5 chars | Unit |
| password-breach.service.spec.ts | Empty password → handles gracefully | Unit |
| auth.service.spec.ts | Register with breached password → BadRequestException | Unit |
| auth.service.spec.ts | Reset password with breached password → BadRequestException | Unit |
| users.service.spec.ts | Change password with breached password → BadRequestException | Unit |

## 7. Architecture Notes

- **Fail-open**: If HIBP API is unreachable (timeout, 5xx, network), password is accepted and a warning is logged.
- **k-Anonymity**: Only the first 5 characters of the SHA-1 hash are sent to the HIBP API. The full hash never leaves the server.
- **Circular dependency**: AuthModule ↔ UsersModule resolved with `forwardRef()` on both module imports and `@Inject(forwardRef())` on the UsersService constructor parameter.
- **No new dependencies**: Uses native Node.js `crypto` and global `fetch`.

## 8. Error Response

```json
{
  "statusCode": 400,
  "message": "This password has appeared in a data breach. Please choose a different password.",
  "error": "Bad Request"
}
```

## 9. Documentation Updated

- `api-spec.yml`: Updated 400 response descriptions for `/auth/register`, `/auth/reset-password`, `/users/me/password`
- `integration-state.md`: AuthModule exports PasswordBreachService, UsersModule imports AuthModule (forwardRef), changelog entry
