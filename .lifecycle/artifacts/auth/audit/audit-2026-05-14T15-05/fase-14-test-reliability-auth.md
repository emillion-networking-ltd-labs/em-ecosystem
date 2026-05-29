---
schema: ai-specs/schemas/audit-phase-report.schema.yml
phase: 14
sub_phase: test-reliability
module: auth
audit_folder: ai-specs/changes/auth/audit/audit-2026-05-14T15-05
date: '2026-05-14T15:05:31Z'
framework_version: audit-standards.mdc v1.0
auditor: Claude (automated, audit-phase-14.py)
standards_covered:
- "ISO 25010 \xA74.1.3 Testability"
- "ISO 25010 \xA74.2.4 Maturity (fault tolerance via tests)"
- SOC 2 CC7.1 Quality assurance
- CISQ ASCMM-PER-44 Tests must execute and pass
checks_summary:
  pass: 6
  fail: 0
  warn: 1
  na: 1
  total: 8
overall_verdict: PASS
checks:
- check_id: T-01
  requirement: Test files discoverable for module
  verdict: PASS
  severity: HIGH
  evidence: tests/account.controller.spec.ts:1:43 spec files discovered
  standard: "ISO 25010 \xA74.1.3"
- check_id: T-02
  requirement: No .skip/.only/xit/xdescribe markers
  verdict: PASS
  severity: HIGH
  evidence: '43 spec files scanned: 0 .skip/.only/xit/xdescribe markers'
  standard: CISQ ASCMM-PER-44
- check_id: T-03
  requirement: No console.* in test files
  verdict: PASS
  severity: LOW
  evidence: '43 spec files scanned: 0 console.* calls'
  standard: SOC 2 CC7.1
- check_id: T-04
  requirement: controller/service/guard/strategy files have matching *.spec.ts
  verdict: WARN
  severity: MEDIUM
  evidence: src/auth/email-verification.service.ts:1:expected email-verification.service.spec.ts (missing)
  expected: every controller/service/guard/strategy file has a matching *.spec.ts by name (canonical convention)
  actual: "10 source files without a name-matching spec \u2014 may be tested under a theme-based spec name (verify via T-06\
    \ coverage)"
  standard: "ISO 25010 \xA74.1.3"
  recommendation: "Either rename existing theme-based spec to canonical convention, OR confirm coverage via T-06. Heuristic\
    \ only \u2014 coverage is authoritative."
  instances:
  - file: src/auth/email-verification.service.ts
    line: 1
    excerpt: no spec named email-verification.service.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)
  - file: src/auth/guards/base-oauth-auth.guard.ts
    line: 1
    excerpt: no spec named base-oauth-auth.guard.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)
  - file: src/auth/guards/github-auth.guard.ts
    line: 1
    excerpt: no spec named github-auth.guard.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)
  - file: src/auth/guards/google-auth.guard.ts
    line: 1
    excerpt: no spec named google-auth.guard.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)
  - file: src/auth/guards/jwt-auth.guard.ts
    line: 1
    excerpt: no spec named jwt-auth.guard.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)
  - file: src/auth/guards/jwt-or-mfa-setup.guard.ts
    line: 1
    excerpt: no spec named jwt-or-mfa-setup.guard.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)
  - file: src/auth/guards/mfa-setup.guard.ts
    line: 1
    excerpt: no spec named mfa-setup.guard.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)
  - file: src/auth/login.service.ts
    line: 1
    excerpt: no spec named login.service.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)
  - file: src/auth/password-reset.service.ts
    line: 1
    excerpt: no spec named password-reset.service.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)
  - file: src/auth/token.service.ts
    line: 1
    excerpt: no spec named token.service.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)
- check_id: T-05
  requirement: Unit specs mock I/O (no raw prisma/fetch/axios)
  verdict: PASS
  severity: MEDIUM
  evidence: '43 unit spec files: 0 raw prisma/fetch/axios calls (mocking enforced)'
  standard: "ISO 25010 \xA74.1.3"
- check_id: T-06
  requirement: Coverage meets project thresholds (--run-tests)
  verdict: N/A
  severity: HIGH
  evidence: coverage check is opt-in (--run-tests not set)
- check_id: T-07
  requirement: No flaky-test escape hatches
  verdict: PASS
  severity: MEDIUM
  evidence: '43 spec files: 0 flaky-test escape hatches'
  standard: "ISO 25010 \xA74.2.4"
- check_id: T-08
  requirement: Test files use *.spec.ts convention
  verdict: PASS
  severity: LOW
  evidence: auth/:1:0 *.test.ts files (convention is *.spec.ts)
  standard: Project convention
---

# Fase 14 (Test Reliability) — auth

Module: `auth`. Spec files: 43. Production files: 69. Runtime check (T-06): disabled (--run-tests not set).

## Summary

| Verdict | Count |
|---|---|
| PASS | 6 |
| FAIL | 0 |
| WARN | 1 |
| N/A  | 1 |

**Overall: PASS**

## Detailed Findings

### T-01: Test files discoverable for module

- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `tests/account.controller.spec.ts:1:43 spec files discovered`
- **Standard**: ISO 25010 §4.1.3

### T-02: No .skip/.only/xit/xdescribe markers

- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `43 spec files scanned: 0 .skip/.only/xit/xdescribe markers`
- **Standard**: CISQ ASCMM-PER-44

### T-03: No console.* in test files

- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: `43 spec files scanned: 0 console.* calls`
- **Standard**: SOC 2 CC7.1

### T-04: controller/service/guard/strategy files have matching *.spec.ts

- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: `src/auth/email-verification.service.ts:1:expected email-verification.service.spec.ts (missing)`
- **Expected**: every controller/service/guard/strategy file has a matching *.spec.ts by name (canonical convention)
- **Actual**: 10 source files without a name-matching spec — may be tested under a theme-based spec name (verify via T-06 coverage)
- **Standard**: ISO 25010 §4.1.3
- **Recommendation**: Either rename existing theme-based spec to canonical convention, OR confirm coverage via T-06. Heuristic only — coverage is authoritative.
- **Instances**:
  - `src/auth/email-verification.service.ts:1:no spec named email-verification.service.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)`
  - `src/auth/guards/base-oauth-auth.guard.ts:1:no spec named base-oauth-auth.guard.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)`
  - `src/auth/guards/github-auth.guard.ts:1:no spec named github-auth.guard.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)`
  - `src/auth/guards/google-auth.guard.ts:1:no spec named google-auth.guard.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)`
  - `src/auth/guards/jwt-auth.guard.ts:1:no spec named jwt-auth.guard.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)`
  - `src/auth/guards/jwt-or-mfa-setup.guard.ts:1:no spec named jwt-or-mfa-setup.guard.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)`
  - `src/auth/guards/mfa-setup.guard.ts:1:no spec named mfa-setup.guard.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)`
  - `src/auth/login.service.ts:1:no spec named login.service.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)`
  - `src/auth/password-reset.service.ts:1:no spec named password-reset.service.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)`
  - `src/auth/token.service.ts:1:no spec named token.service.spec.ts (theme-based naming, e.g. "auth-email.spec.ts", may cover it)`

### T-05: Unit specs mock I/O (no raw prisma/fetch/axios)

- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `43 unit spec files: 0 raw prisma/fetch/axios calls (mocking enforced)`
- **Standard**: ISO 25010 §4.1.3

### T-06: Coverage meets project thresholds (--run-tests)

- **Verdict**: N/A
- **Severity**: HIGH
- **Evidence**: `coverage check is opt-in (--run-tests not set)`

### T-07: No flaky-test escape hatches

- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `43 spec files: 0 flaky-test escape hatches`
- **Standard**: ISO 25010 §4.2.4

### T-08: Test files use *.spec.ts convention

- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: `auth/:1:0 *.test.ts files (convention is *.spec.ts)`
- **Standard**: Project convention

## Recommendations

- **T-04** (WARN): Either rename existing theme-based spec to canonical convention, OR confirm coverage via T-06. Heuristic only — coverage is authoritative.
