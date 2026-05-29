# Frontend Implementation Plan: SCRUM-286 Create /admin/design-system Page

## Overview

Create the Design System Viewer page at `/admin/design-system` with a component registry that catalogs all 26 UI components by category. This page serves as the visual reference for the entire component library.

**This page does NOT modify any existing component behavior.** It renders existing components in a showcase format for visual verification.

## Architecture Context

- **Existing admin page pattern**: `AdminRoute` → `DashboardLayout` → `Breadcrumbs` → content
- **Reference pages**: `/admin/permissions/page.tsx` (simplest admin page pattern)
- **Sidebar navigation**: `adminItems` array in `Sidebar.tsx` with permission gating
- **26 components** in `src/components/ui/` to register

## Implementation Steps

### Step 0: Create Feature Branch

```bash
git checkout main && git pull origin main
git checkout -b feature/SCRUM-286-frontend
```

### Step 1: Create Component Registry

**File**: `src/lib/component-registry.ts`

Define registry data structure and register all 26 UI components with metadata. No component imports at this level — use lazy imports on the page to avoid bundle bloat.

```typescript
export type ComponentCategory = 'atom' | 'molecule' | 'organism' | 'utility';

export interface ComponentEntry {
  name: string;
  category: ComponentCategory;
  description: string;
  fileName: string; // e.g., 'Button.tsx'
}

export const componentRegistry: ComponentEntry[] = [
  // Atoms (10)
  { name: 'Button', category: 'atom', description: 'Primary action trigger with variants and sizes', fileName: 'Button.tsx' },
  { name: 'Input', category: 'atom', description: 'Text input with label, error, and password toggle', fileName: 'Input.tsx' },
  { name: 'Badge', category: 'atom', description: 'Status indicator with semantic color variants', fileName: 'Badge.tsx' },
  { name: 'Spinner', category: 'atom', description: 'Loading spinner animation', fileName: 'Spinner.tsx' },
  { name: 'Avatar', category: 'atom', description: 'User avatar with image, initials, and fallback', fileName: 'Avatar.tsx' },
  { name: 'Toggle', category: 'atom', description: 'On/off switch with label', fileName: 'Toggle.tsx' },
  { name: 'Checkbox', category: 'atom', description: 'Checkbox with checked, unchecked, and indeterminate states', fileName: 'Checkbox.tsx' },
  { name: 'Tooltip', category: 'atom', description: 'Floating tooltip with 4 position options', fileName: 'Tooltip.tsx' },
  { name: 'Divider', category: 'atom', description: 'Horizontal separator line', fileName: 'Divider.tsx' },
  { name: 'Slider', category: 'atom', description: 'Range slider with custom track and handle', fileName: 'Slider.tsx' },

  // Molecules (8)
  { name: 'Tabs', category: 'molecule', description: 'Horizontal tab bar with keyboard navigation', fileName: 'Tabs.tsx' },
  { name: 'Select', category: 'molecule', description: 'Dropdown select with search and keyboard nav', fileName: 'Select.tsx' },
  { name: 'Calendar', category: 'molecule', description: 'Month calendar with date selection', fileName: 'Calendar.tsx' },
  { name: 'Pagination', category: 'molecule', description: 'Page navigation with ellipsis support', fileName: 'Pagination.tsx' },
  { name: 'Toast', category: 'molecule', description: 'Auto-dismiss notification with 4 variants', fileName: 'Toast.tsx' },
  { name: 'ErrorAlert', category: 'molecule', description: 'Error alert banner', fileName: 'ErrorAlert.tsx' },
  { name: 'Breadcrumbs', category: 'molecule', description: 'Navigation breadcrumb trail', fileName: 'Breadcrumbs.tsx' },
  { name: 'ConfirmModal', category: 'molecule', description: 'Confirmation dialog with focus trap', fileName: 'ConfirmModal.tsx' },

  // Organisms (3)
  { name: 'LanguageSelector', category: 'organism', description: 'Language picker with search dropdown', fileName: 'LanguageSelector.tsx' },
  { name: 'ThemeToggle', category: 'organism', description: 'Light/dark mode toggle', fileName: 'ThemeToggle.tsx' },
  { name: 'TurnstileWidget', category: 'organism', description: 'Cloudflare Turnstile CAPTCHA', fileName: 'TurnstileWidget.tsx' },

  // Utility (5)
  { name: 'InfinitySpinner', category: 'utility', description: 'Infinity loop loading animation', fileName: 'InfinitySpinner.tsx' },
  { name: 'RingSpinner', category: 'utility', description: 'Ring-shaped spinner variant', fileName: 'RingSpinner.tsx' },
  { name: 'CountdownTimer', category: 'utility', description: 'Rate limit countdown digits', fileName: 'CountdownTimer.tsx' },
  { name: 'RateLimitBanner', category: 'utility', description: 'Rate limit/lockout notification banner', fileName: 'RateLimitBanner.tsx' },
  { name: 'ToastContainer', category: 'utility', description: 'Toast queue manager', fileName: 'ToastContainer.tsx' },
];

export const categories: { key: ComponentCategory; label: string; count: number }[] = [
  { key: 'atom', label: 'Atoms', count: componentRegistry.filter(c => c.category === 'atom').length },
  { key: 'molecule', label: 'Molecules', count: componentRegistry.filter(c => c.category === 'molecule').length },
  { key: 'organism', label: 'Organisms', count: componentRegistry.filter(c => c.category === 'organism').length },
  { key: 'utility', label: 'Utility', count: componentRegistry.filter(c => c.category === 'utility').length },
];
```

### Step 2: Create Design System Page

**File**: `src/app/admin/design-system/page.tsx`

Follow existing admin page pattern (AdminRoute → DashboardLayout → Breadcrumbs → content).

**Page layout**:
```
┌─ Breadcrumbs: Dashboards > Admin > Design System ─────────────┐
│                                                                 │
│  Design System                          26 components          │
│                                                                 │
│  [Atoms] [Molecules] [Organisms] [Utility]  ← category tabs   │
│                                                                 │
│  ┌─ Badge ──────┐  ┌─ Button ─────┐  ┌─ Avatar ─────┐        │
│  │ description   │  │ description  │  │ description   │        │
│  │ [atom badge]  │  │ [atom badge] │  │ [atom badge]  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ... more component cards ...                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Key elements**:
- Uses `useState` for active category filter (default: show all)
- Component cards in responsive grid (1-2-3 columns)
- Each card shows: name, description, category badge
- Badge component (from ui/) used for category labels
- No component rendering at this stage — that's SCRUM-288/289

### Step 3: Add Sidebar Navigation Item

**File**: `src/components/layout/Sidebar.tsx`

Add to `adminItems` array (after Permissions):
```typescript
{
  href: "/admin/design-system",
  label: "Design System",
  icon: Palette,
  permission: "permissions:read",
},
```

Add `Palette` to lucide-react imports.

### Step 4: Build Verification

```bash
cd nexacore-dashboard && npm run build
```

## Implementation Order

1. Step 0: Create branch
2. Step 1: Component registry (`src/lib/component-registry.ts`)
3. Step 2: Design system page (`src/app/admin/design-system/page.tsx`)
4. Step 3: Sidebar nav item (`Sidebar.tsx` — 1 import + 1 array entry)
5. Step 4: Build verification

## Testing Checklist

- [ ] `/admin/design-system` renders with DashboardLayout + Breadcrumbs
- [ ] Component registry exports 26 entries
- [ ] Page shows categorized grid of component cards
- [ ] Category tabs filter components by category
- [ ] "All" option shows all 26 components
- [ ] Each card displays name, description, and category badge
- [ ] Sidebar shows "Design System" link under admin section
- [ ] Only accessible to admin/superadmin (AdminRoute guard)
- [ ] `npm run build` passes

## Dependencies

- No new npm packages
- Uses existing: Badge (for category labels), Tabs (for category filter), Breadcrumbs

## Notes

- **This page is the shell** — it catalogs components but does NOT render live previews yet. That's SCRUM-288 (atoms) and SCRUM-289 (molecules/organisms).
- **No new permissions created** — uses `permissions:read` which admins have. SUPERADMIN has wildcard `'*'`.
- **Component registry is pure data** — no component imports, no side effects, tree-shakeable.
- **Follows existing admin pattern** exactly: same guard, layout, breadcrumbs, heading style.

## Implementation Verification

- Code quality: Follows admin page patterns
- Functionality: Page renders, categories filter, sidebar navigates
- Integration: No impact on existing admin pages
- Documentation: No updates needed
