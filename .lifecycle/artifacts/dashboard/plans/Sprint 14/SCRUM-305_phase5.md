# SCRUM-305 Phase 5 — Plan: Toggle, Checkbox, Select, Input alignment

## Scope
Frontend

## Analysis

### Toggle — OK
- GlobalSettings.tsx: 2x Toggle → imports from `ui/Toggle`, default md ✅
- UserPreferences.tsx: 1x Toggle → imports from `ui/Toggle`, default md ✅
- Add explicit `size="md"` for clarity

### Checkbox — inline found
- PermissionsMatrix.tsx: 3x inline `<input type="checkbox">` → should use `<Checkbox>`

### Select — inline found
- UserPreferences.tsx:86 — inline `<select>` for Language → should use `<Select>`
- AuditLogFilters.tsx:51 — inline `<select>` for action filter → should use `<Select>`
- admin/page.tsx:231 — inline `<select>` for role filter → should use `<Select>`

### Input — inline found
- admin/page.tsx:180 — inline `<input>` for search → should use `<Input>`
- AuditLogFilters.tsx:67,77,84 — inline `<input>` for search/date filters → should use `<Input>`

## Steps

### Step 1 — Toggle: add explicit size="md"
Files: GlobalSettings.tsx, UserPreferences.tsx

### Step 2 — PermissionsMatrix: inline checkbox → Checkbox component
File: PermissionsMatrix.tsx (3 instances)

### Step 3 — Inline select → Select component
Files: UserPreferences.tsx, AuditLogFilters.tsx, admin/page.tsx

### Step 4 — Inline input → Input component
Files: admin/page.tsx, AuditLogFilters.tsx

### Step 5 — Build verification
