# Implementation Record: SCRUM-24 Rate Limiting & Brute Force Protection

## Summary

Implemented three-layer rate limiting (global, per-endpoint, account-level), exponential backoff lockout, timing attack protection, and frontend rate limit error handling with countdown UI.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-23-oauth-security-hardening`
- **Implementation date**: 2026-02-26

## Plan Reference

- **Plan**: `ai-specs/changes/plans/SCRUM-24_fullstack.md`
- **Plan followed**: Partially — 6 minor deviations, all simplifications or bug corrections (see Deviations section)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `5aa2ae2` | feat(SCRUM-24): rate limiting, brute force protection and timing attack mitigation | 27 files (see below) |

**Files created (7):**
- `nexacore-api/src/auth/constants/auth.constants.ts` — Centralized auth constants (BCRYPT_ROUNDS, MAX_FAILED_ATTEMPTS, DUMMY_PASSWORD_HASH, lockout durations, rate limit configs)
- `nexacore-api/src/common/guards/custom-throttler.guard.ts` — Custom ThrottlerGuard with X-RateLimit-* headers and 429 response format
- `nexacore-api/prisma/migrations/20260226171805_add_lockout_count/migration.sql` — Database migration for lockoutCount column
- `nexacore-api/src/auth/tests/brute-force.spec.ts` — Exponential backoff tests (getLockoutDurationMs, getLockoutDurationMinutes, constants)
- `nexacore-api/src/auth/tests/timing-attack.spec.ts` — DUMMY_PASSWORD_HASH validity tests
- `nexacore-api/src/auth/tests/rate-limiting.spec.ts` — Rate limit configuration tests
- `nexacore-dashboard/src/components/ui/RateLimitBanner.tsx` — Countdown timer component for rate limit/lockout display

**Files modified (20):**
- `nexacore-api/package.json` — Added @nestjs/throttler ^6.5.0
- `nexacore-api/package-lock.json` — Lockfile updated
- `nexacore-api/prisma/schema.prisma` — Added `lockoutCount Int @default(0)` to User model
- `nexacore-api/src/app.module.ts` — Added ThrottlerModule.forRoot() with global config and CustomThrottlerGuard as APP_GUARD
- `nexacore-api/src/auth/auth.controller.ts` — Added @Throttle decorators (register 3/60s, login 5/60s, refresh 10/60s, oauth 5/60s), @SkipThrottle on callbacks, 429 ApiResponse docs
- `nexacore-api/src/auth/auth.service.ts` — Replaced local constants with auth.constants.ts imports, timing attack protection (DUMMY_PASSWORD_HASH), exponential backoff lockout with ForbiddenException containing retryAfter/lockoutLevel
- `nexacore-api/src/users/users.service.ts` — lockAccount() accepts lockoutCount for exponential duration, added resetLockoutEscalation() method
- `nexacore-api/src/users/entities/user.entity.ts` — Added lockoutCount to User interface and toSafeUser
- `nexacore-api/src/common/filters/http-exception.filter.ts` — Added 429 to code map, retryAfter/lockoutLevel pass-through, short-circuit for pre-formatted errors
- `nexacore-api/src/auth/tests/auth.service.spec.ts` — Added lockoutCount to mocks, updated lockAccount expectation, timing attack test descriptions
- `nexacore-api/src/auth/tests/auth.controller.spec.ts` — Added lockoutCount: 0 to mock users
- `nexacore-api/src/auth/tests/jwt.strategy.spec.ts` — Added lockoutCount: 0 to mock users
- `nexacore-api/src/auth/tests/oauth-code.store.spec.ts` — Added lockoutCount: 0 to mock users
- `nexacore-api/src/auth/tests/github.strategy.spec.ts` — Added lockoutCount: 0 to mock users
- `nexacore-api/src/auth/tests/google.strategy.spec.ts` — Added lockoutCount: 0 to mock users
- `nexacore-api/src/auth/tests/oauth-exchange.spec.ts` — Added lockoutCount: 0 to mock users
- `nexacore-dashboard/src/lib/types.ts` — Added lockoutCount to SafeUser, retryAfter/lockoutLevel/details to ErrorResponse, new RateLimitInfo type
- `nexacore-dashboard/src/lib/api.ts` — Enhanced parseErrorResponse to enrich 429 errors with Retry-After header
- `nexacore-dashboard/src/context/AuthContext.tsx` — Added RATE_LIMITED action, rateLimitInfo state, rate limit detection in login/register catch blocks
- `nexacore-dashboard/src/components/auth/LoginForm.tsx` — Integrated RateLimitBanner, disabled form during cooldown

## Deviations from Plan

| # | Planned | Actual | Reason |
|---|---------|--------|--------|
| 1 | Create `common/interceptors/rate-limit-headers.interceptor.ts` (File #2) | Not created | CustomThrottlerGuard already handles X-RateLimit-* headers on both success and 429 responses — separate interceptor would be redundant |
| 2 | Create `nexacore-dashboard/src/lib/rate-limit.ts` (File #8) | Not created | Rate limit parsing logic inlined in api.ts (6 lines) and AuthContext (8 lines) — insufficient complexity to justify separate file |
| 3 | Modify `main.ts` to register CustomThrottlerGuard (Step 3) | APP_GUARD registered in app.module.ts | Standard NestJS pattern — module-level APP_GUARD is preferred over main.ts manual registration |
| 4 | `@Throttle` uses array syntax `[{ name: 'global', ... }]` (Step 5) | Uses record syntax `{ global: { ... } }` | Plan had incorrect syntax for @nestjs/throttler v6 — v6 requires `Record<string, Options>`, not array. Plan bug corrected. |
| 5 | auth.service.ts Step 9 snapshot without OAuthCodeStore (SCRUM-23 code) | Code preserves OAuthCodeStore injection, generateOAuthCode(), exchangeOAuthCode() | Plan contained stale snapshot pre-SCRUM-23. Correctly merged SCRUM-24 changes into existing SCRUM-23 code instead of replacing. |
| 6 | auth.controller.ts Step 5 snapshot without oauth/exchange endpoint (SCRUM-23 code) | Code preserves oauth/exchange endpoint, getValidatedFrontendUrl(), ephemeral code callbacks | Same as #5 — plan had stale pre-SCRUM-23 snapshot. |

## Subtask Mapping (Plan vs Jira vs Code)

Plan re-defined subtask scope during enrichment. Mapping:

| Key | Plan Title | Jira Original Title | Implemented? |
|-----|-----------|---------------------|-------------|
| SCRUM-37 | Global rate limiting with @nestjs/throttler | Integrate @nestjs/throttler with global config | YES |
| SCRUM-38 | Per-endpoint rate limiting on auth routes | Rate limit /auth/login — 5/min/IP | YES |
| SCRUM-39 | Brute force protection with exponential backoff | Rate limit /auth/register — 10/hour/IP | YES |
| SCRUM-40 | Login timing attack protection | Rate limit /auth/refresh — 20/min/user | YES |
| SCRUM-41 | Rate limit response headers | Rate limit /users/me/password — 5/hour/user | YES |
| SCRUM-42 | Frontend rate limit error handling | Implement progressive lockout | YES |
| SCRUM-43 | Rate limiting unit & integration tests | Constant-time login response | YES |

**Note**: Jira original rate limit values (10/hour register, 20/min refresh) were superseded by plan values (3/60s register, 10/60s refresh). Jira's SCRUM-41 references `/users/me/password` which does not exist yet — this endpoint is future scope.

## Test Results

- **Unit tests**: 93 passed / 0 failed (12 suites)
- **Builds**: `nest build` succeeded; `next build` compiled + type-checked OK (static generation crash is pre-existing Windows memory issue, unrelated to SCRUM-24)
- **Bugs found during implementation**:
  - `@Throttle` array syntax caused TS2353 compilation errors — corrected to record syntax (deviation #4)
  - `timing-attack.spec.ts` bcrypt hash split index was [3] instead of [2] — corrected

## Documentation Updates

None required — rate limiting is internal implementation detail not affecting api-spec.yml endpoint contracts.

## Lessons Learned

- @nestjs/throttler v6 changed `@Throttle` decorator API from array to `Record<string, Options>`. Always verify installed version before implementing decorator syntax.
- Enrichment plans with full file snapshots become stale after prior stories modify the same files. Implementation must merge changes rather than replace.
- DUMMY_PASSWORD_HASH using `bcrypt.hashSync` at module load time is acceptable because it's computed once at startup, not per-request.
- OOM crashes in Jest can be mitigated with `--maxWorkers=1 --forceExit` for large test suites on Windows.

---

## Addendum: Post-Implementation Bugfix

**Discovered during**: SCRUM-26 manual testing (2026-02-26)

| Hash | Message | File Changed |
|------|---------|-------------|
| `c121bcd` | fix(SCRUM-24): differentiate rate limit keys per endpoint | `nexacore-api/src/common/guards/custom-throttler.guard.ts` |

**Bug**: `CustomThrottlerGuard.generateKey()` produced identical keys for all endpoints — `${throttlerName}-${ip}-${suffix}` where `suffix` (the tracker default) is also the IP. This meant all routes shared a single rate limit counter per IP. After 3 register attempts (limit: 3/min), login (limit: 5/min), OAuth (limit: 5/min), and refresh (limit: 10/min) were all blocked — per-endpoint `@Throttle()` decorators had no effect.

**Root cause**: The base `ThrottlerGuard` includes handler/class info in keys by default. The custom override in SCRUM-24 stripped this differentiation when overriding `generateKey()` to use IP-based keys.

**Fix**: Added `context.getClass().name` and `context.getHandler().name` to the key: `${throttlerName}-${classRef}-${handler}-${ip}-${suffix}`. Each endpoint now has its own independent counter per IP.
