# Frontend Implementation Plan: SCRUM-276 Sidebar Permission-Aware Navigation

## 1. Overview

Replace role-based navigation checks (`user.role === "ADMIN"`) with permission-based checks using the existing `usePermissions()` hook in `Sidebar.tsx` and `NavBar.tsx`. This enables fine-grained RBAC where each nav item's visibility is tied to a specific permission key rather than a hardcoded role comparison.

The permission system is already fully implemented:
- `PermissionsContext` provides `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()`, `isSuperAdmin`
- Backend serves permissions array per user (SUPERADMIN gets `['*']`)
- 9 permission keys defined: `dashboard:read`, `users:read/write/delete`, `audit-logs:read`, `permissions:read/write`, `settings:read/write`

## 2. Architecture Context

### Components affected
- `nexacore-dashboard/src/components/layout/Sidebar.tsx` — nav item rendering with role check
- `nexacore-dashboard/src/components/layout/NavBar.tsx` — user dropdown with role check

### Files referenced (verified from live code)
| File | Current State |
|------|--------------|
| `Sidebar.tsx` | Line 50: `const isAdmin = user?.role === "ADMIN" \|\| user?.role === "SUPERADMIN"` — used at line 107 to gate `adminItems` |
| `NavBar.tsx` | Line 41: `const isAdmin = user?.role === "ADMIN" \|\| user?.role === "SUPERADMIN"` — used at line 159 to gate Admin dropdown link |
| `PermissionsContext.tsx` | Lines 29-40: `hasPermission(key)` returns `isSuperAdmin \|\| permissionSet.has(key)` |
| `usePermissions.ts` | Re-exports `usePermissions` from `PermissionsContext` |
| `default-permissions.ts` | Role→permission mapping: USER=[dashboard:read, settings:read], ADMIN=[all except permissions:write] |

### Permission-to-NavItem Mapping
| Nav Item | Route | Required Permission | Visible to USER | Visible to ADMIN | Visible to SUPERADMIN |
|----------|-------|-------------------|-----------------|------------------|----------------------|
| Dashboard | `/dashboard` | None (always) | Yes | Yes | Yes |
| Profile | `/profile` | None (always) | Yes | Yes | Yes |
| Admin | `/admin` | `users:read` | No | Yes | Yes |
| Audit Logs | `/admin/audit-logs` | `audit-logs:read` | No | Yes | Yes |
| Permissions | `/admin/permissions` | `permissions:read` | No | Yes | Yes |
| Documentation | `/docs` | None (always) | Yes | Yes | Yes |
| NavBar Admin link | `/admin` (dropdown) | `users:read` | No | Yes | Yes |

## 3. Implementation Steps

### Step 0: Create Feature Branch
- **Action**: Create and switch to `feat/scrum-276-sidebar-permission-nav`
- **Implementation Steps**:
  1. `cd em-ecosystem-code/nexacore-dashboard`
  2. `git checkout main && git pull origin main`
  3. `git checkout -b feat/scrum-276-sidebar-permission-nav`
  4. Verify with `git branch`

### Step 1: Add permission field to nav item types and arrays in Sidebar.tsx
- **File**: `nexacore-dashboard/src/components/layout/Sidebar.tsx`
- **Action**: Add optional `permission` field to nav item definitions
- **Implementation Steps**:
  1. Add `permission?: string` to the nav item type (currently inline, add a named type)
  2. Add permission keys to `adminItems`:
     ```typescript
     const adminItems = [
       { href: "/admin", label: "Admin", icon: Shield, permission: "users:read" },
       { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText, permission: "audit-logs:read" },
       { href: "/admin/permissions", label: "Permissions", icon: Key, permission: "permissions:read" },
     ];
     ```
  3. `mainItems` and `accountItems` have no permission field → always visible

### Step 2: Replace role check with permission filtering in Sidebar.tsx
- **File**: `nexacore-dashboard/src/components/layout/Sidebar.tsx`
- **Action**: Replace `isAdmin` role check with `usePermissions()` + `hasPermission()` filtering
- **Implementation Steps**:
  1. Add import: `import { usePermissions } from "@/hooks/usePermissions";`
  2. Remove import of `useAuth` (no longer needed for role check — but still needed for `user` object in user card at bottom). Keep `useAuth` import.
  3. Replace line 50 (`const isAdmin = ...`) with:
     ```typescript
     const { hasPermission } = usePermissions();
     ```
  4. Replace the admin items rendering block (lines 107-118). Instead of `{isAdmin && adminItems.map(...)}`, merge all items and filter:
     ```typescript
     {[...mainItems, ...adminItems].filter(item => !item.permission || hasPermission(item.permission)).map((item) => (
       <NavItem key={item.href} {...item} active={...} collapsed={collapsed} onNavigate={onNavigate} />
     ))}
     ```
     Or keep the simpler pattern: render `adminItems` filtered by permission:
     ```typescript
     {adminItems
       .filter((item) => !item.permission || hasPermission(item.permission))
       .map((item) => (
         <NavItem key={item.href} {...item} active={...} collapsed={collapsed} onNavigate={onNavigate} />
       ))}
     ```
  5. This approach: each admin item individually filtered, not a blanket role gate
- **Implementation Notes**: SUPERADMIN automatically sees all items because `hasPermission()` returns `true` for any key when `isSuperAdmin` is true (permissions includes `'*'`).

### Step 3: Replace role check with permission check in NavBar.tsx
- **File**: `nexacore-dashboard/src/components/layout/NavBar.tsx`
- **Action**: Replace `isAdmin` role check with `hasPermission("users:read")` for the Admin dropdown link
- **Implementation Steps**:
  1. Add import: `import { usePermissions } from "@/hooks/usePermissions";`
  2. Replace line 41 (`const isAdmin = ...`) with:
     ```typescript
     const { hasPermission } = usePermissions();
     ```
  3. Replace line 159 (`{isAdmin && (`) with:
     ```typescript
     {hasPermission("users:read") && (
     ```
  4. Remove `useAuth` usage for role check. Note: `useAuth` is still needed for `user` and `logout` — keep the import.

### Step 4: Build verification
- **Action**: Run `npx next build` to verify no type errors or compilation issues
- **Implementation Steps**:
  1. Run build from `nexacore-dashboard/`
  2. Verify all pages compile successfully
  3. Fix any TypeScript errors

### Step 5: Update Technical Documentation
- **Action**: Review if any documentation needs updates
- **Implementation Steps**:
  1. Check `ai-specs/specs/frontend-standards.mdc` — no routing or component pattern changes needed
  2. Check `ai-specs/specs/integration-state.md` — no module dependency changes (PermissionsContext already exists)
  3. No new dependencies, no new files, no API changes
  4. Document the permission→nav-item mapping convention if not already in frontend-standards
- **Notes**: This is a minor refactor (role check → permission check), likely no doc updates needed since the permission system is already documented.

## 4. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add permission field to nav item types/arrays in Sidebar.tsx
3. Step 2: Replace role check with permission filtering in Sidebar.tsx
4. Step 3: Replace role check with permission check in NavBar.tsx
5. Step 4: Build verification
6. Step 5: Update technical documentation (if needed)

## 5. Testing Checklist

- [ ] Build passes (`npx next build`) with no errors
- [ ] SUPERADMIN user sees all nav items (Dashboard, Profile, Admin, Audit Logs, Permissions, Documentation)
- [ ] ADMIN user sees: Dashboard, Profile, Admin, Audit Logs, Documentation (NOT Permissions)
- [ ] USER role sees: Dashboard, Profile, Documentation only
- [ ] NavBar dropdown: Admin link visible only to users with `users:read` permission
- [ ] No `user.role` checks remain in Sidebar.tsx or NavBar.tsx
- [ ] Sidebar collapsed/expanded states still work correctly
- [ ] Mobile sidebar still works correctly
- [ ] Active state highlighting still works for all visible items

## 6. Error Handling Patterns

N/A — No new error states. `usePermissions()` is already wrapped in `PermissionsProvider` which is part of the app layout. If permissions are not loaded, `hasPermission()` returns `false` (safe default — hides items until permissions load).

## 7. UI/UX Considerations

- No visual changes — this is a logic-only refactor
- Items that were hidden by role check will now be hidden by permission check
- The visual result is identical for all three roles (USER, ADMIN, SUPERADMIN) given the current default-permissions mapping
- Future benefit: if custom permissions are assigned (e.g., a USER gets `audit-logs:read`), they will see the Audit Logs item automatically

## 8. Dependencies

- No new dependencies required
- Uses existing: `usePermissions` hook, `PermissionsContext`

## 9. Notes

- The `useAuth` import remains in both files — Sidebar needs `user` for the user card, NavBar needs `user` and `logout`
- Only the role-based `isAdmin` check is removed; all other auth-dependent behavior stays
- The `permission` field on nav items is optional — items without it are always visible
- SUPERADMIN bypass is handled transparently by `hasPermission()` returning `true` for all keys

## 10. Next Steps After Implementation

- Proceed with SCRUM-278 (Dashboard Overview Page)
- The permission-aware nav pattern established here will be reused for any future nav items

## 11. Implementation Verification

- [ ] **Code Quality**: No role-based checks in navigation components
- [ ] **Functionality**: All three roles see correct nav items per permission mapping
- [ ] **Testing**: Build passes, manual verification of role visibility
- [ ] **Integration**: `usePermissions()` hook used correctly, no circular dependencies
- [ ] **Documentation**: Updated if needed
