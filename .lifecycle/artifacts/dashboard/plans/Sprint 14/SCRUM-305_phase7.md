# SCRUM-305 Phase 7 — Plan: Migrate inline tables to DataTable

## Scope
Frontend

## Analysis

3 inline `<table>` elements not using DataTable component:

### UsersTable.tsx
- 5 columns: User, Email, Role, Status, Actions
- Actions column renders ActionDropdown (edit role, lock/unlock, delete)
- Row click: none
- DataTable `render` prop supports custom components — migration feasible

### AuditLogsTable.tsx
- 6 columns: Time, Action, User, Target, IP, Details
- Text/badge only — simplest migration
- Row hover already present

### PermissionsMatrix.tsx
- Dynamic columns: Resource + one per role (USER, ADMIN) + SUPERADMIN
- Grouped rows by resource category
- Cells contain Checkbox components
- Has save/cancel/reset buttons
- Most complex — DataTable needs to support row grouping or matrix renders via render prop

## Steps

### Step 1 — AuditLogsTable → DataTable
Simplest migration. Define 6 ColumnDef with render functions.

### Step 2 — UsersTable → DataTable
Define 5 ColumnDef. Actions column renders ActionDropdown via render prop.

### Step 3 — PermissionsMatrix → DataTable
Most complex. May need to render grouped sections or use DataTable per group.

### Step 4 — Build verification
