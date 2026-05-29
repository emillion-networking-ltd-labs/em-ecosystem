# Implementation Record: SCRUM-99 Rate Limit MFA Endpoints

## 1. Ticket

- **ID**: SCRUM-99
- **Title**: Rate Limit MFA Endpoints
- **Branch**: `feature/SCRUM-99-backend`
- **Base**: `feature/SCRUM-98-backend`
- **Commit**: `92457d7`
- **PR**: #6 (against `main`)

## 2. Summary

Added endpoint-specific `@Throttle(5 req/60s)` decorators to 5 of 6 MFA endpoints to mitigate TOTP brute-force attacks. The global rate limit (100 req/60s) was insufficient for 6-digit TOTP code endpoints. Combined with the 5-minute mfaToken expiry, max attempts per challenge drop to 25, making brute-force infeasible. No DI, module, or constructor changes required — decorators only.

- **Scope**: backend
- **Implementation date**: 2026-03-02

## 3. Plan Reference

- **Plan**: `ai-specs/changes/plans/SCRUM-99_backend.md`
- **Plan followed**: Yes — implementation followed the plan exactly

## 4. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `92457d7` | feat(SCRUM-99): add endpoint-specific rate limits to MFA endpoints | `auth/constants/auth.constants.ts`, `auth/mfa.controller.ts`, `auth/tests/mfa.controller.spec.ts`, `auth/tests/rate-limiting.spec.ts` |

## 5. Deviations from Plan

| # | Planned | Actual | Reason |
|---|---------|--------|--------|
| 1 | Branch from `main` (Step 0) | Branch from `feature/SCRUM-98-backend` | `main` is at SCRUM-21; all recent work lives on chained feature branches. Same deviation as SCRUM-98. |
| 2 | Throttler metadata key `THROTTLER:LIMIT` (Step 4) | Key is `THROTTLER:LIMITglobal` and `THROTTLER:TTLglobal` | Discovered at implementation time via `Reflect.getMetadataKeys()`. The key is the constant name concatenated with the throttler name (`global`). |

No functional deviations — all 7 plan steps completed as designed.

## 6. Test Results

- **Suites**: 35 passed
- **Tests**: 462 passed (9 new: 3 config + 6 decorator metadata)
- **Coverage**: stmts 98.41%, branches 86.58%, funcs 95.61%, lines 98.52%
- **Build**: `nest build` — clean
- **Routes**: 36 routes loaded on `nest start`

## 7. New Tests Added

| File | Test | Type |
|------|------|------|
| rate-limiting.spec.ts | MFA rate limit is 5 per 60s | Config |
| rate-limiting.spec.ts | MFA limit at or below global | Config |
| rate-limiting.spec.ts | Max 25 brute-force attempts per 5-min MFA token | Config |
| mfa.controller.spec.ts | @Throttle on setup | Decorator metadata |
| mfa.controller.spec.ts | @Throttle on verifySetup | Decorator metadata |
| mfa.controller.spec.ts | @Throttle on verifyLogin | Decorator metadata |
| mfa.controller.spec.ts | @Throttle on disable | Decorator metadata |
| mfa.controller.spec.ts | @Throttle on regenerateCodes | Decorator metadata |
| mfa.controller.spec.ts | NO @Throttle on status (inherits global) | Decorator metadata |

## 8. Files Changed

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `nexacore-api/src/auth/constants/auth.constants.ts` | MODIFY | Added `mfa: { ttl: 60_000, limit: 5 }` to AUTH_RATE_LIMITS, updated JSDoc |
| 2 | `nexacore-api/src/auth/mfa.controller.ts` | MODIFY | Added `Throttle` + `AUTH_RATE_LIMITS` imports, `@Throttle()` on 5 endpoints |
| 3 | `nexacore-api/src/auth/tests/rate-limiting.spec.ts` | MODIFY | Added 3 MFA config validation tests |
| 4 | `nexacore-api/src/auth/tests/mfa.controller.spec.ts` | MODIFY | Added 6 decorator metadata tests |
| 5 | `ai-specs/specs/api-spec.yml` | MODIFY | Added 429 responses to 5 MFA endpoints using `$ref: RateLimitErrorResponse` |
| 6 | `ai-specs/specs/integration-state.md` | MODIFY | Updated header, MfaController row, added MFA Method Guards table, changelog entry |

## 9. Documentation Updated

- `api-spec.yml`: Added 429 response to `/auth/mfa/setup`, `/auth/mfa/verify-setup`, `/auth/mfa/verify-login`, `/auth/mfa` (DELETE), `/auth/mfa/recovery-codes`
- `integration-state.md`: Updated last ticket to SCRUM-99, MfaController guard chain updated with `@Throttle (5 methods)`, new MfaController Method Guards table, changelog entry added

## 10. Lessons Learned

- **Throttler metadata key naming**: `@nestjs/throttler` concatenates the constant prefix (`THROTTLER:LIMIT`, `THROTTLER:TTL`) with the throttler name (`global`), producing keys like `THROTTLER:LIMITglobal`. Always verify with `Reflect.getMetadataKeys()` when writing metadata assertion tests.
- **Branch chaining**: The `main` branch continues to lag behind active development. All feature branches must chain from the latest feature branch, not `main`.
- **Minimal-touch ticket**: No DI changes, no new files, no constructor changes — decorator-only tickets are fast and low-risk. Good pattern for security hardening.
