# Frontend Implementation Plan: SCRUM-285 Implement Missing Generic UI Components

## Overview

Create 8 new reusable UI components in `nexacore-dashboard/src/components/ui/` that are defined in the design system (ui-design-system.md + Figma) but don't exist as standalone components yet.

**IMPORTANT**: This ticket ONLY creates new component files. It does NOT modify any existing pages, layouts, or components. The existing dashboard UI remains unchanged. These components serve as the reference library for the Design System Viewer (SCRUM-286+) and future feature pages.

## Architecture Context

- **Existing pattern**: Components in `src/components/ui/` follow a consistent pattern:
  - `'use client'` directive
  - TypeScript interface extending native HTML attributes
  - Variant/size maps as `const` objects with Tailwind classes
  - Default export function component
  - `className` prop for override support
  - Semantic color tokens (not hardcoded hex values)
- **Reference files**: `Button.tsx`, `Input.tsx`, `Tooltip.tsx` as pattern examples
- **Design tokens**: All components must use existing Tailwind semantic tokens from `tailwind.config.ts` and `globals.css`
- **Dark mode**: Via CSS custom properties (`.dark` class on `<html>`)
- **Figma specs**: `integrations/figma-mcp-server/specs/components.json`
- **Design system doc**: `ai-specs/specs/ui-design-system.md`

## Implementation Steps

### Step 0: Create Feature Branch

```bash
git checkout main && git pull origin main
git checkout -b feature/SCRUM-285-frontend
```

### Step 1: Badge Component

**File**: `src/components/ui/Badge.tsx`

The most widely needed component — used for role labels, status indicators, action types.

**Props**:
```typescript
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}
```

**Design specs**:
- `sm`: text-xs, px-2, py-0.5, rounded-md
- `md`: text-sm, px-2.5, py-0.5, rounded-md
- Variants map to semantic tokens: `success` → `bg-success-bg text-success`, `warning` → `bg-warning-bg text-warning`, etc.
- `default`: `bg-surface-subtle text-content-secondary`

### Step 2: Avatar Component

**File**: `src/components/ui/Avatar.tsx`

**Props**:
```typescript
interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  alt?: string;
  className?: string;
}
```

**Design specs** (from Sidebar 24x24 reference):
- Sizes: `xs`=24px, `sm`=32px, `md`=40px, `lg`=64px
- Image variant: `<img>` with `rounded-full`, `object-cover`
- Initials variant: First letter of first+last name, bg-surface-tertiary, text centered
- Fallback: lucide `User` icon centered
- Border: `border border-border-default`
- Shadow: `shadow-avatar` token

### Step 3: Toggle Component

**File**: `src/components/ui/Toggle.tsx`

**Props**:
```typescript
interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
}
```

**Design specs** (ui-design-system.md Section 19):
- Switch track: 40x22 (`md`), 32x18 (`sm`), rounded-full
- On: track bg-surface-inverse, circle translated right
- Off: track bg-surface-subtle border-border-default, circle left
- Circle: white, shadow, transitions
- Label: 14px/500
- Accessibility: `role="switch"`, `aria-checked`, keyboard toggle (Space/Enter)

### Step 4: Checkbox Component

**File**: `src/components/ui/Checkbox.tsx`

**Props**:
```typescript
interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  id?: string;
}
```

**Design specs** (ui-design-system.md Section 25):
- Box: 20x20, rounded-[5px]
- Checked: bg-surface-inverse, check icon stroke 2px white
- Unchecked: bg-surface-primary, border 1px border-border-default
- Indeterminate: bg-surface-inverse, horizontal dash white
- Label: 15px/400, gap-1.5
- Accessibility: native `<input type="checkbox">` hidden, custom visual, `aria-checked`

### Step 5: Tabs Component

**File**: `src/components/ui/Tabs.tsx`

**Props**:
```typescript
interface Tab {
  label: string;
  value: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  className?: string;
}
```

**Design specs** (ui-design-system.md Section 6):
- Container: bg-surface-primary, border 1px border-border-default, shadow-card, rounded-[5px]
- Active tab: bg-surface-secondary, border 1px, text 14px/700
- Inactive tab: no background, text 14px/500
- Tab height: 37px
- Accessibility: `role="tablist"`, `role="tab"`, `aria-selected`, keyboard nav (Arrow Left/Right)

### Step 6: Select Component

**File**: `src/components/ui/Select.tsx`

**Props**:
```typescript
interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}
```

**Design specs** (ui-design-system.md Section 7):
- Trigger: border 1px, rounded-md, padding, chevron-down icon
- Dropdown: bg-surface-primary, border 1px, shadow-card, rounded-3xl, padding-6
- Active item: bg-surface-inverse, text-content-inverse, rounded-3xl
- Inactive item: no fill, text-content-primary
- Danger item: text-error
- Icon: 16x16 per item
- Accessibility: `role="listbox"`, `role="option"`, `aria-selected`, keyboard nav, Escape to close

### Step 7: Slider Component

**File**: `src/components/ui/Slider.tsx`

**Props**:
```typescript
interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  showValue?: boolean;
  className?: string;
}
```

**Design specs** (ui-design-system.md Section 20):
- Track: height 3px, bg border-border-default, rounded-md
- Progress fill: bg-surface-inverse, same height
- Handle: 18x18 rounded-full, bg-white, border 3px border-content-primary
- Range: native `<input type="range">` hidden, custom visual layer
- Accessibility: `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`

### Step 8: Calendar Component

**File**: `src/components/ui/Calendar.tsx`

**Props**:
```typescript
interface CalendarProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
}
```

**Design specs** (ui-design-system.md Section 4):
- Container: 300x280, bg-surface-primary, border 1px, shadow-card, rounded-3xl, padding-6
- Navigation: ChevronLeft/ChevronRight icons (24x24), month+year text 14px/700
- Grid: 7 columns (Mon-Sun)
- Weekday headers: 12px/400
- Day numbers: 15px/400
- Current day: highlighted bg
- Selected day: bg-surface-inverse, text-content-inverse
- Overflow days: lower opacity
- No external date library — pure implementation with native Date API

### Step 9: Run Build

```bash
cd nexacore-dashboard && npm run build
```

Verify all 8 components compile without TypeScript errors and are tree-shakeable (no side effects on import).

### Step 10: Update Technical Documentation

- No changes to ui-design-system.md (design specs already defined)
- No changes to integration-state.md (no backend changes)
- No changes to api-spec.yml (no API changes)

## Implementation Order

1. Step 0: Create branch
2. Step 1: Badge (most widely needed)
3. Step 2: Avatar (second most common)
4. Step 3: Toggle (used in settings)
5. Step 4: Checkbox (used in forms/filters)
6. Step 5: Tabs (used in profile/detail pages)
7. Step 6: Select (used in all forms)
8. Step 7: Slider (theme configurator)
9. Step 8: Calendar (audit log filters)
10. Step 9: Build verification

## Testing Checklist

- [ ] 8 new files created in `src/components/ui/`
- [ ] Each component follows existing pattern (`'use client'`, TS interface, variant maps, default export)
- [ ] Each component uses semantic Tailwind tokens (no hardcoded hex/colors)
- [ ] Each component supports `className` prop for overrides
- [ ] Each component supports `disabled` state
- [ ] Each component works in dark mode
- [ ] Each component has ARIA accessibility attributes
- [ ] `npm run build` passes with 0 errors
- [ ] No existing files modified

## Dependencies

- No new npm packages required
- All components use: lucide-react (already installed), Tailwind CSS tokens (already defined)

## Notes

- **NO existing UI changes**: This ticket only creates new files. Existing pages, components, and styles remain untouched.
- **These components are the foundation for**: SCRUM-286 (Design System Viewer), SCRUM-288/289 (Component Showcase), and all future feature pages (projects, teams, billing).
- **Figma reference**: `integrations/figma-mcp-server/specs/components.json` for pixel-level values. When design-system.md and Figma differ, Figma values take precedence (per design-to-code workflow standard).
- **Calendar has no external dependency**: Built with native Date API. If complex date handling is needed later (date ranges, i18n), consider `date-fns` in a future ticket.

## Implementation Verification

- Code quality: Follows existing component patterns exactly
- Functionality: Each component renders all variants correctly
- Testing: Build passes, no TypeScript errors
- Integration: No impact on existing code (0 existing files modified)
- Documentation: No updates needed (design specs already documented)
