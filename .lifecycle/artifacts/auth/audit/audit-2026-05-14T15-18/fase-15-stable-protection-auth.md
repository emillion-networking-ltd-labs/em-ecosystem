---
schema: ai-specs/schemas/audit-phase-report.schema.yml
phase: 15
sub_phase: stable-protection
module: auth
audit_folder: ai-specs/changes/auth/audit/audit-2026-05-14T15-18
date: '2026-05-14T15:18:20Z'
framework_version: audit-standards.mdc v1.0
auditor: Claude (automated, audit-phase-15.py)
standards_covered:
- "ISO 25010 \xA74.2.5 Modifiability without regression"
- SOC 2 CC8.1 Change Documentation
- ISO 27001 A.14.2.2 System change control procedures
- CISQ ASCMM-PER-44 Tests must execute and pass
checks_summary:
  pass: 7
  fail: 0
  warn: 0
  na: 1
  total: 8
overall_verdict: PASS
checks:
- check_id: P-01
  requirement: Module is in stable scope (gating)
  verdict: PASS
  severity: INFO
  evidence: ai-specs/specs/modules/auth/module-charter.md:1:status=stable (in-scope)
  standard: Framework convention
- check_id: P-02
  requirement: Baseline file exists + schema-valid
  verdict: PASS
  severity: HIGH
  evidence: ai-specs/specs/modules/auth/stable-baseline.md:1:frontmatter valid (module=auth, baselined_at=2026-05-13)
  standard: Framework convention
- check_id: P-03
  requirement: "LOC delta within \xB120% (WARN)"
  verdict: PASS
  severity: MEDIUM
  evidence: "auth/:1:loc live=6178 baseline=6178 delta=+0.0% (tolerance \xB120.0%)"
  standard: "ISO 25010 \xA74.2.5"
- check_id: P-04
  requirement: "Production file count delta within \xB110 (WARN)"
  verdict: PASS
  severity: MEDIUM
  evidence: "auth/:1:files live=69 baseline=69 delta=+0 (tolerance \xB110)"
  standard: "ISO 25010 \xA74.2.5"
- check_id: P-05
  requirement: Public endpoint count unchanged
  verdict: PASS
  severity: HIGH
  evidence: auth/:1:endpoints live=42 baseline=42 delta=+0
  standard: SOC 2 CC8.1
- check_id: P-06
  requirement: Prisma models owned set unchanged
  verdict: PASS
  severity: CRITICAL
  evidence: schema.prisma:1:all 6 baseline-owned models present
  standard: ISO 27001 A.14.2.2
- check_id: P-07
  requirement: Public service exports unchanged
  verdict: PASS
  severity: HIGH
  evidence: auth.module.ts:1:public services unchanged (5)
  standard: SOC 2 CC8.1
- check_id: P-08
  requirement: "Coverage statements drop \u2264 2pp (--run-tests)"
  verdict: N/A
  severity: HIGH
  evidence: coverage drop check is opt-in (--run-tests not set)
---

# Fase 15 (Stable Protection) — auth

Module: `auth`. Charter status: `stable`. Phase 15 in-scope: yes. Runtime check (P-08): disabled (--run-tests not set).

## Summary

| Verdict | Count |
|---|---|
| PASS | 7 |
| FAIL | 0 |
| WARN | 0 |
| N/A  | 1 |

**Overall: PASS**

## Detailed Findings

### P-01: Module is in stable scope (gating)

- **Verdict**: PASS
- **Severity**: INFO
- **Evidence**: `ai-specs/specs/modules/auth/module-charter.md:1:status=stable (in-scope)`
- **Standard**: Framework convention

### P-02: Baseline file exists + schema-valid

- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `ai-specs/specs/modules/auth/stable-baseline.md:1:frontmatter valid (module=auth, baselined_at=2026-05-13)`
- **Standard**: Framework convention

### P-03: LOC delta within ±20% (WARN)

- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `auth/:1:loc live=6178 baseline=6178 delta=+0.0% (tolerance ±20.0%)`
- **Standard**: ISO 25010 §4.2.5

### P-04: Production file count delta within ±10 (WARN)

- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `auth/:1:files live=69 baseline=69 delta=+0 (tolerance ±10)`
- **Standard**: ISO 25010 §4.2.5

### P-05: Public endpoint count unchanged

- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth/:1:endpoints live=42 baseline=42 delta=+0`
- **Standard**: SOC 2 CC8.1

### P-06: Prisma models owned set unchanged

- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `schema.prisma:1:all 6 baseline-owned models present`
- **Standard**: ISO 27001 A.14.2.2

### P-07: Public service exports unchanged

- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.module.ts:1:public services unchanged (5)`
- **Standard**: SOC 2 CC8.1

### P-08: Coverage statements drop ≤ 2pp (--run-tests)

- **Verdict**: N/A
- **Severity**: HIGH
- **Evidence**: `coverage drop check is opt-in (--run-tests not set)`

## Recommendations

_No corrective actions required._
