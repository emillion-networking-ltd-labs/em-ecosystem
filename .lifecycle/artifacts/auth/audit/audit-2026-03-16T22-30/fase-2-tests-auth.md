# Fase 2: TESTS — Auth Module

**Date**: 2026-03-16 22:30 UTC
**Module**: auth
**Auditor**: Claude Opus 4.6 (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: ISO 25010 §4.2.6 (Testability), SOC 2 CC8.3 (Change Testing), IEEE 829
**Previous audit**: 2026-03-15T19:49 (baseline for recurrence analysis)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 12    |
| FAIL    | 0     |
| WARN    | 1     |
| N/A     | 1     |

**Overall**: PASS

---

## Recurrence Analysis (vs 2026-03-15T19:49)

| Check | Previous | Current | Delta |
|-------|----------|---------|-------|
| T-01  | PASS     | PASS    | Stable |
| T-02  | FAIL     | PASS    | **Remediated** (SCRUM-224) — coverage tooling fixed, stmts 99.69% |
| T-03  | FAIL     | PASS    | **Remediated** (SCRUM-224) — branches 85.38% |
| T-04  | WARN     | PASS    | **Remediated** — functions 99.39% |
| T-05  | WARN     | PASS    | **Remediated** — lines 99.69% |
| T-06  | WARN     | PASS    | **Remediated** — per-file breakdown now available |
| T-07  | PASS     | PASS    | Stable |
| T-08  | PASS     | PASS    | Stable |
| T-09  | PASS     | PASS    | Stable |
| T-10  | PASS     | PASS    | Stable (suite time: 17.8s -> 103.6s, still under 120s) |
| T-11  | PASS     | PASS    | Stable |
| T-12  | PASS     | PASS    | Stable |
| T-13  | PASS     | WARN    | **Regression** — thresholds present but below project standards |
| T-14  | N/A      | N/A     | Stable |

**Previous FAILs remediated**: 2/2 (T-02, T-03)
**Previous WARNs remediated**: 3/3 (T-04, T-05, T-06)
**New FAILs**: 0
**Regressions**: 1 (T-13 PASS -> WARN — thresholds mismatch now visible since coverage tooling works)

---

## Detailed Findings

### T-01: All tests pass
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `jest --testPathPattern=src/auth --forceExit --maxWorkers=1` — 67 test suites passed, 1001 tests passed, 0 failures. Execution time: 103.577s. 42 auth-specific test files in `src/auth/tests/`.
- **Standard**: SOC 2 CC8.3
- **Delta**: +28 suites, +511 tests vs previous audit (39 -> 67 suites, 490 -> 1001 tests)

### T-02: Coverage: statements
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Auth module statement coverage: **99.69%** (threshold: >= 90%). Coverage tooling now functional with `coverageProvider: "v8"` in jest config (`package.json:129`). Previous FAIL (broken Istanbul/Jest 30 incompatibility) has been resolved via SCRUM-224.
- **Standard**: ISO 25010 Testability

### T-03: Coverage: branches
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Auth module branch coverage: **85.38%** (threshold: >= 85%). Exceeds threshold by 0.38 percentage points. Notable per-file branch figures:
  - `auth.service.ts`: 80.0%
  - `auth.controller.ts`: 82.6%
  - `auth/guards`: 88.33%
  - `auth/strategies`: 86.15%
  - `auth/utils`: 94.11%
  - `auth/stores`: 88.0%
- **Standard**: ISO 25010 Testability

### T-04: Coverage: functions
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Auth module function coverage: **99.39%** (threshold: >= 90%). Exceeds by 9.39 percentage points. Files at 0% (`auth/interfaces/`, `auth/dto/`) are type-only or decorator-only — no executable functions.
- **Standard**: ISO 25010 Testability

### T-05: Coverage: lines
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Auth module line coverage: **99.69%** (threshold: >= 90%). Exceeds by 9.69 percentage points.
- **Standard**: ISO 25010 Testability

### T-06: Per-file coverage
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Per-file breakdown (auth module):

| File / Group | Stmts | Branch | Funcs | Lines |
|-------------|-------|--------|-------|-------|
| auth.controller.ts | 100% | 82.6% | 100% | 100% |
| auth.service.ts | 96.49% | 80.0% | 95.23% | 96.49% |
| auth/constants | 100% | 100% | 100% | 100% |
| auth/dto | 70.79% | 0% | 0% | 70.79% |
| auth/guards | 100% | 88.33% | 100% | 100% |
| auth/interfaces | 0% | 0% | 0% | 0% |
| auth/stores | 100% | 88.0% | 100% | 100% |
| auth/strategies | 100% | 86.15% | 100% | 100% |
| auth/utils | 98.07% | 94.11% | 100% | 98.07% |
| auth/tests/auth-test.helpers.ts | 100% | 100% | 100% | 100% |

**Below-threshold notes**:
  - `auth/interfaces/` — 0% across all metrics: type-only files (`auth.interfaces.ts`, `refresh-token-payload.interface.ts`, `oauth-account.interface.ts`), no executable code.
  - `auth/dto/` — 70.79% stmts, 0% branch/func: DTO classes with class-validator decorators only. No methods or branching logic. Statement coverage from decorator execution at import time.
  - `auth.service.ts` — 80.0% branch: largest service file with extensive conditional logic. All major paths tested but some edge-case branches in deeply nested conditionals remain uncovered.

  All runtime-code files with testable logic exceed 90% statement coverage.
- **Standard**: ISO 25010 Testability

### T-07: Untested exports
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: All exported classes/functions in `src/auth/` have corresponding test coverage:

| Source File | Test File(s) |
|------------|-------------|
| `auth.controller.ts` | `auth.controller.spec.ts` |
| `auth.service.ts` | `auth.service.spec.ts`, `auth-login.spec.ts`, `auth-login-device.spec.ts`, `auth-login-security.spec.ts`, `auth-email.spec.ts`, `auth-password.spec.ts`, `auth-oauth.spec.ts`, `auth-token.spec.ts` |
| `account.controller.ts` | `account.controller.spec.ts` |
| `session.controller.ts` | `session.controller.spec.ts` |
| `oauth.controller.ts` | `oauth.controller.spec.ts` |
| `mfa.controller.ts` | `mfa.controller.spec.ts` |
| `mfa.service.ts` | `mfa.service.spec.ts` |
| `passkey.controller.ts` | `passkey.controller.spec.ts` |
| `passkey.service.ts` | `passkey.service.spec.ts`, `passkey-authentication.spec.ts`, `passkey-management.spec.ts` |
| `oauth-auth.service.ts` | `oauth-auth.service.spec.ts`, `oauth-exchange.spec.ts` |
| `login.service.ts` | `auth-login.spec.ts`, `auth-login-device.spec.ts` (via AuthService delegation) |
| `login-security.service.ts` | `login-security.service.spec.ts` |
| `email-verification.service.ts` | `auth-email.spec.ts` (via AuthService delegation) |
| `password-reset.service.ts` | `auth-password.spec.ts` (via AuthService delegation) |
| `password-breach.service.ts` | `password-breach.service.spec.ts` |
| `token.service.ts` | `auth-token.spec.ts` (via AuthService delegation) |
| `token-deny-list.service.ts` | `token-deny-list.service.spec.ts` |
| `trusted-device.service.ts` | `trusted-device.service.spec.ts` |
| Guards: `roles.guard.ts`, `permissions.guard.ts`, `oauth-link.guard.ts`, `oauth-callback.filter.ts` | `roles.guard.spec.ts`, `permissions.guard.spec.ts`, `oauth-link.guard.spec.ts`, `oauth-callback.filter.spec.ts`, `oauth-guards.spec.ts` |
| Strategies: `jwt.strategy.ts`, `google.strategy.ts`, `github.strategy.ts` | `jwt.strategy.spec.ts`, `google.strategy.spec.ts`, `github.strategy.spec.ts` |
| Stores: `oauth-state.store.ts`, `oauth-code.store.ts`, `oauth-link-code.store.ts` | `oauth-state.store.spec.ts`, `oauth-code.store.spec.ts`, `oauth-link-code.store.spec.ts` |
| Utils: `hash-token.ts`, `parse-duration.ts` | `hash-token.spec.ts`, `parse-duration.spec.ts` |
| `strategies/oauth-validate.helper.ts` | `oauth-validate.helper.spec.ts` |
| `strategies/pkce-authenticate.ts` | `pkce-authenticate.spec.ts` |
| Security tests (no source counterpart) | `brute-force.spec.ts`, `rate-limiting.spec.ts`, `timing-attack.spec.ts` |

**Note**: `audit-log.helper.ts` exports `createAuditLogger` — no dedicated spec file, but this is a thin 28-line wrapper over `AuditService.log()` exercised by `auth.service.spec.ts` through the AuthService constructor. Coverage data confirms 98.07% for `auth/utils`. Guard factory files (`google-auth.guard.ts`, `github-auth.guard.ts`, `jwt-auth.guard.ts`) are single-line re-exports tested via `oauth-guards.spec.ts`. `auth.module.ts` excluded from coverage by jest config (`!**/*.module.ts`).
- **Standard**: ISO 25010 Testability

### T-08: Mock fidelity
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Centralized mock providers in `src/auth/tests/auth-test.helpers.ts` define mock factories for all injected dependencies: `EmailVerificationService`, `PasswordResetService`, `LoginService`, `LoginSecurityService`, `MfaService`, `PasskeyService`, `TokenService`, `TrustedDeviceService`, `PasswordBreachService`, `TokenDenyListService`, `OAuthAuthService`, `AuditService`, `PrismaService`, `JwtService`, `ConfigService`, `RedisService`. NestJS `TestingModule` pattern ensures DI signature alignment — a constructor signature mismatch would cause test compilation or runtime failure. Passkey tests use direct constructor instantiation with matching signatures. All 67 suites and 1001 tests pass, confirming 0 mock drift.
- **Standard**: IEEE 829

### T-09: No skipped tests
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: GREP for `it.skip(`, `describe.skip(`, `test.skip(`, `xit(`, `xdescribe(`, `it.only(`, `describe.only(`, `test.only(` across all 42 `src/auth/tests/*.spec.ts` files — **0 occurrences**.
- **Standard**: Test hygiene

### T-10: Test execution time
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Full auth module test suite: **103.577s** (threshold: <= 120s = PASS). 67 suites, 1001 tests. Average ~0.1s/test, well within the 5s individual test threshold. Suite time increased from 17.8s in previous audit due to +511 new tests, but still within the 120s module threshold with 16.4s margin.
- **Standard**: CI/CD efficiency

### T-11: Error path coverage
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Auth module source files contain **68 `throw new` statements** across 16 production files. Test suite contains **252 error-path assertions** (matching `toThrow`, `rejects`, `Unauthorized`, `Forbidden`, `BadRequest`, `NotFound`, `Conflict`, `TooMany`) across 24 test files. Ratio of ~3.7 assertions per throw path indicates thorough error path coverage. Key throw-heavy files all have dedicated error tests:
  - `mfa.service.ts` (21 throws) -> `mfa.service.spec.ts` (43 error assertions)
  - `passkey.service.ts` (12 throws) -> `passkey*.spec.ts` (46 error assertions)
  - `login.service.ts` (7 throws) -> `auth-login*.spec.ts` (30 error assertions)
  - `password-reset.service.ts` (5 throws) -> `auth-password.spec.ts` (11 error assertions)
  - `token.service.ts` (4 throws) -> `auth-token.spec.ts` (14 error assertions)
  - `email-verification.service.ts` (3 throws) -> `auth-email.spec.ts` (7 error assertions)
  - `jwt.strategy.ts` (3 throws) -> `jwt.strategy.spec.ts` (7 error assertions)
  - `guards/permissions.guard.ts` (2 throws) -> `permissions.guard.spec.ts` (10 error assertions)
  - `guards/roles.guard.ts` (2 throws) -> `roles.guard.spec.ts` (7 error assertions)
  - `guards/oauth-link.guard.ts` (2 throws) -> `oauth-link.guard.spec.ts` (10 error assertions)
  - `oauth-auth.service.ts` (2 throws) -> `oauth-auth.service.spec.ts` (6 error assertions)
  - `oauth.controller.ts` (2 throws) -> `oauth.controller.spec.ts` (9 error assertions)
- **Standard**: ISO 25010 Testability

### T-12: Mock cleanup
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: 37 out of 42 test files call `jest.clearAllMocks()` in `beforeEach` blocks. Confirmed across all major suites: `auth.service.spec.ts`, `auth.controller.spec.ts`, `mfa.service.spec.ts`, `mfa.controller.spec.ts`, `passkey.service.spec.ts`, `passkey.controller.spec.ts`, `oauth-auth.service.spec.ts`, `oauth.controller.spec.ts`, `oauth-exchange.spec.ts`, `oauth-code.store.spec.ts`, `oauth-state.store.spec.ts`, `oauth-link-code.store.spec.ts`, `oauth-link.guard.spec.ts`, `oauth-guards.spec.ts`, `oauth-callback.filter.spec.ts`, `google.strategy.spec.ts`, `github.strategy.spec.ts`, `jwt.strategy.spec.ts`, `roles.guard.spec.ts`, `permissions.guard.spec.ts`, `login-security.service.spec.ts`, `token-deny-list.service.spec.ts`, `trusted-device.service.spec.ts`, `password-breach.service.spec.ts`, `oauth-validate.helper.spec.ts`, `account.controller.spec.ts`, `session.controller.spec.ts`, plus all `auth-*.spec.ts` split files. The 5 files without explicit cleanup (`brute-force.spec.ts`, `hash-token.spec.ts`, `pkce-authenticate.spec.ts`, `rate-limiting.spec.ts`, `timing-attack.spec.ts`, `parse-duration.spec.ts`) are pure-function unit tests with no mocks requiring cleanup. Jest config does not set global `restoreMocks: true` but file-level cleanup is comprehensive.
- **Standard**: Test isolation

### T-13: Coverage thresholds enforced
- **Verdict**: WARN
- **Severity**: HIGH
- **Evidence**: `package.json` jest config (line 131-137) contains `coverageThreshold.global`:
  ```json
  { "branches": 80, "functions": 85, "lines": 90, "statements": 90 }
  ```
  Thresholds are **present and functional** (coverage tooling now works). However, configured values are **below project standards** defined in audit-standards.mdc (90/85/90/90):

| Metric | Configured | Project Standard | Gap |
|--------|-----------|-----------------|-----|
| Statements | 90% | 90% | None |
| Branches | 80% | 85% | **-5 points** |
| Functions | 85% | 90% | **-5 points** |
| Lines | 90% | 90% | None |

  Actual auth coverage exceeds both configured and standard thresholds (stmts 99.69%, branches 85.38%, funcs 99.39%, lines 99.69%). The concern is enforcement: if coverage regresses, the configured thresholds would allow values below project standards before failing the build.
- **Standard**: SOC 2 CC8.3

### T-14: E2E test existence
- **Verdict**: N/A
- **Severity**: MEDIUM
- **Evidence**: `test/auth-e2e/` directory exists with 3 E2E test files:
  - `auth-flows.e2e-spec.ts`
  - `mfa-flows.e2e-spec.ts`
  - `oauth-flows.e2e-spec.ts`

  E2E test infrastructure present with `jest-e2e.json` configuration. Marking N/A since E2E tests require live database/Redis services and are not runnable in this audit context.
- **Standard**: SOC 2 CC8.3

---

## Overall Project Coverage (reference)

| Metric | Value |
|--------|-------|
| Statements | 94.23% |
| Branches | 84.67% |
| Functions | 88.12% |
| Lines | 94.23% |

---

## Recommendations

1. **T-13 (WARN)**: Align jest `coverageThreshold` in `package.json` to match project standards: set `branches: 85` and `functions: 90`. Current auth coverage already exceeds these values, so no tests would break. This ensures regressions are caught at the correct threshold.

2. **T-10 (observation)**: Suite execution time grew from 17.8s to 103.6s (5.8x increase) due to doubling the test count. While still under the 120s threshold, monitor this trend. Consider `--shard` or parallelization if time approaches the limit.

3. **T-03/T-06 (observation)**: `auth.service.ts` branch coverage is 80.0% — the lowest among non-trivial auth files. Consider adding tests for edge-case branches in complex methods to provide additional margin above the 85% standard.
