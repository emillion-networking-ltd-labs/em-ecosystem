# Fase 2: TESTS — Auth

**Date**: 2026-03-12 01:55
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: ISO 25010 §4.2.6, SOC 2 CC8.3, IEEE 829

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 11    |
| FAIL    | 1     |
| WARN    | 2     |
| N/A     | 0     |

**Overall**: FAIL (1 FAIL finding)

---

## Detailed Findings

### T-01: All tests pass
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: 21 test suites, 446 tests — all passed. Execution time: 67.92s.
- **Standard**: SOC 2 CC8.3

### T-02: Coverage: statements
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Auth module statements: 97.61% (threshold: ≥90%). Per-file: auth.controller.ts 98.74%, auth.service.ts 95.39%, mfa.service.ts 96.82%, passkey.service.ts 100%, trusted-device.service.ts 100%.
- **Standard**: ISO 25010 Testability

### T-03: Coverage: branches
- **Verdict**: WARN
- **Severity**: HIGH
- **Evidence**: Auth module branches: 84.64% (threshold: ≥85%). Misses threshold by 0.36%. Lowest: auth.controller.ts 77.9%, mfa.controller.ts 68.96%, passkey.controller.ts 69.69%. Controller branch coverage is low due to decorator/guard paths not counted.
- **Expected**: ≥85% branch coverage
- **Actual**: 84.64% — marginally below threshold
- **Standard**: ISO 25010 Testability

### T-04: Coverage: functions
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Auth module functions: 90.9% (threshold: ≥90%)
- **Standard**: ISO 25010 Testability

### T-05: Coverage: lines
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Auth module lines: 97.75% (threshold: ≥90%)
- **Standard**: ISO 25010 Testability

### T-06: Per-file coverage
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: All auth files above 90% statements except auth.service.ts (95.39%) and auth/dto register.dto.ts (88.88%). DTOs have reduced expectation (×1.5 multiplier). Uncovered lines in auth.service.ts: 64, 361, 425-430, 558, 571, 606-617, 709.
- **Standard**: ISO 25010 Testability

### T-07: Untested exports
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: All auth services, controllers, guards, strategies, and stores have corresponding spec files. 21 spec files cover all public APIs.

### T-08: Mock fidelity
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Spec files use `@nestjs/testing` TestingModule with proper mock providers matching real constructor signatures. Mock cleanup via `jest.clearAllMocks()` or `afterEach` present in 12 of 21 spec files.
- **Standard**: IEEE 829

### T-09: No skipped tests
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: 0 occurrences of `it.skip`, `describe.skip`, `test.skip`, `xit`, `xdescribe`, `it.only`, `describe.only`, `test.only` in auth test files.

### T-10: Test execution time
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Total auth suite: 67.92s (threshold: ≤120s). Slowest: auth.controller.spec.ts 56.286s (close to per-test threshold but acceptable as full controller suite). All other suites < 5s.

### T-12: Mock cleanup
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: 18 occurrences of `afterEach`/`restoreAllMocks`/`clearAllMocks` across 12 spec files. Remaining 9 files use fresh `TestingModule` per `describe` block, which implicitly isolates.

### T-13: Coverage thresholds enforced
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `package.json:117-124` — `coverageThreshold.global`: branches 85%, functions 90%, lines 90%, statements 90%. Matches project standards.
- **Standard**: SOC 2 CC8.3

### T-14: E2E test existence
- **Verdict**: FAIL
- **Severity**: MEDIUM
- **Evidence**: No `test/` or `tests/e2e/` directory exists with E2E tests. `test:e2e` script references `./test/jest-e2e.json` which does not exist. The auth module's critical flows (login → MFA → session) have no end-to-end integration tests.
- **Expected**: At least one E2E test for auth critical flow
- **Actual**: No E2E test directory or files found
- **Standard**: SOC 2 CC8.3

---

## Recommendations

1. **T-14** (FAIL): Create `test/auth.e2e-spec.ts` with at least: (1) register → verify email → login flow, (2) login → MFA challenge → verify flow, (3) OAuth callback → exchange flow. Use `@nestjs/testing` with real Prisma + Redis connections.
2. **T-03** (WARN): Improve branch coverage in auth.controller.ts (77.9%), mfa.controller.ts (68.96%), passkey.controller.ts (69.69%) — add tests for guard rejection paths and edge case branches.
