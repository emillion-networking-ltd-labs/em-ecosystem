# SCRUM-305 Phase 6 — Plan: Date input component

## Scope
Frontend

## Context
AuditLogFilters uses 2x native `<input type="date">` for date range filtering.
These are the only date inputs in the dashboard. The design system Input
component does not support type="date" with native calendar popup.

## Steps

### Step 1 — Create DateInput component
**File**: `src/components/ui/DateInput.tsx` (new)
- Wraps native `<input type="date">` with design system styling
- Props: value, onChange, placeholder, size (sm/md), disabled, className
- Styles: rounded-md, border-border-strong, bg-transparent, text-body
- Matches Input component dimensions (h-8 sm, h-10 md)

### Step 2 — Document in showcase
- Add DateInput to Input showcase section
- Light/dark preview

### Step 3 — Migrate AuditLogFilters
**File**: `src/components/admin/AuditLogFilters.tsx`
- 2x native `<input type="date">` → `<DateInput>`

### Step 4 — Registry update
- Add DateInput to Input entry files list

### Step 5 — Build verification
