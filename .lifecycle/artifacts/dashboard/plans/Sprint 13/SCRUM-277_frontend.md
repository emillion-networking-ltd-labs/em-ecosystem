# Frontend Implementation Plan: SCRUM-277 Dashboard Shell — Figma Polish

## 1. Header
- **Ticket**: SCRUM-277
- **Sprint**: 13 — Dashboard Shell
- **Module**: dashboard
- **Scope**: frontend
- **Date**: 2026-03-17

## 2. Overview

Align the existing dashboard shell components (Sidebar, NavBar, Breadcrumbs, DashboardLayout) with the Figma `dashboard-overview.json` extraction specs. This is a CSS/Tailwind-only polish pass — no new features, no new dependencies, no backend changes. Every spacing, font size, opacity, border, padding, and radius value must match Figma exactly.

## 3. Architecture Context

### Components Affected
| Component | File | Nature of Change |
|-----------|------|-----------------|
| Sidebar | `src/components/layout/Sidebar.tsx` | Nav items, section headers, logo area, active states, spacing |
| NavBar | `src/components/layout/NavBar.tsx` | Icon frame sizes, search bar width, user dropdown |
| DashboardLayout | `src/components/layout/DashboardLayout.tsx` | Content area padding |
| Breadcrumbs | `src/components/ui/Breadcrumbs.tsx` | Home icon size, text sizes |
| ThemeToggle | `src/components/ui/ThemeToggle.tsx` | Frame size consistency |

### Figma Source
- **File**: `integrations/figma-mcp-server/specs/dashboard-overview.json`
- **Frame**: Dashboard Overview (1440x1024)
- **Key children**: Sidebar (212x1024), Header (948x68)

### Routing
No routing changes. All pages already use `DashboardLayout`.

### State Management
No state changes. Purely visual alignment.

## 4. Implementation Steps

### Step 0: Create Feature Branch
- **Action**: Create `feat/scrum-277-dashboard-shell-polish` from `main`
- **Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feat/scrum-277-dashboard-shell-polish`

### Step 1: Fix Sidebar.tsx — Nav Item Dimensions & Active State
- **File**: `nexacore-dashboard/src/components/layout/Sidebar.tsx`
- **Action**: Align NavItem component with Figma specs
- **Figma Values**:
  - Nav item: 180x36 (stretch width), cornerRadius 12px, padding 8px all sides, itemSpacing 4px
  - Icon: 20x20 lucide icons (active items), icon frame with 4px gap to text
  - Text: 14px/20px fontWeight 400
  - Active state: bg `#000/4%` (light) = `bg-black/[0.04]`, radius 12px
  - Inactive state: no fill, same radius 12px
- **Current Code Gaps**:
  - `rounded-3xl` (24px) → should be `rounded-xl` (12px) for active
  - `rounded-xl` (12px) for inactive → correct, keep
  - `p-2` (8px) → correct, keep
  - `gap-1` (4px) → correct, keep
  - Icon `size={20}` → correct, keep
  - `text-body-sm` → verify maps to 14px (body-sm is 14px/21px/400 in tailwind config — close enough, keep)
- **Changes**:
  1. Change active state from `rounded-3xl` to `rounded-xl`
  2. Change active bg from `bg-surface-subtle` to `bg-black/[0.04] dark:bg-white/[0.04]`
  3. Add `ml-1` → `ml-0` (gap-1 handles spacing already, remove redundant ml-1)

### Step 2: Fix Sidebar.tsx — Section Headers
- **File**: `nexacore-dashboard/src/components/layout/Sidebar.tsx`
- **Action**: Align NavSection headers with Figma
- **Figma Values**:
  - Section header (e.g., "Dashboards"): 14px/20px fontWeight 400, opacity 0.4, padding 4px top/bottom + 12px left/right
  - NOT uppercase, NOT tracking-wider, NOT 12px caption
- **Current Code Gaps**:
  - `text-caption` (12px) → should be `text-[14px] leading-[20px]`
  - `font-semibold` → should be `font-normal`
  - `uppercase tracking-wider` → remove both
  - `px-2` → should be `px-3` (12px)
  - Missing opacity → add `opacity-40` or `text-content-primary/40`
- **Changes**:
  1. Replace `text-caption font-semibold uppercase tracking-wider text-content-tertiary` with `text-[14px] leading-[20px] font-normal text-content-primary/40`
  2. Change `px-2` to `px-3`
  3. Keep `mb-2` for spacing below header

### Step 3: Fix Sidebar.tsx — Logo Area
- **File**: `nexacore-dashboard/src/components/layout/Sidebar.tsx`
- **Action**: Align logo/user area with Figma
- **Figma Values**:
  - Logo row: 180x40, padding 8px all, radius 8px, avatar 24x24 (radius 80/circle), bg #000/4%
  - Text: 14px/20px fontWeight 400 (NOT semibold)
- **Current Code Gaps**:
  - `h-[68px]` logo area height → should be auto-height (40px row + 16px padding = fits in sidebar padding)
  - `font-semibold` on NexaCore text → should be `font-normal`
- **Changes**:
  1. Change logo container from `h-[68px]` to auto height with proper padding
  2. Change text from `text-body-sm font-semibold` to `text-[14px] leading-[20px] font-normal`
  3. Ensure avatar is 24x24 circle with `bg-black/[0.04]`

### Step 4: Fix Sidebar.tsx — Section Spacing
- **File**: `nexacore-dashboard/src/components/layout/Sidebar.tsx`
- **Action**: Fix inter-section spacing
- **Figma Values**: itemSpacing 8px between all sections (consistent)
- **Current Code Gaps**: `mt-6` (24px) on ACCOUNT section → too much
- **Changes**:
  1. Change `mt-6` to `mt-2` (8px, matches Figma itemSpacing)

### Step 5: Fix NavBar.tsx — Icon Frame Sizes
- **File**: `nexacore-dashboard/src/components/layout/NavBar.tsx`
- **Action**: Align action icon frames with Figma
- **Figma Values**:
  - Each icon button: 28x28 frame, cornerRadius 12 (not in Figma, implied), padding 4px, inner icon 20x20
  - Gap between icons: 8px
  - Icons: ThemeToggle (Sun/Moon), Bell (Notification), PanelRight (Sidebar)
- **Current Code Gaps**:
  - Bell: `h-6 w-6` (24x24) → should be `h-7 w-7` (28x28)
  - PanelRight: `h-6 w-6` (24x24) → should be `h-7 w-7` (28x28)
  - Left buttons (PanelLeft, Star): `h-6 w-6` (24x24) → these are in the Icon-Breadcrumb group at 24x24 in Figma, so CORRECT — keep
  - Icon sizes inside right buttons: `size={16}` → should be `size={20}`
- **Changes**:
  1. Bell button: `h-6 w-6` → `h-7 w-7`, icon `size={16}` → `size={20}`
  2. PanelRight button: `h-6 w-6` → `h-7 w-7`, icon `size={16}` → `size={20}`
  3. Keep gap-2 (8px) — correct

### Step 6: Fix NavBar.tsx — Search Bar
- **File**: `nexacore-dashboard/src/components/layout/NavBar.tsx`
- **Action**: Align search bar with Figma specs
- **Figma Values**:
  - 160x28, cornerRadius 16, bg #000/4%
  - Search icon 16x16 at opacity 0.2
  - Text "Search" at 14px/20px opacity 0.2
  - Kbd "/" with border #000/10%, cornerRadius 4, 20x16
- **Current Code Gaps**:
  - Width not constrained → add `w-[160px]`
  - `rounded-2xl` (16px) → correct, keep
  - `bg-surface-subtle` → verify matches #000/4% in light mode (surface-subtle = `rgba(28,28,28,0.05)` — close, acceptable via token)
  - Icon color `text-content-tertiary` → should have explicit opacity 0.2
  - Text color `text-content-tertiary` → should have explicit opacity 0.2
  - Kbd border → currently `border-border-default` — matches
- **Changes**:
  1. Add `w-[160px]` to search container
  2. Adjust icon/text opacity to match 0.2 if tokens don't match

### Step 7: Fix Breadcrumbs.tsx
- **File**: `nexacore-dashboard/src/components/ui/Breadcrumbs.tsx`
- **Action**: Align with Figma breadcrumb specs
- **Figma Values**:
  - Home button: 24x24, cornerRadius 12, padding 4px, icon 16x16
  - Divider "/": 14px
  - Breadcrumb text: 14px/20px fontWeight 400
  - Gap between items: 8px
- **Current Code Gaps**:
  - Home: `h-7 w-7` (28px) → should be `h-6 w-6` (24px)
  - Home icon: `size={20}` → should be `size={16}`
  - Breadcrumb text: `text-caption` (12px) → should be `text-[14px] leading-[20px]`
  - Divider: `text-body-sm` (14px) → correct
- **Changes**:
  1. Home button: `h-7 w-7` → `h-6 w-6`
  2. Home icon: `size={20}` → `size={16}`
  3. `rounded-lg` → `rounded-xl` (12px, matching Figma)
  4. Breadcrumb items: `text-caption` → `text-[14px] leading-[20px]`

### Step 8: Fix DashboardLayout.tsx — Content Padding
- **File**: `nexacore-dashboard/src/components/layout/DashboardLayout.tsx`
- **Action**: Align main content padding with Figma
- **Figma Values**: Content starts at x:240 (212 sidebar + 28px padding)
- **Current Code Gaps**: `p-4 lg:p-6` (16px / 24px) → should be `p-4 lg:px-7 lg:py-6` (28px horizontal, ~24px vertical)
- **Changes**:
  1. Change `p-4 lg:p-6` to `p-4 lg:px-7 lg:py-6`

### Step 9: Fix ThemeToggle.tsx — Frame Size
- **File**: `nexacore-dashboard/src/components/ui/ThemeToggle.tsx`
- **Action**: Ensure 28x28 frame matches Figma icon set
- **Figma Values**: All header icons are 28x28 frames with 4px padding
- **Current Code Gaps**: `h-[28px] w-[28px]` placeholder already correct; button uses `rounded-lg p-1` (4px padding) — correct
- **Changes**: Verify SVG icons are 20x20 (currently `width="20" height="20"` — correct). No changes needed.

### Step 10: Update Technical Documentation
- **Action**: Update `ui-design-system.md` if any new tokens or component specs changed
- **Steps**:
  1. Review changes made
  2. Update Sidebar Items component spec if values changed
  3. Update Breadcrumbs component spec if values changed
  4. Update Header/Icon Set spec if values changed

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Sidebar NavItem active state + dimensions
3. Step 2: Sidebar section headers
4. Step 3: Sidebar logo area
5. Step 4: Sidebar section spacing
6. Step 5: NavBar icon frame sizes
7. Step 6: NavBar search bar
8. Step 7: Breadcrumbs
9. Step 8: DashboardLayout content padding
10. Step 9: ThemeToggle verification (likely no-op)
11. Step 10: Documentation update

## 6. Testing Checklist

- [ ] Sidebar renders correctly with expanded width (212px)
- [ ] Sidebar renders correctly when collapsed (68px)
- [ ] Active nav item shows correct bg/radius (12px, #000/4%)
- [ ] Inactive nav items have no background
- [ ] Section headers display at 14px, not uppercase
- [ ] Header icons are 28x28 with 20x20 inner icons
- [ ] Search bar is 160px wide with correct radius
- [ ] Breadcrumbs home icon is 24x24 with 16x16 icon
- [ ] Breadcrumb text is 14px not 12px
- [ ] Content area has 28px horizontal padding on desktop
- [ ] Mobile sidebar slide-in works correctly (no regressions)
- [ ] Mobile navbar hamburger works correctly
- [ ] Dark mode renders correctly for all changes
- [ ] User dropdown still opens and functions
- [ ] Sidebar collapse/expand animation is smooth

## 7. Error Handling Patterns

N/A — This ticket is purely visual. No API calls, no error states, no new features.

## 8. UI/UX Considerations

- **TailwindCSS**: Use `text-[14px] leading-[20px]` for Figma-exact values where semantic tokens don't match
- **Dark mode**: Active state bg uses `bg-black/[0.04] dark:bg-white/[0.04]` for theme-aware opacity
- **Responsive**: Mobile breakpoint (`lg:`) behavior must remain unchanged
- **Accessibility**: All `aria-label` attributes on buttons remain. Tab order unchanged.
- **Transitions**: Sidebar collapse uses `duration-200` — keep unchanged

## 9. Dependencies

No new dependencies. Pure Tailwind CSS changes.

## 10. Notes

- Figma uses "ByeWind" as placeholder username — our code uses "NexaCore" brand name. Keep NexaCore.
- Figma shows Favorites/Recently tabs in sidebar — these are NOT part of this ticket (mentioned in enrichment as "NOT IMPLEMENTED"). Skip.
- Figma shows Pages section with 5 sub-items — our sidebar has different nav structure. Align styling only, not content.
- The collapse toggle button position/size is fine — Figma doesn't show collapsed state.
- Search bar kbd "/" shortcut functionality already works — only visual alignment needed.

## 11. Next Steps After Implementation

- SCRUM-276: Sidebar Permission-Aware Navigation (depends on this polish being done first)
- SCRUM-278: Dashboard Overview Page content

## 12. Implementation Verification

- [ ] **Code Quality**: No new lint warnings, prettier formatted
- [ ] **Functionality**: All sidebar nav items clickable, active states work
- [ ] **Visual**: Pixel-level comparison with Figma for each component
- [ ] **Responsive**: Mobile layout unchanged, desktop matches Figma
- [ ] **Dark Mode**: All opacity values work in both themes
- [ ] **Integration**: No broken imports, no missing components
- [ ] **Documentation**: ui-design-system.md updated if needed
