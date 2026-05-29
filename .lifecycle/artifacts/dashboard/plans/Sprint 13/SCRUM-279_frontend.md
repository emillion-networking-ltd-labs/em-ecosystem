# Frontend Implementation Plan: SCRUM-279 Settings Page — User & Global Settings

## 1. Overview

Create a `/settings` page with two sections:
1. **User Preferences** (all users): Theme toggle, notification preferences, language selector
2. **Global Settings** (admin/superadmin only): System info, registration toggle, session config, security settings

The backend settings module does not exist yet. User preferences use `ThemeContext` (theme) and `localStorage` (other preferences) until the backend is implemented. Global settings are UI placeholders.

## 2. Architecture Context

### Components affected
- `nexacore-dashboard/src/components/layout/Sidebar.tsx` — add Settings nav item

### New files
- `nexacore-dashboard/src/app/settings/page.tsx` — Settings page
- `nexacore-dashboard/src/components/settings/UserPreferences.tsx` — Theme, notifications, language
- `nexacore-dashboard/src/components/settings/GlobalSettings.tsx` — Admin system config

### Files referenced (verified from live code)
| File | Current State |
|------|--------------|
| `Sidebar.tsx` | accountItems array at line 48, has Documentation only |
| `ThemeContext.tsx` | Provides `theme`, `toggleTheme`, `setTheme` — stores in localStorage |
| `PermissionsContext.tsx` | `hasPermission()` for gating Global Settings section |

### Permission mapping
| Section | Permission | Roles |
|---------|-----------|-------|
| User Preferences | `settings:read` | All (USER, ADMIN, SUPERADMIN) |
| Global Settings | `settings:write` | ADMIN, SUPERADMIN |
| Settings nav item | `settings:read` | All |

## 3. Implementation Steps

### Step 0: Create Feature Branch
- **Action**: Create `feat/scrum-279-settings-page`
- **Implementation Steps**:
  1. `cd em-ecosystem-code && git checkout main && git pull origin main`
  2. `git checkout -b feat/scrum-279-settings-page`

### Step 1: Add Settings nav item to Sidebar
- **File**: `nexacore-dashboard/src/components/layout/Sidebar.tsx`
- **Action**: Add Settings to accountItems with permission gating
- **Implementation Steps**:
  1. Add `Settings` import from lucide-react (rename to `SettingsIcon` to avoid conflict)
  2. Add to accountItems array before Documentation:
     ```typescript
     { href: "/settings", label: "Settings", icon: SettingsIcon, permission: "settings:read" },
     ```
  3. Update accountItems rendering to filter by permission (same pattern as adminItems)

### Step 2: Create UserPreferences component
- **File**: `nexacore-dashboard/src/components/settings/UserPreferences.tsx` (NEW)
- **Action**: Create preferences UI with theme, notifications, language
- **Implementation Steps**:
  1. Import `useTheme` hook (from ThemeContext)
  2. Theme section: radio/toggle for Light/Dark with current selection from `theme` state
  3. Notifications section: toggle switch for email notifications (localStorage: `settings:emailNotifications`)
  4. Language section: select dropdown with English only (placeholder for future i18n)
  5. Each setting row: label + description on left, control on right
  6. Use card-style layout matching dashboard ChartCard pattern

### Step 3: Create GlobalSettings component
- **File**: `nexacore-dashboard/src/components/settings/GlobalSettings.tsx` (NEW)
- **Action**: Create admin-only system configuration UI
- **Implementation Steps**:
  1. System Info row: App name "NexaCore", Version "1.0.0", Environment badge
  2. Registration row: toggle for public registration (localStorage placeholder)
  3. Session Timeout row: display "24 hours" default (read-only for now)
  4. MFA Enforcement row: toggle for mandatory MFA (localStorage placeholder)
  5. Each row follows same pattern as UserPreferences
  6. Header with "Global Settings" title and admin badge
- **Implementation Notes**: All toggles save to localStorage with `globalSettings:` prefix. When backend is implemented, these will be replaced with API calls.

### Step 4: Create Settings page
- **File**: `nexacore-dashboard/src/app/settings/page.tsx` (NEW)
- **Action**: Compose page with both settings sections
- **Implementation Steps**:
  1. Wrap in `ProtectedRoute` and `DashboardLayout`
  2. Page header: "Settings" title
  3. Render `UserPreferences` component
  4. Conditionally render `GlobalSettings` only if `hasPermission("settings:write")`
  5. Use `Breadcrumbs` component with items: [{ label: "Dashboards", href: "/dashboard" }, { label: "Settings" }]

### Step 5: Build verification
- **Action**: Run `npx next build`
- **Implementation Steps**:
  1. Verify all pages compile
  2. Fix any TypeScript errors

### Step 6: Update Technical Documentation
- **Action**: Check if docs need updating
- **Notes**: No new API endpoints, no backend changes. Likely no doc updates needed.

## 4. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add Settings nav item to Sidebar
3. Step 2: Create UserPreferences component
4. Step 3: Create GlobalSettings component
5. Step 4: Create Settings page
6. Step 5: Build verification
7. Step 6: Documentation (if needed)

## 5. Testing Checklist

- [ ] Build passes (`npx next build`) with no errors
- [ ] Settings nav item visible in sidebar for all authenticated users
- [ ] /settings page loads with User Preferences section
- [ ] Theme toggle switches between Light/Dark and persists
- [ ] Notification toggle saves to localStorage
- [ ] ADMIN/SUPERADMIN see Global Settings section
- [ ] USER does NOT see Global Settings section
- [ ] Breadcrumbs display correctly
- [ ] Sidebar active state highlights Settings when on /settings

## 6. UI/UX Considerations

- Settings rows: consistent left-label/right-control pattern
- Toggle switches: use Tailwind-styled custom toggles matching design system
- Card sections with headers, matching existing dashboard card style
- Responsive: single column on mobile, comfortable padding on desktop

## 7. Dependencies

- No new dependencies
- Uses existing: ThemeContext, usePermissions, DashboardLayout, ProtectedRoute, Breadcrumbs

## 8. Notes

- Backend settings module is planned but not implemented — all non-theme preferences use localStorage
- When backend is ready, replace localStorage reads/writes with API calls
- ThemeContext already handles theme persistence in localStorage — no duplication needed
- Profile page handles security settings (password, MFA setup) — this page handles preferences only
