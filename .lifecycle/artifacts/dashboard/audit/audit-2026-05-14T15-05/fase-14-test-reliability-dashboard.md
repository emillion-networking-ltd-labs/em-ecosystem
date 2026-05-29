---
schema: ai-specs/schemas/audit-phase-report.schema.yml
phase: 14
sub_phase: test-reliability
module: dashboard
audit_folder: ai-specs/changes/dashboard/audit/audit-2026-05-14T15-05
date: '2026-05-14T15:05:31Z'
framework_version: audit-standards.mdc v1.0
auditor: Claude (automated, audit-phase-14.py)
standards_covered:
- "ISO 25010 \xA74.1.3 Testability"
- "ISO 25010 \xA74.2.4 Maturity (fault tolerance via tests)"
- SOC 2 CC7.1 Quality assurance
- CISQ ASCMM-PER-44 Tests must execute and pass
checks_summary:
  pass: 0
  fail: 0
  warn: 0
  na: 8
  total: 8
overall_verdict: PASS
checks:
- check_id: T-01
  requirement: Test files discoverable for module
  verdict: N/A
  severity: LOW
  evidence: "src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module \u2014 Phase 14 N/A for frontend\
    \ / non-NestJS modules)"
- check_id: T-02
  requirement: No .skip/.only/xit/xdescribe markers
  verdict: N/A
  severity: LOW
  evidence: "src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module \u2014 Phase 14 N/A for frontend\
    \ / non-NestJS modules)"
- check_id: T-03
  requirement: No console.* in test files
  verdict: N/A
  severity: LOW
  evidence: "src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module \u2014 Phase 14 N/A for frontend\
    \ / non-NestJS modules)"
- check_id: T-04
  requirement: controller/service/guard/strategy files have matching *.spec.ts
  verdict: N/A
  severity: LOW
  evidence: "src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module \u2014 Phase 14 N/A for frontend\
    \ / non-NestJS modules)"
- check_id: T-05
  requirement: Unit specs mock I/O (no raw prisma/fetch/axios)
  verdict: N/A
  severity: LOW
  evidence: "src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module \u2014 Phase 14 N/A for frontend\
    \ / non-NestJS modules)"
- check_id: T-06
  requirement: Coverage meets project thresholds (--run-tests)
  verdict: N/A
  severity: LOW
  evidence: "src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module \u2014 Phase 14 N/A for frontend\
    \ / non-NestJS modules)"
- check_id: T-07
  requirement: No flaky-test escape hatches
  verdict: N/A
  severity: LOW
  evidence: "src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module \u2014 Phase 14 N/A for frontend\
    \ / non-NestJS modules)"
- check_id: T-08
  requirement: Test files use *.spec.ts convention
  verdict: N/A
  severity: LOW
  evidence: "src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module \u2014 Phase 14 N/A for frontend\
    \ / non-NestJS modules)"
---

# Fase 14 (Test Reliability) — dashboard

Module: `dashboard`. Spec files: 0. Production files: 0. Runtime check (T-06): disabled (--run-tests not set).

## Summary

| Verdict | Count |
|---|---|
| PASS | 0 |
| FAIL | 0 |
| WARN | 0 |
| N/A  | 8 |

**Overall: PASS**

## Detailed Findings

### T-01: Test files discoverable for module

- **Verdict**: N/A
- **Severity**: LOW
- **Evidence**: `src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module — Phase 14 N/A for frontend / non-NestJS modules)`

### T-02: No .skip/.only/xit/xdescribe markers

- **Verdict**: N/A
- **Severity**: LOW
- **Evidence**: `src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module — Phase 14 N/A for frontend / non-NestJS modules)`

### T-03: No console.* in test files

- **Verdict**: N/A
- **Severity**: LOW
- **Evidence**: `src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module — Phase 14 N/A for frontend / non-NestJS modules)`

### T-04: controller/service/guard/strategy files have matching *.spec.ts

- **Verdict**: N/A
- **Severity**: LOW
- **Evidence**: `src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module — Phase 14 N/A for frontend / non-NestJS modules)`

### T-05: Unit specs mock I/O (no raw prisma/fetch/axios)

- **Verdict**: N/A
- **Severity**: LOW
- **Evidence**: `src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module — Phase 14 N/A for frontend / non-NestJS modules)`

### T-06: Coverage meets project thresholds (--run-tests)

- **Verdict**: N/A
- **Severity**: LOW
- **Evidence**: `src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module — Phase 14 N/A for frontend / non-NestJS modules)`

### T-07: No flaky-test escape hatches

- **Verdict**: N/A
- **Severity**: LOW
- **Evidence**: `src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module — Phase 14 N/A for frontend / non-NestJS modules)`

### T-08: Test files use *.spec.ts convention

- **Verdict**: N/A
- **Severity**: LOW
- **Evidence**: `src/dashboard/:1:module dir does not exist in nexacore-api/src (non-API module — Phase 14 N/A for frontend / non-NestJS modules)`

## Recommendations

_No corrective actions required._
