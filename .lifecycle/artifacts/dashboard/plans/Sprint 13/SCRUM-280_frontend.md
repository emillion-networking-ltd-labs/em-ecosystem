# Frontend Implementation Plan: SCRUM-280 Admin Pages UI Polish

## 1. Overview

Polish the 3 existing admin pages (User Management, Audit Logs, Permissions) to align with the ui-design-system.md tokens and match the styling patterns established in Sprint 13 (Settings page, Dashboard page).

Key issues: undersized page headings, missing breadcrumbs, hardcoded hex colors in badges, broken Tailwind token references in audit log action badges, inconsistent table styling (shadows, headers).

## 2. Architecture Context

### Files modified (no new files)
| File | Changes |
|------|---------|
| `src/app/admin/page.tsx` | Add breadcrumbs, fix h1 size |
| `src/app/admin/audit-logs/page.tsx` | Add breadcrumbs, fix h1 size |
| `src/app/admin/permissions/page.tsx` | Add breadcrumbs, fix h1 size |
| `src/components/admin/UsersTable.tsx` | Fix role badge colors to semantic tokens |
| `src/components/admin/AuditLogsTable.tsx` | Fix action badge tokens, add shadow-card, align header style |
| `src/components/admin/PermissionsMatrix.tsx` | Add shadow-card to table container |

### Files referenced (read-only)
| File | Purpose |
|------|---------|
| `src/components/ui/Breadcrumbs.tsx` | Reuse existing Breadcrumbs component |
| `tailwind.config.ts` | Verify available color tokens |
| `ui-design-system.md` | Source of truth for design tokens |

### Design token verification
Available semantic color tokens (from tailwind.config.ts):
- `error` / `error-bg` / `error-border`
- `warning` / `warning-bg` / `warning-border`
- `info` / `info-bg` / `info-border`
- `success` / `success-bg` / `success-border`
- NOT available: `status-success`, `status-error`, `status-info`, `status-warning`

## 3. Implementation Steps

### Step 0: Create Feature Branch
- **Action**: Create `feat/scrum-280-admin-polish`
- **Steps**:
  1. `cd em-ecosystem-code && git checkout main && git pull origin main`
  2. `git checkout -b feat/scrum-280-admin-polish`

### Step 1: Fix admin/page.tsx (User Management)
- **File**: `nexacore-dashboard/src/app/admin/page.tsx`
- **Changes**:
  1. Import `Breadcrumbs` from `@/components/ui/Breadcrumbs`
  2. Add breadcrumbs before h1: `[{ label: "Dashboards", href: "/dashboard" }, { label: "Admin", href: "/admin" }, { label: "User Management" }]`
  3. Change h1 from `text-body-sm font-semibold` to `text-heading-lg font-semibold`

### Step 2: Fix admin/audit-logs/page.tsx
- **File**: `nexacore-dashboard/src/app/admin/audit-logs/page.tsx`
- **Changes**:
  1. Import `Breadcrumbs`
  2. Add breadcrumbs: `[{ label: "Dashboards", href: "/dashboard" }, { label: "Admin", href: "/admin" }, { label: "Audit Logs" }]`
  3. Change h1 from `text-body-sm font-semibold` to `text-heading-lg font-semibold`

### Step 3: Fix admin/permissions/page.tsx
- **File**: `nexacore-dashboard/src/app/admin/permissions/page.tsx`
- **Changes**:
  1. Import `Breadcrumbs`
  2. Add breadcrumbs: `[{ label: "Dashboards", href: "/dashboard" }, { label: "Admin", href: "/admin" }, { label: "Permissions" }]`
  3. Change h1 from `text-body-sm font-semibold` to `text-heading-lg font-semibold`

### Step 4: Fix UsersTable.tsx role badge colors
- **File**: `nexacore-dashboard/src/components/admin/UsersTable.tsx`
- **Changes**:
  1. Replace hardcoded hex `bg-[#edeefc] text-[#4f507f]` (SUPERADMIN) with semantic tokens: `bg-warning-bg text-warning` (amber tones for highest privilege)
  2. Replace `bg-[#e6f1fd] text-info` (ADMIN) with `bg-info-bg text-info` (keeps info semantic but uses proper bg token)
  3. `USER` badge already uses `bg-surface-subtle text-content-secondary` — correct

### Step 5: Fix AuditLogsTable.tsx
- **File**: `nexacore-dashboard/src/components/admin/AuditLogsTable.tsx`
- **Changes**:
  1. Fix all `ACTION_COLORS` entries — replace `status-success` → `success`, `status-error` → `error`, `status-info` → `info`, `status-warning` → `warning`
  2. Add `shadow-card` to the table container div (matching UsersTable)
  3. Align header row style to match UsersTable: add `text-caption font-semibold uppercase tracking-wider text-content-tertiary` (replace current `font-medium text-content-secondary`)

### Step 6: Fix PermissionsMatrix.tsx
- **File**: `nexacore-dashboard/src/components/admin/PermissionsMatrix.tsx`
- **Changes**:
  1. Add `shadow-card` to the table container div

### Step 7: Build verification
- **Action**: Run `npx next build`
- **Steps**:
  1. Verify all pages compile
  2. Fix any TypeScript errors

## 4. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Fix admin/page.tsx
3. Step 2: Fix admin/audit-logs/page.tsx
4. Step 3: Fix admin/permissions/page.tsx
5. Step 4: Fix UsersTable role badges
6. Step 5: Fix AuditLogsTable
7. Step 6: Fix PermissionsMatrix
8. Step 7: Build verification

## 5. Testing Checklist

- [ ] Build passes (`npx next build`) with no errors
- [ ] All 3 admin pages show breadcrumbs (Dashboards > Admin > [Page])
- [ ] All 3 admin page headings are 24px (text-heading-lg)
- [ ] UsersTable role badges use semantic colors (no hardcoded hex)
- [ ] AuditLogsTable action badges render colors correctly
- [ ] All table containers have consistent shadow-card
- [ ] All table headers use consistent uppercase/tracking-wider style

## 6. UI/UX Considerations

- Breadcrumb hierarchy: Dashboards → Admin → [specific page]
- Admin page (User Management) is the parent — links from Audit Logs and Permissions breadcrumbs
- Role badge colors: SUPERADMIN=warning (amber), ADMIN=info (blue), USER=neutral

## 7. Dependencies

- No new dependencies
- Uses existing: Breadcrumbs component

## 8. Notes

- No backend changes required
- All changes are purely cosmetic/styling
- AuditLogsTable action badges were likely broken (invisible colors) due to nonexistent Tailwind classes
