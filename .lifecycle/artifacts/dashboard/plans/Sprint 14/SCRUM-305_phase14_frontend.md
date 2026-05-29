# Frontend Implementation Plan: SCRUM-305 Phase 14 — Global Notifications + NavBar

## Overview
Move the notification panel from a per-page prop to the DashboardLayout itself, making it accessible from every page. Replace panel toggle icons with standard Bell icon. Retroactive plan — work already implemented.

## Steps

### 14.1 RightPanel integrated into DashboardLayout
- **File**: `DashboardLayout.tsx`
- **Change**: Import `RightPanel` directly instead of receiving as `rightPanel` prop. Remove `rightPanel` from `DashboardLayoutProps`. The notification panel and its toggle are now available on every page that uses DashboardLayout
- **Icons**: `PanelRightClose` → `X` (close button), added `Bell` icon next to title "Notifications"

### 14.2 Dashboard page cleanup
- **File**: `dashboard/page.tsx`
- **Change**: Remove `RightPanel` import and `rightPanel={<RightPanel />}` prop from `<DashboardLayout>`

### 14.3 NavBar Bell icon + reorder
- **File**: `NavBar.tsx`
- **Change**:
  - Replace `PanelRightOpen`/`PanelRightClose` toggle with single `Bell` icon (always the same, regardless of panel state)
  - Remove `rightPanelOpen` prop from NavBarProps (no longer needed for icon switching)
  - Reorder right-side items: ThemeToggle → Bell (notifications) → Avatar (user dropdown)
  - `aria-label` updated to "Notifications"

### 14.4 DashboardLayout NavBar prop cleanup
- **File**: `DashboardLayout.tsx`
- **Change**: Remove `rightPanelOpen={showRightPanel}` from NavBar call. `onRightPanelToggle` is always provided (not conditional on `rightPanel` prop existing)

## Files Changed (3)
- `DashboardLayout.tsx`
- `NavBar.tsx`
- `dashboard/page.tsx`

## Rationale
Standard practice (GitHub, Slack, Linear, Notion): notification panel accessible from any page via persistent header icon. Bell is the universal notification icon — `PanelRightOpen` communicated "open panel", not "notifications".
