---
schema: ai-specs/schemas/audit-phase-report.schema.yml
phase: 13
sub_phase: spec-code-drift
module: auth
audit_folder: ai-specs/changes/auth/audit/audit-2026-05-14T00-33
date: '2026-05-14T00:33:31Z'
framework_version: audit-standards.mdc v1.0
auditor: Claude (automated, audit-phase-13.py)
standards_covered:
- SOC 2 CC8.1 Change Documentation
- OpenAPI 3.0
- "ISO 25010 \xA74.2.7 Compliance \u2014 documentation accuracy"
checks_summary:
  pass: 6
  fail: 0
  warn: 0
  na: 2
  total: 8
overall_verdict: PASS
checks:
- check_id: D-01
  requirement: api-spec.yml exists + parses
  verdict: PASS
  severity: HIGH
  evidence: ai-specs/specs/api-spec.yml:1:openapi 3.0.0 with 80 paths
  standard: OpenAPI 3.0
- check_id: D-02
  requirement: No code-only endpoints
  verdict: PASS
  severity: HIGH
  evidence: 'live endpoints in auth/: 42 all documented in api-spec.yml'
  standard: SOC 2 CC8.1
- check_id: D-03
  requirement: No spec-only endpoints (module scope)
  verdict: PASS
  severity: MEDIUM
  evidence: 'spec endpoints in auth scope: 42 all implemented'
  standard: OpenAPI 3.0
- check_id: D-04
  requirement: Aligned endpoints have consistent method+path
  verdict: PASS
  severity: HIGH
  evidence: 'aligned endpoints: 0 method mismatches across 39 shared paths'
  standard: OpenAPI 3.0
- check_id: D-05
  requirement: data-model.md documents baseline-owned models
  verdict: PASS
  severity: HIGH
  evidence: 'baseline.prisma_models_owned (6) all in data-model.md Implementation Status table: [''EmailVerificationToken'',
    ''OAuthAccount'', ''PasswordResetToken'', ''Session'', ''TrustedDevice'', ''WebAuthnCredential'']'
  standard: SOC 2 CC8.1
- check_id: D-06
  requirement: data-model.md statuses match schema.prisma
  verdict: PASS
  severity: HIGH
  evidence: 'data-model.md Implementation Status rows: 21; all consistent with schema.prisma (10 models)'
  standard: SOC 2 CC8.1
- check_id: D-07
  requirement: "UI doc H3 \u2192 TSX file (dashboard only)"
  verdict: N/A
  severity: LOW
  evidence: "module=auth \u2014 UI checks N/A for backend modules"
- check_id: D-08
  requirement: "TSX file \u2192 UI doc H3 (dashboard only)"
  verdict: N/A
  severity: LOW
  evidence: "module=auth \u2014 UI checks N/A for backend modules"
---

# Fase 13 (Spec-Code Drift) — auth

Module: `auth`. Controller prefixes detected: ['/auth', '/auth/mfa', '/auth/passkeys'].
Spec endpoints in module scope: 42 (of 99 total). Live endpoints: 42. Prisma models live: 10. data-model rows: 21.

## Summary

| Verdict | Count |
|---|---|
| PASS | 6 |
| FAIL | 0 |
| WARN | 0 |
| N/A  | 2 |

**Overall: PASS**

## Detailed Findings

### D-01: api-spec.yml exists + parses

- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `ai-specs/specs/api-spec.yml:1:openapi 3.0.0 with 80 paths`
- **Standard**: OpenAPI 3.0

### D-02: No code-only endpoints

- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `live endpoints in auth/: 42 all documented in api-spec.yml`
- **Standard**: SOC 2 CC8.1

### D-03: No spec-only endpoints (module scope)

- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `spec endpoints in auth scope: 42 all implemented`
- **Standard**: OpenAPI 3.0

### D-04: Aligned endpoints have consistent method+path

- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `aligned endpoints: 0 method mismatches across 39 shared paths`
- **Standard**: OpenAPI 3.0

### D-05: data-model.md documents baseline-owned models

- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `baseline.prisma_models_owned (6) all in data-model.md Implementation Status table: ['EmailVerificationToken', 'OAuthAccount', 'PasswordResetToken', 'Session', 'TrustedDevice', 'WebAuthnCredential']`
- **Standard**: SOC 2 CC8.1

### D-06: data-model.md statuses match schema.prisma

- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `data-model.md Implementation Status rows: 21; all consistent with schema.prisma (10 models)`
- **Standard**: SOC 2 CC8.1

### D-07: UI doc H3 → TSX file (dashboard only)

- **Verdict**: N/A
- **Severity**: LOW
- **Evidence**: `module=auth — UI checks N/A for backend modules`

### D-08: TSX file → UI doc H3 (dashboard only)

- **Verdict**: N/A
- **Severity**: LOW
- **Evidence**: `module=auth — UI checks N/A for backend modules`

## Recommendations

_No corrective actions required._
