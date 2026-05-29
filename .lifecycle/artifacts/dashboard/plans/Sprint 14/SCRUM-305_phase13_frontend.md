# Frontend Implementation Plan: SCRUM-305 Phase 13 — Mobile Responsive

## Overview
Comprehensive mobile responsive pass across all pages. Headers stack vertically, StickyCard bottom uses fixed positioning (same pattern as top), charts/settings/showcase components stack on small screens. Retroactive plan — work already implemented.

## Steps

### 13.1 Page headers responsive (7 pages)
- **Files**: `dashboard/page.tsx`, `admin/page.tsx`, `admin/audit-logs/page.tsx`, `admin/permissions/page.tsx`, `admin/design-system/page.tsx`, `profile/page.tsx`, `settings/page.tsx`
- **Change**: `flex items-center gap-2` → `flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2`
- **Divider**: `hidden sm:block` — hidden on mobile, title above breadcrumbs

### 13.2 StickyCard bottom — fixed positioning
- **File**: `StickyCard.tsx`
- **Problem**: CSS `sticky` + IntersectionObserver caused infinite loop when card height changed between stuck/resting states
- **Solution**: Replicate exact pattern from StickyCardTop — `position: fixed` + `minHeight` on original card + IntersectionObserver. Mobile: collapsible strip with chevron. Desktop: always expanded with `sm:flex`
- **Key**: `rounded-t-xl` for bottom (vs `rounded-b-xl` for top), content above chevron button

### 13.3 PermissionsMatrix Save/Reset layout
- **File**: `PermissionsMatrix.tsx`
- **Change**: USER and ADMIN groups separated by Divider (vertical desktop, horizontal mobile). Buttons use `grid grid-cols-2 gap-2` on mobile for full-width 50/50 split. Desktop: `sm:flex` inline with `flex-1 justify-center` per role group
- **Imports added**: `Fragment`, `Divider`

### 13.4 UserRoleChart mobile stacking
- **File**: `UserRoleChart.tsx`
- **Change**: `flex items-center gap-6` → `flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6`
- **Effect**: Doughnut chart centered above, legend below on mobile

### 13.5 Settings responsive (UserPreferences + GlobalSettings)
- **Files**: `UserPreferences.tsx`, `GlobalSettings.tsx`
- **Change**: SettingRow renders two layouts — mobile (`sm:hidden`): icon + action top row, title + description below. Desktop (`hidden sm:flex`): original inline layout
- **GlobalSettings**: Inline badge spans replaced with `<Badge>` component (separate phase 15)

### 13.6 ComponentShowcase mobile responsive
- **File**: `ComponentShowcase.tsx`
- **Changes**:
  - Input Sizes: `flex w-[240px]` → `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, wrapper `flex flex-wrap gap-8` → `div`
  - CopyField Sizes: same pattern, `w-[240px]` → grid
  - Digit Input Sizes: `style={{ width: 360/280 }}` → `grid grid-cols-1 sm:grid-cols-2` with `sm:max-w-[360px/280px]`, items centered on mobile, note `sm:hidden` explaining auto-size behavior
  - Charts: `flex-1 min-w-[400px]` → `grid grid-cols-1 lg:grid-cols-2`
  - DoughnutChartMock: `flex items-center gap-6` → `flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6`
  - Sidebar: `flex gap-4` → `flex flex-col items-center gap-4 sm:flex-row sm:items-start`, labels centered mobile, `max-w-full` on expanded

### 13.7 TokenInspector mobile responsive
- **File**: `TokenInspector.tsx`
- **Changes**:
  - Color grid: `grid-cols-2 md:grid-cols-3` → `grid-cols-1 sm:grid-cols-2`
  - Weights: `flex gap-4` → `grid grid-cols-1 sm:grid-cols-2`
  - Heading Hierarchy: `flex items-center gap-4` with fixed widths → `flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4` with `sm:w-20/48` responsive widths
  - Spacing labels: `w-48` → `w-32 sm:w-48`

## Files Changed (18)
- 7 page files (header pattern)
- `StickyCard.tsx`
- `PermissionsMatrix.tsx`
- `UserRoleChart.tsx`
- `UserPreferences.tsx`
- `GlobalSettings.tsx`
- `ComponentShowcase.tsx`
- `TokenInspector.tsx`

## Testing
- All pages verified in Chrome DevTools mobile (375px)
- StickyCard bottom: no flickering, chevron centered, expand/collapse works
- Charts stack correctly, text readable without truncation
