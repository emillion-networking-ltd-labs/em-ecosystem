# Frontend Implementation Plan: SCRUM-352 — Audit Loading & Empty States (Phase A)

## 2. Overview

Audit deliverable (NO code in `em-ecosystem-code`). Same lifecycle pattern as SCRUM-329 Part A: produce an audit-table.md + canonical patterns + sub-ticket clusters. Implementation lands in B1-B6 sub-tickets.

## 3. Architecture Context

Audit covers all dashboard surfaces that render empty, error, or loading states:
- `src/components/profile/` (4 AUTH-related components)
- `src/components/admin/` (tables + matrix + activity feed)
- `src/components/dashboard/` (charts + cards)
- `src/components/ui/` (DataTable, EmptyState, Spinner family)
- `src/components/guards/` (auth route guards)
- `src/app/auth/callback`, `src/app/verify-email-change` (page loaders)

## 4. Implementation Steps

### Step 0 — Feature branch (skipped — docs-only in ai-specs)

This audit is doc-only and commits directly to ai-specs main (same as SCRUM-329 Part A pattern).

### Step 1 — Inventory dashboard surfaces

Grep production code for: EmptyState usage, Spinner variants, inline `<p>Loading</p>`, inline empty text, "No data" patterns, loading boolean state.

### Step 2 — Catalog findings

Produce audit-table.md with columns: Component | File:Line | Type | Current pattern | Recommended canonical pattern | Severity | Sub-ticket cluster.

### Step 3 — Define canonical patterns

Document binding rules for empty states, error states, section/page loaders, button loaders, table loaders. These become normative for future code.

### Step 4 — Create B1-B6 sub-tickets

For each cluster identified in audit, create Jira sub-ticket linked to SCRUM-352 as parent.

### Step 5 — Update ui-design-system.md

Add the canonical patterns section to the SSoT doc. This is the only "code-touching" delta and lands in ai-specs.

## 5. Implementation Order

1. Investigation (multi-grep + sample reads)
2. Write audit-table.md
3. Create B1-B6 sub-tickets in Jira
4. (Optionally) Update ui-design-system.md with canonical patterns — recommended for sub-tickets to reference

## 6. Testing Checklist

- [ ] audit-table.md lists 100% of dashboard surfaces with relevant states
- [ ] Each finding has Severity + sub-ticket cluster mapping
- [ ] Canonical patterns §0.1-0.5 defined
- [ ] B1-B6 sub-tickets created in Jira, parent SCRUM-352

## 9. Dependencies

None — pure analysis + documentation.

## 10. Notes

- This is the SCRUM-329 Part A pattern for a different domain (loading/empty states vs UI component spec).
- AUTH-relevant findings: 4 of the 8 HIGH severity items are in profile components used post-auth.
- Implementation strictly in B1-B6 — DO NOT shift implementation here.

## 11. Next Steps After Implementation

1. `/verify SCRUM-352`
2. `/commit SCRUM-352` (NOT em-ecosystem — ai-specs only, no PR)
3. `/update-docs SCRUM-352`
4. Continue with SCRUM-322 (overlap with B1 — same 4 profile components) or pause to plan B-cluster execution order.

## 12. Implementation Verification

- [ ] AC1: audit-table.md exists at canonical path with 100% surface coverage
- [ ] AC2: Canonical patterns defined for 5 dimensions (empty, error, section loader, button loader, table)
- [ ] AC3: All findings classified by severity + mapped to B1-B6
- [ ] AC4: 6 sub-tickets created in Jira, linked to SCRUM-352
- [ ] AC5: ui-design-system.md updated with canonical patterns (recommended in `/update-docs`)
