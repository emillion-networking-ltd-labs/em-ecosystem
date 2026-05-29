# Frontend Implementation Plan: SCRUM-305 Phase 15 — Component Token Compliance

## Overview
Replace remaining inline badge patterns with the Badge component. Ensure Design System showcase uses correct badge sizes consistent with project standard (sm). Retroactive plan — work already implemented.

## Steps

### 15.1 GlobalSettings inline badges → Badge component
- **File**: `GlobalSettings.tsx`
- **Changes**:
  - Import `Badge` from `@/components/ui/Badge`
  - "Admin" label: `<span className="rounded-lg bg-black/[0.04] ...">` → `<Badge variant="default" size="sm">Admin</Badge>`
  - "Production" label: `<span className="rounded-lg bg-success/10 ...">` → `<Badge variant="info" size="sm">Production</Badge>`
  - Removes `bg-success/10` opacity modifier (design system violation — same principle as `text-content-primary/50`)
  - `variant="info"` chosen over `success` — "Production" is an environment label (informational), not a completed action

### 15.2 Design System catalog badge size
- **File**: `design-system/page.tsx`
- **Change**: Category badges on component cards `size="md"` → `size="sm"` — consistent with project standard where all badges use sm

## Files Changed (2)
- `GlobalSettings.tsx`
- `design-system/page.tsx`

## Rationale
Project convention: never use inline styles that replicate component behavior. Badge component handles variants, sizes, and dark mode automatically. Opacity modifiers on semantic tokens (`bg-success/10`) bypass the token system.
