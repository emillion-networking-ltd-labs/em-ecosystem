---
schema: ai-specs/schemas/audit-phase-report.schema.yml
phase: 13
sub_phase: spec-code-drift
module: dashboard
audit_folder: ai-specs/changes/dashboard/audit/audit-2026-05-14T00-33
date: '2026-05-14T00:33:33Z'
framework_version: audit-standards.mdc v1.0
auditor: Claude (automated, audit-phase-13.py)
standards_covered:
- SOC 2 CC8.1 Change Documentation
- OpenAPI 3.0
- "ISO 25010 \xA74.2.7 Compliance \u2014 documentation accuracy"
checks_summary:
  pass: 3
  fail: 0
  warn: 2
  na: 3
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
  verdict: N/A
  severity: HIGH
  evidence: no controllers found for module dashboard
- check_id: D-03
  requirement: No spec-only endpoints (module scope)
  verdict: N/A
  severity: MEDIUM
  evidence: no spec endpoints match dashboard controllers prefixes
- check_id: D-04
  requirement: Aligned endpoints have consistent method+path
  verdict: PASS
  severity: HIGH
  evidence: 'aligned endpoints: 0 method mismatches across 0 shared paths'
  standard: OpenAPI 3.0
- check_id: D-05
  requirement: data-model.md documents baseline-owned models
  verdict: N/A
  severity: HIGH
  evidence: "module dashboard has no stable-baseline.md \u2192 no canonical owned-models list"
- check_id: D-06
  requirement: data-model.md statuses match schema.prisma
  verdict: PASS
  severity: HIGH
  evidence: 'data-model.md Implementation Status rows: 21; all consistent with schema.prisma (10 models)'
  standard: SOC 2 CC8.1
- check_id: D-07
  requirement: "UI doc H3 \u2192 TSX file (dashboard only)"
  verdict: WARN
  severity: LOW
  evidence: doc has 8 H3s without matching TSX file
  expected: each H3 in ui-design-system has a TSX file
  actual: 'doc-only: [''Analytics Graph'', ''Button Set'', ''Card'', ''Checkboxes'', ''Context Menu'']...'
  recommendation: Some H3s may be conceptual (e.g., "Sidebar Items"). Rename or create the component file as appropriate.
  instances:
  - file: ui-design-system.md
    line: 1
    excerpt: Card
  - file: ui-design-system.md
    line: 1
    excerpt: Sidebar Items
  - file: ui-design-system.md
    line: 1
    excerpt: Modal
  - file: ui-design-system.md
    line: 1
    excerpt: Context Menu
  - file: ui-design-system.md
    line: 1
    excerpt: Analytics Graph
  - file: ui-design-system.md
    line: 1
    excerpt: Button Set
  - file: ui-design-system.md
    line: 1
    excerpt: Toast Message
  - file: ui-design-system.md
    line: 1
    excerpt: Checkboxes
- check_id: D-08
  requirement: "TSX file \u2192 UI doc H3 (dashboard only)"
  verdict: WARN
  severity: LOW
  evidence: 6 TSX components without ui-design-system H3
  expected: each TSX component documented
  actual: 'code-only: [''Button'', ''Checkbox'', ''ConfirmModal'', ''SearchTrigger'', ''SidebarNav'']...'
  recommendation: Add H3 sections in ui-design-system.md for the undocumented components
  instances:
  - file: components/ui/Button.tsx
    line: 1
    excerpt: Button
  - file: components/ui/Checkbox.tsx
    line: 1
    excerpt: Checkbox
  - file: components/ui/ConfirmModal.tsx
    line: 1
    excerpt: ConfirmModal
  - file: components/ui/SearchTrigger.tsx
    line: 1
    excerpt: SearchTrigger
  - file: components/ui/SidebarNav.tsx
    line: 1
    excerpt: SidebarNav
  - file: components/ui/Toast.tsx
    line: 1
    excerpt: Toast
---

# Fase 13 (Spec-Code Drift) — dashboard

Module: `dashboard`. Controller prefixes detected: (none).
Spec endpoints in module scope: 0 (of 99 total). Live endpoints: 0. Prisma models live: 10. data-model rows: 21.

## Summary

| Verdict | Count |
|---|---|
| PASS | 3 |
| FAIL | 0 |
| WARN | 2 |
| N/A  | 3 |

**Overall: PASS**

## Detailed Findings

### D-01: api-spec.yml exists + parses

- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `ai-specs/specs/api-spec.yml:1:openapi 3.0.0 with 80 paths`
- **Standard**: OpenAPI 3.0

### D-02: No code-only endpoints

- **Verdict**: N/A
- **Severity**: HIGH
- **Evidence**: `no controllers found for module dashboard`

### D-03: No spec-only endpoints (module scope)

- **Verdict**: N/A
- **Severity**: MEDIUM
- **Evidence**: `no spec endpoints match dashboard controllers prefixes`

### D-04: Aligned endpoints have consistent method+path

- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `aligned endpoints: 0 method mismatches across 0 shared paths`
- **Standard**: OpenAPI 3.0

### D-05: data-model.md documents baseline-owned models

- **Verdict**: N/A
- **Severity**: HIGH
- **Evidence**: `module dashboard has no stable-baseline.md → no canonical owned-models list`

### D-06: data-model.md statuses match schema.prisma

- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `data-model.md Implementation Status rows: 21; all consistent with schema.prisma (10 models)`
- **Standard**: SOC 2 CC8.1

### D-07: UI doc H3 → TSX file (dashboard only)

- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `doc has 8 H3s without matching TSX file`
- **Expected**: each H3 in ui-design-system has a TSX file
- **Actual**: doc-only: ['Analytics Graph', 'Button Set', 'Card', 'Checkboxes', 'Context Menu']...
- **Recommendation**: Some H3s may be conceptual (e.g., "Sidebar Items"). Rename or create the component file as appropriate.
- **Instances**:
  - `ui-design-system.md:1:Card`
  - `ui-design-system.md:1:Sidebar Items`
  - `ui-design-system.md:1:Modal`
  - `ui-design-system.md:1:Context Menu`
  - `ui-design-system.md:1:Analytics Graph`
  - `ui-design-system.md:1:Button Set`
  - `ui-design-system.md:1:Toast Message`
  - `ui-design-system.md:1:Checkboxes`

### D-08: TSX file → UI doc H3 (dashboard only)

- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `6 TSX components without ui-design-system H3`
- **Expected**: each TSX component documented
- **Actual**: code-only: ['Button', 'Checkbox', 'ConfirmModal', 'SearchTrigger', 'SidebarNav']...
- **Recommendation**: Add H3 sections in ui-design-system.md for the undocumented components
- **Instances**:
  - `components/ui/Button.tsx:1:Button`
  - `components/ui/Checkbox.tsx:1:Checkbox`
  - `components/ui/ConfirmModal.tsx:1:ConfirmModal`
  - `components/ui/SearchTrigger.tsx:1:SearchTrigger`
  - `components/ui/SidebarNav.tsx:1:SidebarNav`
  - `components/ui/Toast.tsx:1:Toast`

## Recommendations

- **D-07** (WARN): Some H3s may be conceptual (e.g., "Sidebar Items"). Rename or create the component file as appropriate.
- **D-08** (WARN): Add H3 sections in ui-design-system.md for the undocumented components
