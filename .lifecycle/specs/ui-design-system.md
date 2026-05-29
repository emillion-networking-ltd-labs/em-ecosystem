# UI Design System - Component Reference

> Source: Figma UI Kit (`IY3cgfCMyHNuPhL0Ba8mM9`)
> Extracted: 2026-02-19
> Font family: **Inter** (all components)

---

## Global Design Tokens

### Colors

**Color base rule:** `#1c1c1c` for all text, icons, and content fills (with opacity variants). `#000000` exclusively for structural elements (borders at 5%, shadows). Never use `#000000` for text or icons — always use `#1c1c1c` with the appropriate opacity level.

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-text-primary` | `#1c1c1c` | Primary text, icons, active elements |
| `--color-text-secondary` | `#1c1c1c` (50% opacity) | Secondary text, descriptions, placeholders |
| `--color-text-tertiary` | `#1c1c1c` (40% opacity) | Muted labels, axis labels |
| `--color-text-disabled` | `#73787d` | Disabled button text |
| `--color-text-placeholder` | `#1c1c1c` (30% opacity) | Input placeholders |
| `--color-bg-primary` | `#ffffff` | Cards, modals, inputs |
| `--color-bg-secondary` | `#fbfbfb` | Active tabs, hover states, search field |
| `--color-bg-tertiary` | `#f2f2f2` | Secondary button fill |
| `--color-bg-subtle` | `#1c1c1c` (5% opacity) | Sidebar active tab, filter pills, inactive items |
| `--color-bg-inverse` | `#1c1c1c` | Primary buttons, active dropdown items, checkboxes |
| `--color-text-inverse` | `#ffffff` | Text on inverse backgrounds |
| `--color-border` | `#000000` (5% opacity, 1px, INSIDE) | Card/input/modal borders |
| `--color-hover` | `#fbfbfb` (75% opacity) | Button hover state |

### Semantic Feedback Colors

Global colors for error, warning, info, and success states. Each state has 3 tokens: content (text/icons), surface (alert/badge backgrounds), and border.

#### Error / Danger

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-error` | `#8a1111` | `#ef4444` | Error text, icons, destructive actions |
| `--color-error-bg` | `#fef2f2` | `#451a1a` | Error alert/badge background |
| `--color-error-border` | `#f5c6c6` | `#7f1d1d` | Error alert/input border |

#### Warning

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-warning` | `#92400e` | `#f59e0b` | Warning text, icons |
| `--color-warning-bg` | `#fffbeb` | `#451a03` | Warning alert/badge background |
| `--color-warning-border` | `#fde68a` | `#78350f` | Warning alert border |

#### Info

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-info` | `#1e40af` | `#60a5fa` | Info text, icons |
| `--color-info-bg` | `#eff6ff` | `#172554` | Info alert/badge background |
| `--color-info-border` | `#bfdbfe` | `#1e3a5f` | Info alert border |

#### Success

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-success` | `#166534` | `#22c55e` | Success text, icons |
| `--color-success-bg` | `#f0fdf4` | `#14261c` | Success alert/badge background |
| `--color-success-border` | `#bbf7d0` | `#166534` | Success alert border |

### Typography Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-display` | 36px | 700 | 36px | Speedometer percentage |
| `--text-heading-lg` | 24px | 600 | 36px | Card values, large numbers |
| `--text-heading-md` | 20px | 600 | 20px | Modal title |
| `--text-heading-sm` | 16px | 700 | ~19px | Tooltip title |
| `--text-body-lg` | 16px | 500 | ~19px | Button text (lg), input prefix (country code, currency) |
| `--text-body-md` | 15px | 400 | 22.5px-24px | Input text, calendar dates |
| `--text-label` | 15px | 600 | 22px | Input labels (associated to form fields) |
| `--text-body-sm` | 14px | 400-700 | 14px-21px | Tab text, sidebar items, breadcrumbs, descriptions |
| `--text-caption` | 12px | 400-600 | 14.5px-18px | Card title, calendar weekdays, filter labels, tags |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-card` | `6px 6px 50px #0000000d` | Dashboard cards, modals, dropdowns |
| `--shadow-auth-card` | `0 8px 32px rgba(0,0,0,0.04)` | Auth card only — subtle, no border interference |
| `--shadow-avatar` | `0 1px 2px #0000000f, 0 1px 3px #0000001a` | Notification avatars |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | `0` | Default |
| `--radius-xs` | `4px` | Tooltip body |
| `--radius-sm` | `5px` | Tabs, pagination items, checkboxes |
| `--radius-md` | `6px` | Buttons, slider track |
| `--radius-lg` | `8px` | Input fields (payment form), calendar date BG, tags |
| `--radius-xl` | `12px` | Sidebar inactive tab, toast message |
| `--radius-2xl` | `16px` | Cards, analytics graph |
| `--radius-3xl` | `24px` | Calendar, modal, dropdown, notification, sidebar active, filter pills, search bar |
| `--radius-full` | `100px` | Search field, quick notification, text input (pill) |
| `--radius-circle` | `40px+` | Avatars |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-2` | `2px` | Tag vertical padding |
| `--space-4` | `4px` | Icon padding, sidebar items gap, breadcrumb padding, divider gap |
| `--space-6` | `6px` | Checkbox label gap, filter pill padding |
| `--space-8` | `8px` | Card gap, dropdown items, sidebar padding, modal button padding, breadcrumb gap, toast padding |
| `--space-10` | `10px` | Tab padding, button item spacing |
| `--space-12` | `12px` | Modal button area padding, button inner padding, search input padding |
| `--space-16` | `16px` | Analytics gap, notification gap, input padding LR, search bar padding LR, quick notification gap |
| `--space-20` | `20px` | Calendar gap, checkbox group gap, button set gap |
| `--space-24` | `24px` | Card padding, calendar padding, dropdown padding, notification padding, payment form padding, form gap, button padding LR, search field padding L |
| `--space-32` | `32px` | Notification top gap |
| `--space-36` | `36px` | Primary button padding LR |

---

## Theme System (Light / Dark)

Figma only designs the **Light** theme. The **Dark** theme is derived from the token mapping below and implemented in code via CSS custom properties + Tailwind's `dark:` variant.

### Toggle Component

The light/dark theme toggle button. **Promoted to its own dedicated Components section** as part of B9a (SCRUM-343 / Decision 1 Option A) — see §44 ThemeToggle for the canonical spec (composes §37 IconButton, SSR-safe mounted state, dynamic aria-label, lucide `Sun` / `Moon` icons).

### Token Mapping (Light → Dark)

| Token | Light | Dark |
|-------|-------|------|
| `--color-bg-primary` | `#ffffff` | `#1a1a1a` |
| `--color-bg-secondary` | `#fbfbfb` | `#2a2a2a` |
| `--color-bg-inverse` | `#1c1c1c` | `#ffffff` |
| `--color-text-primary` | `#1c1c1c` | `#f5f5f5` |
| `--color-text-inverse` | `#ffffff` | `#1c1c1c` |
| `--color-border` | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.08)` |
| `--color-border-strong` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.12)` |
| `--color-bg-subtle` | `rgba(28,28,28,0.05)` | `rgba(255,255,255,0.05)` |
| `--color-hover` | `#fbfbfb` | `#2a2a2a` |

Semantic feedback colors (error, warning, info, success) already have Light/Dark values defined in the Global Design Tokens section above.

### Implementation Rules

1. **Figma**: Only design Light variants. Dark is generated from token mapping.
2. **Code**: Use Tailwind semantic tokens (`text-content-primary`, `bg-surface-default`, etc.) — never hardcode hex values.
3. **Toggle**: Persisted in `localStorage`, defaults to system preference via `prefers-color-scheme`.
4. **CSS**: Apply `dark` class on `<html>` element. All `dark:` overrides flow through CSS custom properties in `globals.css`.

---

## Components

### 1. Card

CSS-class primitive (NOT a `.tsx` component) — defined in `globals.css` as 4 distinct utility classes that vary on **radius** (12px vs 24px) and **shadow** (with vs without). Used directly in JSX via `className="card-flat"` etc., not via a wrapper React component.

> **Note on the 4-class structure:** unlike most §sections in this doc which document a single React component with a unique spec export, §1 Card documents 4 CSS classes from `globals.css`. The classes share the same base styling (background `--surface-primary`, border `1px solid --border-strong`, padding `24px`) and differ only on the 2 axes below.

**4 CSS classes (comparison):**

| Class | Radius | Box-shadow | Use case |
|-------|--------|------------|----------|
| `.card-container` | `24px` | `0 8px 32px rgba(0,0,0,0.04)` | Large card with elevation (page-level containers, dashboard sections) |
| `.card` | `12px` | `0 8px 32px rgba(0,0,0,0.04)` | Standard card with elevation (most cards in the dashboard) |
| `.card-flat` | `12px` | (none) | In-flow card without elevation — used by §48 StickyCard for the in-flow state (visible weight comes from the sticky-floating mode shadow) |
| `.card-container-flat` | `24px` | (none) | Large flat card without elevation — for nested contexts where a parent already provides elevation |

**Shared base styling (all 4 classes):**
- Background: `var(--surface-primary)` (`#ffffff` light / `#1a1a1a` dark)
- Border: `1px solid var(--border-strong)` (`rgba(0,0,0,0.08)` light / `rgba(255,255,255,0.12)` dark)
- Padding: `24px` all sides

**Variant selection guide:**

| Need | Class |
|------|-------|
| Large container with elevation | `.card-container` |
| Standard card with elevation (default choice) | `.card` |
| In-flow card without elevation (e.g., StickyCard pre-floating state) | `.card-flat` |
| Large nested card without elevation | `.card-container-flat` |

**Token references:**
- `--surface-primary` (background)
- `--border-strong` (border, 8% opacity light / 12% opacity dark)
- Radius: `12px` or `24px` (currently hardcoded — see disclosure below)
- Shadow: `0 8px 32px rgba(0,0,0,0.04)` (currently hardcoded — see disclosure below)
- Padding: `24px` (currently hardcoded — see disclosure below)

> **Note on hardcoded values:** the 4 classes use hardcoded `border-radius`, `box-shadow`, and `padding` values — not yet tokenized as `--radius-md` / `--radius-3xl` / `--shadow-card` / `--space-6`. Future cleanup could migrate to tokens for consistency with the rest of the design system. Currently these values predate the token system.

**Source:**
- Code: `nexacore-dashboard/src/app/globals.css` lines 200-229
- Spec export: **none** (CSS class, not a React component — no spec object applies)
- Cross-reference: §48 StickyCard (canonical consumer of `.card-flat`); deleted Common Patterns "Card-style Container" sub-section (canonicalized into this §1 — see B10b SCRUM-346)

> **Note on deleted Common Patterns "Card-style Container":** prior to B10b, the doc had a parallel description of card styling in Common Patterns "Card-style Container" sub-section (raw hex values, outdated `Used by` list referencing §sections that have since been deleted in B4 + B10a). Deleted as part of B10b (SCRUM-346 / Option A canonicalization). §1 Card is now the single source of truth for card styling. Same canonicalization precedent as B4 Ambiguity 1, B7 Common Patterns Button cleanup, B8 InlineError promotion, B9a Common Patterns Selector Trigger cleanup.

---

### 2. Sidebar Items

Sophisticated multi-mode navigation primitive — vertical sidebar with collapsed (icons-only) and expanded (full) display modes, accordion children, hover flyout popovers in collapsed state, and embedded primitive integration (Tabs + IconButton + Tooltip).

| Property | Value |
|----------|-------|
| Display modes | `collapsed` (icons-only, w-[68px]) and `expanded` (full sidebar, w-[300px]) |
| Container styling | `bg-surface-primary rounded-r-xl border border-border-strong shadow-card` |
| Section gap | `flex-col gap-2` (8px between sections) |
| Section header | `text-body font-normal text-content-tertiary px-2 mb-2` (hidden when collapsed) |
| Item height | `h-9` (36px) — fixed across all variants (matches §5 Tabs nav variant) |
| Footer slot | Optional `footer` prop — renders at bottom with `flex-1` spacer above |

**Data structure:**
- Sections: array of `{ label: string, items: SidebarNavItem[] }`
- Items: `{ href, label, icon: LucideIcon, active?: boolean, children?: SidebarNavItem[] }`
- Children are 1 level deep (no nested accordion)

**Item types:**
- **Leaf item**: no `children` array — renders as direct nav link (Tabs variant=nav inactive/active styling)
- **Parent item**: has `children` array — renders as accordion in expanded mode, flyout in collapsed mode. The parent row itself is NEVER active; only its children can be active.

#### Expanded mode (sidebar wide)

**Leaf item:**
- Inherits styling from §5 Tabs `variant=nav`:
  - Active: `bg-surface-subtle rounded-md text-body font-normal text-content-primary`
  - Inactive: `text-body font-normal text-content-primary/75 hover:bg-surface-subtle hover:text-content-primary rounded-md`
- Layout: `flex items-center gap-1 px-2 py-2 h-9 w-full`
- Inactive prefix: `ChevronRight` lucide 16px `text-content-primary/75` (visual cue for navigation; hidden when active)
- Followed by: 16px lucide icon + label text
- Wrapped in Next.js `<Link>` for client-side navigation (via `renderTab` callback to §5 Tabs)

**Parent item (accordion):**
- Parent row uses Tabs variant=nav inactive styling (always — parent is never marked active)
- Click toggles open/closed: tracked via `openParents` Set state
- Auto-open when any child is active (computed via `isParentOpen`)
- Chevron icon: `ChevronDown` when open, `ChevronRight` when closed (16px `text-content-primary/75`)
- Children render below at `pl-4` indent (16px left padding) using nested §5 Tabs `variant=nav`
- Each child uses the same active/inactive styling as leaf items

#### Collapsed mode (sidebar narrow icons-only)

**Section labels:** hidden entirely (`label={collapsed ? "" : section.label}`)

**Leaf item:**
- Wrapped in §9 Tooltip with `position="right"` — shows the item label on hover (since text isn't visible)
- Wrapped in Next.js `<Link>` for navigation
- Renders as IconButton primitive: `iconBtnBase + iconBtnSizes.sm + iconBtnVariants.boxed`
- `aria-pressed="true"` when active — combines with boxed variant's `aria-pressed:ring-1 ring-border-components` for the active ring effect

**Parent item (with children):**
- Wrapped in custom `SidebarFlyout` component (NOT a regular Tooltip) — opens a popover with the parent label + child links
- Renders as IconButton: same shell as leaf (boxed variant)
- `aria-pressed="true"` when ANY child is active (parent visually shows active state in collapsed mode, unlike expanded mode)

**SidebarFlyout popover (collapsed parent items only):**
- Trigger: hover (mouse) or click (touch)
- Hover behavior: 200ms enter delay, 150ms leave delay (the leave delay bridges the gap between trigger and flyout — moving cursor from trigger to flyout doesn't dismiss)
- Touch device detection: `window.matchMedia("(pointer: coarse)").matches` switches to click-to-toggle
- Render: `createPortal(flyoutEl, document.body)` — escapes the sidebar's `overflow:hidden` so the popover can extend beyond the sidebar's bounds
- Position: `fixed`, computed via `getBoundingClientRect()`: `left = trigger.right + 8px`, `top = trigger.top`
- z-index: `z-[9999]`
- Container: `rounded-xl border border-border-strong bg-surface-primary p-2 shadow-card min-w-[180px]`
- Header: parent label as `px-3 py-1.5 text-body font-normal text-content-tertiary`
- Items: Next.js `<Link>` with `flex items-center gap-2 px-3 py-2 rounded-lg text-body text-content-primary hover:bg-surface-subtle`
- Each item: 16px lucide icon (child's `icon`) + label

#### Embedded primitives

This component composes 3 other primitives — when changes are made to those, this component must be retested:

- **§5 Tabs `variant=nav`** — base item styling for both leaf items and accordion children. Used via `renderTab` callback for custom Link wrapping while preserving Tabs accessibility (role="tablist", role="tab", aria-selected, keyboard nav).
- **IconButton `variant=boxed`** (currently undocumented in own section — see Common Patterns) — for collapsed-mode item buttons and parent flyout triggers. Used via direct className composition (`iconBtnBase + iconBtnSizes.sm + iconBtnVariants.boxed`) rather than the IconButton React component, because SidebarNav needs the wrapping behavior (Tooltip, SidebarFlyout) around the button itself.
- **§9 Tooltip `position=right`** — for collapsed-mode leaf item hover labels.

#### Accessibility

- Sidebar root: `<nav>` element (no explicit role override needed; `<nav>` carries semantics)
- Leaf items: `<a>` (Next.js Link) with `aria-pressed` for active indication in collapsed state
- Parent items in expanded mode: `<button>` (toggle accordion)
- Parent items in collapsed mode: `<button>` wrapped in custom flyout (hover/touch behavior)
- Tooltip integration provides screen reader labels in collapsed state (where text labels aren't visible)

#### Token references

- `--surface-primary`, `--surface-subtle`, `--content-primary`, `--content-tertiary`, `--border-strong`, `--border-components` (via embedded primitives)

#### Source

- Code: `nexacore-dashboard/src/components/ui/SidebarNav.tsx`
- Spec export: `sidebarNavSpecs` (line 41)
- Embeds: `§5 Tabs` (Tabs.tsx — variant=nav), IconButton (IconButton.tsx — variant=boxed), `§9 Tooltip` (Tooltip.tsx — position=right)

---

### 3. Calendar

Date-picker calendar with three view modes (days / months / years), Monday-based weeks, and click-to-zoom navigation between modes. Used by §17 DateInput as the popover content. Token-based throughout — no raw hex.

| Property | Default | Type |
|----------|---------|------|
| `value` | — | `Date` (optional — currently selected date; controls `aria-selected` highlight) |
| `onChange` | — | `(date: Date) => void` (required — fired when user selects a day) |
| `minDate` | — | `Date` (optional — disables days before this date) |
| `maxDate` | — | `Date` (optional — disables days after this date) |
| `disabled` | `false` | `boolean` (disables all interaction — applies `opacity-50` to nav arrows; days inherit disabled state) |
| `className` | `""` | `string` |

**Container styling:** `w-[300px] bg-surface-primary border border-border-components rounded-xl p-6 flex flex-col gap-5 shadow-card`. Fixed 300px width — designed to fit inside §17 DateInput's popover. Padding `p-6` (24px) + internal gap `gap-5` (20px) between header and day grid.

> **Drift note (vs prior doc):** previous §4 specified `radius 24px` (`rounded-3xl`) container and 24×24 nav arrows with `rounded-1000px`. Current code uses `rounded-xl` (12px) container and `w-6 h-6 rounded-full` nav arrows. Doc now reflects code reality.

**Three view modes** (state machine: `days → months → years` via header click; `years → months → days` via selection):

- **`days`** (default) — 7-column grid (`grid-cols-7 gap-y-1`) showing the current month. 42 cells (6 weeks × 7 days) — fills with previous/next month days for the leading and trailing weeks. Header click → switches to `months` view.
- **`months`** — 3-column grid (`grid-cols-3 gap-2`) showing month abbreviations (Jan/Feb/Mar/.../Dec). Header click → switches to `years` view. Month click → returns to `days` view at the selected month.
- **`years`** — 3-column grid (`grid-cols-3 gap-2`) showing a 12-year window (`yearRangeStart` to `yearRangeStart + 11`). Header is non-clickable (terminal view). Year click → returns to `months` view at the selected year.

**Header navigation** (shared across all 3 views):
- Layout: `flex items-center justify-between` — Previous arrow / centered label / Next arrow
- **Previous/Next arrows**: `w-6 h-6 flex items-center justify-center rounded-full bg-surface-subtle hover:bg-surface-subtle transition-colors disabled:opacity-50`. Icon: `ChevronLeft` / `ChevronRight` lucide 16px, `text-content-primary`.
- **Header label** (clickable button — except in `years` mode):
  - `text-body font-semibold transition-colors`
  - Active modes (days/months): `text-content-primary/75 hover:text-content-primary cursor-pointer` — opacity pattern reference (consumer can click to zoom out)
  - Terminal mode (years): `text-content-primary cursor-default` — non-clickable (no further zoom-out level)
  - Label content per mode:
    - `days` → `"{Month} {Year}"` (e.g., "May 2026") via `Date.toLocaleDateString("en-US", {month: "long", year: "numeric"})`
    - `months` → `"{Year}"` (e.g., "2026")
    - `years` → `"{rangeStart} — {rangeEnd}"` (e.g., "2016 — 2027")
- Arrow behavior per mode:
  - `days`: prev/next month (wraps year boundary at Jan ↔ Dec)
  - `months`: prev/next year
  - `years`: prev/next 12-year window

**Weekday header (days view only):** `MON / TUE / WED / THU / FRI / SAT / SUN` — **Monday-based** (NOT Sunday-based). Implementation converts `Date.getDay()` Sunday=0 to Monday-based via `(day === 0 ? 6 : day - 1)`. Each weekday cell: `text-center text-caption font-normal text-content-primary py-1` with `role="columnheader"`.

**Day cell styling** (shared base): `min-w-9 h-9 px-2 mx-auto flex items-center justify-center text-body font-normal rounded-full transition-colors`. The `min-w-9` (36px) + `h-9` (36px) creates a circular touch target; `rounded-full` makes day backgrounds round (NOT square cells).

**Day cell states** (per cell, mutually exclusive — checked in this priority order in JSX):

| State | Styling | Token references |
|-------|---------|------------------|
| `selected` (matches `value` prop via `isSameDay`) | `bg-surface-inverse text-content-inverse font-normal` (filled DARK) | `--surface-inverse`, `--content-inverse` |
| `today` (matches today's date) | `bg-surface-subtle text-content-primary font-normal` | `--surface-subtle`, `--content-primary` |
| current month (default) | `text-content-primary hover:bg-surface-subtle` | `--content-primary`, `--surface-subtle` |
| other month (prev/next month fillers) | `text-content-primary/50` — see [Display primitives opacity pattern](#display-primitives-opacity-pattern) | `--content-primary` at 50% opacity |
| `disabled` (matches `minDate`/`maxDate` or `disabled` prop) | `opacity-30 cursor-not-allowed` (multiplicative — applied AFTER state styling) | (Tailwind opacity modifier) |

> **Drift note (selected day):** previous §4 said selected day was `32×32 dark active 5%` filled. Current code uses `min-w-9 h-9 bg-surface-inverse` (filled DARK at 100%, NOT 5%). Doc now reflects code reality.

> **Opacity pattern extension:** The `text-content-primary/50` for other-month days is the **10th occurrence** of the [Display primitives opacity pattern](#display-primitives-opacity-pattern) across 4 clusters (B6: 5, B7: +3, B8: +1, B9a: +1). Coordinated migration scope grew. Inline cross-reference; B6 Pattern note table NOT modified (cluster-scope semantics preserved per B7/B8 precedent).

> **New 4th opacity step (`opacity-30`):** Calendar disabled days use `opacity-30 cursor-not-allowed` — beyond the established `text-content-primary/{30,50,75}` series. The `opacity-30` here is a Tailwind opacity *modifier on the entire element* (not just text color), distinct from `text-content-primary/30` (text-color opacity). Worth surfacing as a separate disclosure category — the opacity pattern document covers text colors; this is element-level opacity. Future cleanup could either extend the Pattern note's scope or document element-opacity separately.

**Months view styling** (when `viewMode === "months"`): `grid grid-cols-3 gap-2`, each month cell uses the same shared `cellClass()` with active/current logic adapted to month-level granularity. Month labels: `Jan / Feb / Mar / Apr / May / Jun / Jul / Aug / Sep / Oct / Nov / Dec`.

**Years view styling** (when `viewMode === "years"`): `grid grid-cols-3 gap-2`, 12 cells showing years from `yearRangeStart` to `yearRangeStart + 11`. The window slides via prev/next arrows.

**State management:**
- `viewMode: "days" | "months" | "years"` — current view
- `viewYear: number` — currently displayed year (for days/months) — defaults to `value?.getFullYear() ?? today.getFullYear()`
- `viewMonth: number` — currently displayed month (0-11, days view only) — defaults to `value?.getMonth() ?? today.getMonth()`
- `yearRangeStart: number` — start of the 12-year window (years view) — `Math.floor(year / 12) * 12`

**Accessibility:**
- Day grid: `role="grid"` (days view only)
- Weekday cells: `role="columnheader"`
- Day buttons: `aria-label={day.date.toLocaleDateString()}` (full localized date e.g. "5/3/2026"), `aria-selected={day.isSelected}`
- Navigation arrows: `aria-label="Previous"` / `aria-label="Next"` (English-only — i18n enhancement pending)
- Disabled days: `disabled` HTML attribute (keyboard nav skips them)
- Header button: button semantics implicit (no explicit ARIA needed)

**Token references:**
- Container: `--surface-primary`, `--border-components`, `--radius-xl`, `--space-6` (p-6), `--space-5` (gap-5), `--shadow-card`
- Navigation arrows: `--surface-subtle`, `--content-primary`
- Header label: `--content-primary` at 75% (active modes — opacity pattern), `--content-primary` at 100% (terminal years mode), `--text-body`
- Weekday: `--text-caption`, `--content-primary`, `--space-1` (py-1)
- Day cell: `--text-body`, `--surface-inverse`, `--content-inverse` (selected); `--surface-subtle`, `--content-primary` (today + hover); `--content-primary` at 50% (other month — opacity pattern); `opacity-30` (disabled — element-level)
- Day cell sizing: `--space-9` (h-9, min-w-9), `--space-2` (px-2)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Calendar.tsx`
- Spec export: `calendarSpecs` (line 50)
- Cross-reference: §17 DateInput (canonical consumer — wraps Calendar in popover)

> **Drift note (3 view modes):** Previous §4 only documented the `days` view. Current code has full state machine `days ↔ months ↔ years` with clickable header. Doc now covers all 3 modes + the inter-mode navigation.

---

### 4. Modal

ConfirmModal primitive — accessible dialog with focus trap, autofocus rules, scroll lock, and standard confirm/cancel + danger flow. Title kept as "Modal" (matches Figma kit + registry naming). For idle session warnings, see §21 IdleWarningModal (specialized variant with different shape).

| Property | Value |
|----------|-------|
| Sizes | `sm` (max-w-[390px]), `md` (max-w-[480px]), `lg` (max-w-[600px]), `xl` (max-w-[720px]) |
| Default size | `sm` |
| Variants | `primary` (default — Button primary), `danger` (red Confirm button — destructive actions) |
| Container | `w-full ${size} mx-4 max-h-[90vh] overflow-y-auto rounded-xl border border-border-strong bg-surface-secondary shadow-card` |
| Border radius | `rounded-xl` (12px) |

**Layout (2 sections):**
- **Top section** (rounded-t-xl, bg-surface-primary, p-4 sm:p-6, border-b border-border-strong): contains the X close IconButton (top-right, absolute), title, description, and optional `children` slot (for inline form inputs)
- **Bottom section** (rounded-b-xl, bg-surface-secondary, px-4 py-3 sm:px-6): contains the Cancel + Confirm buttons aligned right with `gap-3`

**Title:**
- `id="confirm-modal-title"` (referenced by `aria-labelledby`)
- `text-h2 font-semibold text-content-primary`
- `pr-8` so it doesn't collide with the absolute-positioned X close button

**Description:**
- `text-body text-content-secondary`
- Optional `pr-4` margin

**X close button:**
- `IconButton variant="default" size="sm"` with `X` lucide 16px
- Positioned `absolute right-4 top-4 sm:right-6 sm:top-6`
- Always visible (not hover-only — mobile requires permanent visibility per accessibility guidance)
- `aria-label="Close"`

**Cancel button:**
- `Button variant="outline" size="md" fullWidth=false`
- `data-role="modal-cancel"` (used by autofocus algorithm)
- Disabled while `loading={true}`

**Confirm button:**
- `Button` with `variant="primary"` or `variant="danger"` (depending on the modal's `variant` prop)
- `data-role="modal-confirm"` (used by autofocus algorithm)
- `loading={loading}` shows the in-button spinner

**Variants:**
- `primary` (default): Confirm button uses `bg-surface-inverse text-content-inverse` (filled dark)
- `danger`: Confirm button uses `bg-error` (red — destructive actions like delete account, revoke session)

**Accessibility:**
- Container: `role="dialog"` + `aria-modal="true"` + `aria-labelledby="confirm-modal-title"`
- **Focus trap**: Tab / Shift+Tab cycles within the modal (queries all focusable: `button, input, textarea, [tabindex]`)
- **Escape**: closes the modal (triggers `onClose`)
- **Enter**: triggers `onConfirm` (standard form submission). Suppressed when target is `<textarea>` or `<button>`.
- **Overlay click**: does NOT close the modal (prevents accidental dismissal mid-form)
- **Focus restore**: on close, focus returns to the element that was focused before the modal opened (`previousFocusRef`)

**Autofocus algorithm (smart, runs on `open` change):**
1. **First input present** (`<input>` or `<textarea>` not disabled) → focus that
2. **Danger variant + no input** → focus Cancel button (defensive — prevents accidental destructive confirm via Enter)
3. **Primary variant + no input** → focus Confirm button (assumes user will hit Enter to proceed)
- Per W3C WAI ARIA APG (Authoring Practices Guide) for dialogs

**Body scroll lock (prevents layout shift):**
- On open: `document.body.style.overflow = "hidden"` + `paddingRight = scrollbarWidth` (prevents page jiggling when scrollbar disappears)
- On close: both styles restored

**Composition with `children`:**
- For form modals: pass form `<Input>` + validators as children. They render below the description in the top section.
- Enter on input fields triggers `onConfirm` (form submission pattern).
- Pair with `size="md"` or `"lg"` for forms (sm is too narrow for input fields).

**Token references:**
- `--surface-primary`, `--surface-secondary`, `--content-primary`, `--content-secondary`, `--content-inverse`, `--border-strong`, `--color-error`
- CSS var: `var(--overlay)` for the background overlay (declared in globals.css — typically `rgba(0,0,0,0.5)` or similar)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/ConfirmModal.tsx`
- Spec export: `confirmModalSpecs` (line 8)
- Cross-reference: §21 IdleWarningModal (specialized idle session warning variant — different shape, no focus trap)

---

### 5. Tabs

Tabbed selector primitive with 3 visual variants. Built on `<button role="tab">` with full keyboard navigation. Optional custom render via `renderTab` prop (used by §2 Sidebar Items to inject Next.js `<Link>` wrappers).

| Property | Value |
|----------|-------|
| Variants | `subtle` (general use), `nav` (vertical sidebar), `nav-horizontal` (top bar) |
| Default variant | `nav` |
| Sizes (subtle only) | `sm` (h-8 / 32px), `md` (h-10 / 40px), `lg` (h-12 / 48px) |
| Default size | `md` |
| Container | `<div role="tablist">` |
| Per-tab element | `<button role="tab" aria-selected>` (keyboard: tabIndex 0 active, -1 others) |

**Variant `subtle`** (general selector — Figma's primary tabs example):
- Container: `bg-surface-primary border border-border-components rounded-[5px] shadow-[6px_6px_50px_rgba(0,0,0,0.05)]`
- Active tab: `bg-surface-secondary border border-border-components font-semibold text-content-primary`
- Inactive tab: `font-semibold text-content-primary hover:bg-surface-subtle`
- Tab dividers: `border-r border-border-components` between items (except the last)
- Sizes: 3 sizes available (sm/md/lg); padding + text token vary per size

**Variant `nav`** (vertical sidebar nav — used inside §2 Sidebar Items):
- Container: `flex-col gap-2` (vertical, 8px between items — matches NavBar icon spacing)
- Active item: `bg-surface-subtle rounded-md text-body font-normal text-content-primary`
- Inactive item: `text-body font-normal text-content-primary/75 hover:bg-surface-subtle hover:text-content-primary rounded-md`
- Per-item: `flex items-center gap-1 px-2 py-2 h-9 (36px) w-full`
- ChevronRight 16px `text-content-primary/75` on inactive items only (visual cue for the next-level navigation)
- Optional 16px lucide icon per tab

**Variant `nav-horizontal`** (top nav bar):
- Same active/inactive styling as `nav` variant
- Container: horizontal `gap-2` (NOT `flex-col`)
- Per-item: same h-9 + padding as nav, but no `w-full` (items are inline-sized)

**States (across all variants):**
- Active: bold or filled per variant rules above; `aria-selected="true"`; `tabIndex=0` (focusable in tab order)
- Inactive: lighter styling per variant; `aria-selected="false"`; `tabIndex=-1` (skipped in tab order)
- Hover: per-variant inactive hover state (subtle bg or color shift)

**Keyboard navigation:**
- `ArrowRight` / `ArrowLeft`: cycle through tabs (wraps at ends)
- `Home`: jump to first tab
- `End`: jump to last tab
- Activating a tab via keyboard: triggers `onChange(tab.value)` AND focuses the new tab
- Note: keyboard navigation moves both focus AND active state in lockstep (a "manual activation" alternative is NOT implemented — every keyboard navigation activates the tab)

**Accessibility:**
- `role="tablist"` on container
- `role="tab"` on each `<button>`
- `aria-selected={isActive}` per tab
- `tabIndex` per active state (0 = focusable, -1 = skip)

**Custom rendering (`renderTab` prop):**
- Optional callback `(props: TabRenderProps) => ReactNode` that replaces the default `<button>` per tab
- Receives: `tab` (the data), `isActive` (state), `className` (computed styling), `onClick` (handler)
- Used by §2 Sidebar Items to wrap each tab in a Next.js `<Link>` for client-side navigation while preserving the Tabs styling and a11y

**Overflow handling (subtle + nav-horizontal only — vertical `nav` doesn't overflow):**
- `wrap` prop = false (default): `overflow-x-auto scrollbar-hide touch-pan-x` enables horizontal scroll
- Drag-to-scroll: touch via `touch-pan-x`; mouse via browser default (no custom mouse-drag handler)
- `wrap` prop = true: `flex-wrap` allows tabs to wrap to next line instead

**Dot indicators (spec'd but currently unimplemented in JSX):**
- `tabsSpecs.overflow.indicators` documents intent: `h-[9px] w-[9px] rounded-full` button row, `bg-surface-inverse` for active and `bg-border-strong` for inactive, click triggers `setActiveTab + scrollIntoView smooth center`, visibility `sm:hidden` (mobile only when tabs overflow)
- Status: NOT currently rendered by `Tabs.tsx`. The spec export captures the design intent for a future enhancement. Future code-side work would add this rendering; until then, this section documents the spec as a forward-looking baseline for the dot-indicator feature.

**Token references:**
- `--surface-primary`, `--surface-secondary`, `--surface-subtle`, `--surface-inverse`, `--content-primary`, `--border-components`, `--border-strong`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Tabs.tsx`
- Spec exports: `tabsSpecs` (line 61), `variantStyles` (line 37), `sizeClasses` (line 31)

---

### 6. Context Menu

> **Doc-only — pending implementation.** This section describes a 6-item right-click context menu pattern (Edit / Duplicate / Archive / etc., plus a Delete item). No corresponding `ContextMenu` component exists in code yet. The spec is preserved as a forward-looking design baseline; when the component is built, this section will be reconciled with `contextMenuSpecs` (or equivalent export) at that time. Originally documented as "Dropdown" — renamed to disambiguate from the form-input `Select` component (now §22).

Context menu with icon + label items.

| Property | Value |
|----------|-------|
| Dimensions | 241 x 272 |
| Background | `#ffffff` |
| Border | 1px `#000000` (5% opacity, INSIDE) |
| Shadow | `6px 6px 50px #0000000d` |
| Corner radius | 24px |
| Padding | 24px all |
| Layout | Vertical |

**Active Item:**
- Fill: `#1c1c1c`, radius 24px, padding 8px, gap 8px
- Icon: 16x16, white strokes/fills
- Text: 12px/400, `#ffffff`

**Inactive Item (x6):**
- No fill, radius 24px, padding 8px, gap 8px
- Icon: 16x16, `#1c1c1c` strokes
- Text: 12px/400, `#1c1c1c`
- Items: Edit, Duplicate, Archive, Move, Share, Add to favorites

**Delete Item:**
- No fill, radius 24px, padding 8px, gap 8px
- Icon: 16x16, `#8a1111` strokes
- Text: 12px/400, `#8a1111`

---

### 7. Analytics Graph

Chart card with title tabs, legend tags, and y-axis labels.

| Property | Value |
|----------|-------|
| Dimensions | 538 x 330 |
| Background | `#ffffff` |
| Border | 1px `#000000` (5% opacity, INSIDE) |
| Shadow | `6px 6px 50px #0000000d` |
| Corner radius | 16px |
| Padding | 24px all |
| Gap | 16px |
| Layout | Vertical |

**Info bar** — Horizontal (gap 16px):
- Active label: 14px/600, `#1c1c1c` (e.g. "Total Revenues")
- Inactive label: 14px/400, `#1c1c1c` 40% opacity (e.g. "Total Orders")
- Divider: "|", 14px/400, `#1c1c1c` 20% opacity
- Tags: Horizontal (padding 2/8/2/4, radius 8px), Dot (16x16) + Name (12px/400)

**Chart area** — Horizontal (gap 16px):
- Y-axis numbers: 12px/400, `#1c1c1c` 40% opacity, right-aligned ("30K", "20K", "10K", "0")
- Graph frame (451x244): Upper line, date labels, chart curves

---

### 8. Breadcrumbs

Hierarchical path indicator with home icon, chevron separators, and auto-collapse when the path overflows its container. Built on Next.js `<Link>` for client-side navigation.

| Property | Value |
|----------|-------|
| Container | `flex min-w-0 items-center` |
| Item gap | `gap-1` (4px between items) |
| Home icon | `Birdhouse` lucide 16px, links to `/dashboard` |
| Separator | `ChevronRight` lucide 16px between all levels |
| Auto-collapse | `ResizeObserver` watches container; collapses to `Home / … / Last` when full content overflows |

**Home (always rendered, leftmost):**
- `<Link>` to `/dashboard` containing `Birdhouse` lucide 16px
- Default: `text-content-tertiary`
- Hover: `text-content-primary` (transition-colors)
- `shrink-0` so it never gets compressed during overflow detection

**Separator (between all items):**
- `ChevronRight` lucide 16px `shrink-0 text-content-tertiary`
- Rendered before each item (including the first item after Home)

**Inactive links (intermediate items):**
- `<Link>` with `text-body font-normal text-content-tertiary transition-colors hover:text-content-primary`
- Note: spec export `breadcrumbsSpecs.link.inactive` documents this as `text-content-primary/75`, but the actual JSX uses `text-content-tertiary` — the JSX value is the rendered reality. The spec export is slightly outdated; future code-side cleanup could reconcile by updating either the JSX or the spec export.

**Active item (last item, no link):**
- Plain `<span>` (not a Link) with `text-body font-normal text-content-primary`
- Conventionally the current page name — no navigation action

**Auto-collapse behavior:**
- A "full" version and a "collapsed" version are both rendered; the full version is measured via `ResizeObserver`
- When `full.scrollWidth > container.clientWidth + 1` → collapsed mode activates
- Collapsed render: `Home / … / Last` (the `…` is plain text in `text-content-tertiary` with `px-2 py-1` padding; not a clickable element)
- The collapse threshold updates dynamically when the container is resized (e.g., responsive sidebar collapse, window resize)

**Token references:**
- `--content-primary`, `--content-tertiary`, `--surface-primary` (inherited from container background)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Breadcrumbs.tsx`
- Spec export: `breadcrumbsSpecs` (line 16)

---

### 9. Tooltip

Tooltip primitive — small popover with text on hover/focus. Built on a Radix-style `cloneElement` pattern (no wrapper div — handlers injected directly into the child element). Portal-rendered. Hidden entirely on touch devices.

| Property | Value |
|----------|-------|
| Container | `rounded-lg border border-border-components bg-surface-primary px-4 py-3` |
| Max width | `241px` (override via `maxWidth` prop, default 241) |
| Border radius | `rounded-lg` (8px) |
| Padding | `px-4 py-3` (16/12) |
| Text styling | `text-caption font-normal text-content-primary` (~12px) |
| Arrow | `h-[8px] w-[8px] rotate-45 border border-border-components bg-surface-primary` |
| Position prop | `top` (default), `bottom`, `left`, `right`, `auto` |
| Gap (trigger ↔ tooltip) | `8px` constant |
| z-index | `z-[9999]` |

**5 positions:**
- `top` (default): centered above trigger
- `bottom`: centered below trigger
- `left`: centered to the left of trigger
- `right`: centered to the right of trigger
- `auto`: viewport-edge detection — picks top > bottom > right > left based on available space (in that priority order)

**Auto-positioning algorithm (`detectBestPosition`):**
- Measures `spaceTop`, `spaceBottom`, `spaceLeft`, `spaceRight` from `getBoundingClientRect()` and viewport
- Prefers top first (matches default UX expectation), then bottom, right, left
- Each direction needs `tooltipDimension + GAP (8px)` to be considered valid
- Falls back to whichever direction has the most space if none fit cleanly

**Behavior:**
- Hover enter: 200ms delay before showing (`enterTimer`) — prevents flash on cursor passage
- Hover leave: instant hide (no delay)
- Focus: shows immediately (no delay) — keyboard nav users get instant feedback
- Blur: hides immediately
- **Touch devices**: tooltip never renders. `window.matchMedia("(pointer: coarse)")` detection — tooltip relies on hover, touch has no hover, so it's hidden entirely. Use a different affordance (e.g., a label or expanded text) for touch UX where tooltip would normally fire.

**Composition pattern (Radix-style):**
- The Tooltip component does NOT wrap the trigger in a `<div>`. Instead, it uses `cloneElement` to inject `ref` + event handlers (`onMouseEnter`/`onMouseLeave`/`onFocus`/`onBlur`) + `aria-describedby` directly onto the child element passed as `children`.
- Why: avoids extra DOM wrapper that could break flex/grid layouts. Same pattern as Radix UI's Tooltip.
- Limitation: child must be a single React element that accepts ref + DOM event props. Strings, fragments, or non-DOM components don't work.

**Tooltip rendering:**
- Rendered via `createPortal(tooltipEl, document.body)` — escapes `overflow:hidden` containers
- Position computed from `triggerRef.current.getBoundingClientRect()` + GAP (8px)
- Repositions on visibility change (`updatePosition` effect) — does NOT auto-update on scroll/resize while visible (intentional; visible time is short)

**Accessibility:**
- `role="tooltip"` on the popover element
- `aria-describedby={tooltipId}` injected on the trigger child while visible (cleared on hide)
- `useId()` generates a unique tooltip ID for each Tooltip instance
- Screen readers announce tooltip content as a description of the trigger element

**Token references:**
- `--surface-primary`, `--content-primary`, `--border-components`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Tooltip.tsx`
- Spec export: `tooltipSpecs` (line 26)

---

### 10. Button Set

The dashboard's primary interaction primitive. 6 visual variants × 3 sizes, with native loading state, polymorphic rendering, and full-width-by-default layout. Token-based throughout — no raw hex.

| Property | Default | Type |
|----------|---------|------|
| `variant` | `"primary"` | `"primary" \| "secondary" \| "outline" \| "danger" \| "link" \| "link-underline"` |
| `size` | `"md"` | `"sm" \| "md" \| "lg"` |
| `loading` | `false` | `boolean` (renders InfinitySpinner overlay; sets `disabled` if Component is `<button>`) |
| `fullWidth` | `true` | `boolean` (**non-obvious default** — see "Layout" below) |
| `as` | `"button"` | `React.ElementType` (polymorphic — see "Polymorphic rendering" below) |
| `href` | — | `string` (only meaningful when `as` renders an anchor-like element) |
| `disabled` | — | inherited from `ButtonHTMLAttributes` |
| `className` | `""` | `string` |

Plus all native `<button>` attributes via `React.ButtonHTMLAttributes<HTMLButtonElement>`.

**Base styling:** `relative items-center justify-center gap-2 whitespace-nowrap`. The `relative` is required for the loading-spinner overlay (absolute-positioned).

**Variants (6):**
- **`primary`** (default) — `bg-surface-inverse text-content-inverse border border-border-components`. Hover: `opacity-90` (transition-opacity). Disabled: `pointer-events-none opacity-50`. Use case: the dominant call-to-action of a screen ("Save", "Continue", "Sign in").
- **`secondary`** — `bg-surface-tertiary text-content-secondary border border-border-components`. Hover: `bg-surface-subtle` (transition-colors). Disabled: `pointer-events-none opacity-50`. Use case: dismiss / cancel paired with a primary, supporting actions.
- **`outline`** — `bg-transparent text-content-primary border border-border-components`. Hover: `bg-surface-subtle`. Use case: OAuth buttons (Google, GitHub), Select Email, low-emphasis actions in a card. (Salvaged from removed Common Patterns Button (Secondary / Outline) sub-section.)
- **`danger`** — `bg-transparent text-error border border-error-border`. Hover: `bg-error-bg`. Use case: destructive confirmation ("Delete account", "Remove member") inside §4 Modal.
- **`link`** — `bg-transparent text-content-primary/75 border-0`. Hover: `text-content-primary` (transition-colors). Use case: inline navigation cue ("Forgot password?", "Resend code").
- **`link-underline`** — same colors as `link` but adds `hover:underline`, `active:underline`, `active:decoration-dotted`. Use case: footer / metadata links where underline-on-hover is wanted (e.g., "Terms of Service").

**Sizes (filled / outline / danger variants — `sizeClasses`):**
- **`sm`** — `px-4 py-1.5 text-caption font-normal rounded-md h-8` (32px)
- **`md`** — `px-6 py-2.5 text-body font-normal rounded-md h-10` (40px)
- **`lg`** — `px-8 py-3 text-h3 font-normal rounded-md h-12` (48px)

**Sizes (link / link-underline variants — `linkSizeClasses`):**
- **`sm`** — `text-caption font-normal` (no padding, no border, no fixed height — pure inline text)
- **`md`** — `text-body font-normal`
- **`lg`** — `text-h3 font-normal`

> **Note on the link split:** link variants drop padding, border, fixed-height, and rounded — they render as inline text rather than a boxed control. The component detects `variant === "link" || variant === "link-underline"` and switches to `linkSizeClasses` + `inline-flex`.

**Layout:**
- `fullWidth: true` is the **non-obvious default** — Button stretches to fill its container by default (`flex w-full`). This matches the auth-form / modal-action pattern (full-width primary CTAs). Pass `fullWidth={false}` for inline buttons (e.g., toolbar actions, header CTAs).
- Link variants ignore `fullWidth` and always render as `inline-flex` (no width takeover).

**Loading mechanism:**
- When `loading={true}`: children get `opacity-30` (still rendered for layout reservation — the button doesn't shrink), and a §32 InfinitySpinner is overlaid (`absolute inset-0 flex items-center justify-center`).
- Spinner size matches the button: `sm` button → `sm` spinner (16px); `md` and `lg` buttons → `md` spinner (24px).
- If `Component === "button"`, `loading` also forces `disabled` (prevents double-submit).

**Polymorphic rendering (`as` prop):**
- Default renders as `<button>`. Pass `as={Link}` (Next.js `Link`) or `as={"a"}` for anchor semantics.
- Implementation: `React.createElement(Component, props, ...children)`.
- Usage example:
  ```tsx
  <Button as={Link} href="/dashboard" variant="primary">Go to dashboard</Button>
  ```
- When `as` is not `"button"`, `disabled` is NOT applied (anchors don't have disabled semantics).

**Use cases (salvaged from removed Common Patterns Button sub-sections):**
- "Create account" (primary, full-width, in register form)
- OAuth buttons — Google, GitHub (outline, full-width, with provider icon)
- Select Email Button (outline, in email selector)
- Generally: any submit / CTA / dismiss action across the dashboard

**Token references:**
- Per variant: `--surface-inverse`, `--content-inverse`, `--border-components`, `--surface-tertiary`, `--content-secondary`, `--surface-subtle`, `--content-primary`, `--error`, `--error-border`, `--error-bg`
- Border rule for auth pages: per the broader rule above, ALL borders within auth pages use `--border-strong` (0.08) instead of `--border-components` (0.05). Composers wrap Button with `className="border-border-strong"` override on auth pages.
- Spacing: `--space-4`, `--space-6`, `--space-8` (px); `--space-1.5`, `--space-2.5`, `--space-3` (py)
- Sizing: `--space-8`, `--space-10`, `--space-12` (h)
- Typography: `--text-caption`, `--text-body`, `--text-h3`
- Radius: `--radius-md`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Button.tsx`
- Spec exports: `variantClasses` (line 23), `baseClass` (line 37), `sizeClasses` (line 40), `linkSizeClasses` (line 46) — **4 split exports, no consolidated `buttonSpecs`**
- Type union: `ButtonVariant` (exported, line 6)
- Cross-reference: §32 InfinitySpinner (loading indicator); §9 Tooltip (Buttons can compose with Tooltip wrapper); §38 SegmentedControl (sister interactive primitive — toggle group rather than single action)

> **Note on split exports:** Button uses 4 split exports rather than a consolidated `buttonSpecs` object — the most-split component documented so far. Source citation lists all four. Future code-side cleanup could consolidate. Same pattern as §28 Avatar, §29 Badge (B6).

> **Note on canonical source-of-truth:** Prior to this rewrite, the doc had two parallel descriptions: this section AND two "Common Patterns" sub-sections ("Button (Primary)" + "Button (Secondary / Outline)"). The Common Patterns sub-sections used pre-token Figma reference values (raw hex `#1c1c1c`, pixel padding `21/36`) and have been **removed** as part of this reconciliation (B7 / SCRUM-340). §15 is now the single source of truth.

---

### 11. Toggle

On/off switch primitive with a sliding circle that animates between off (left) and on (right) states. 3 sizes. Optional inline label.

| Property | Value |
|----------|-------|
| Sizes | `sm` (track 32×18, circle 14px), `md` (track 40×22, circle 18px), `lg` (track 48×26, circle 22px) |
| Default size | `md` |
| Layout | `inline-flex items-center gap-2` (label sits horizontally to the right of the switch, 8px gap) |
| Label | `text-body font-normal text-content-primary` |
| Animation | `transition-colors duration-200` (track) + `transition-transform duration-200` (circle) |

**On state:**
- Track: `bg-surface-inverse border-surface-inverse`
- Circle: translated to the right edge (`translate-x-[14px]` sm / `translate-x-[18px]` md / `translate-x-[22px]` lg)
- aria-checked: `"true"`

**Off state:**
- Track: `bg-surface-tertiary border-border-components`
- Circle: translated to the left edge (`translate-x-0.5`)
- aria-checked: `"false"`

**Disabled state:**
- Track + label: `opacity-50 cursor-not-allowed`
- Combines with on/off (the visual state stays; only opacity and cursor change)
- Hover effects suppressed

**Circle (universal across states):**
- `bg-surface-primary shadow rounded-full`
- The shadow gives the circle a subtle lift against the track, making the on/off position scannable at a glance

**Accessibility:**
- Track is a `<button type="button" role="switch">` with `aria-checked` reflecting state
- `aria-label` defaults to `"Toggle"` when no `label` prop is provided
- `htmlFor` on the optional inline label associates it with the switch's `id` (auto-generated via `useId` if not provided)

**Token references:**
- `--surface-primary`, `--surface-inverse`, `--surface-tertiary`, `--content-primary`, `--border-components`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Toggle.tsx`
- Spec export: `toggleSpecs` (line 15)

---

### 12. Slider

Horizontal range slider primitive — single-value selector with visible track, progress fill, and draggable thumb. Built on native HTML `<input type="range">` for keyboard + touch + screen-reader support out of the box.

| Property | Value |
|----------|-------|
| Range | `min` / `max` / `step` props (defaults: 0 / 100 / 1) |
| Track height | `8px` (`h-[8px]`) |
| Thumb size | `16×16px` (`w-[16px] h-[16px]`) |
| Wrapper | `flex flex-col gap-1.5` (optional header above the track) |
| Track container | `relative flex items-center h-[16px]` (16px row to fit the thumb + 8px track centered) |

**Track (background — full width, always rendered):**
- `absolute w-full h-[8px] rounded-full`
- `bg-surface-primary border-2 border-border-components`

**Progress fill (dynamic width — % of (value - min) / (max - min)):**
- `absolute h-[8px] rounded-full`
- `bg-surface-inverse border-2 border-border-components`
- Width controlled by inline `style={{ width: '${percentage}%' }}` (no Tailwind arbitrary class — set per-render)

**Thumb (native `<input type="range">` styled via webkit/moz pseudo-selectors):**
- `w-[16px] h-[16px] rounded-full`
- `bg-white border-2 border-solid border-[rgba(0,0,0,0.08)]`
- Note: thumb uses an inline rgba border value (`rgba(0,0,0,0.08)`) instead of a design token. This is a known minor inconsistency tracked at the JSX level — if a token equivalent like `border-border-default` becomes available with the right opacity, this can be migrated. For now, the inline rgba is the source-of-truth value.

**Optional header (above the track):**
- Layout: `flex items-center justify-between`
- Label (left, when `label` prop set): `text-body font-normal text-content-primary` (opacity-50 when disabled)
- Value display (right, when `showValue` prop is true): `text-caption text-content-primary/50 tabular-nums` (`tabular-nums` keeps digit width fixed so the value doesn't jitter as it changes)

**States:**
- Default: track + fill + thumb visible at standard tokens
- Disabled: `opacity-50 cursor-not-allowed` on the input element; also `opacity-50` on the label

**Behavior (inherited from native `<input type="range">`):**
- Drag: click + drag the thumb along the track
- Click-to-jump: clicking on the track moves the thumb to that position
- Keyboard: ArrowLeft/ArrowRight = step by `step` value; Home / End = jump to min / max; PageUp / PageDown = larger step (browser default)
- Touch: full touch + drag support via the native input

**Accessibility:**
- Native `<input type="range" role="slider">` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` reflecting state
- `aria-label` defaults to the `label` prop value when provided
- Native role gives screen readers the correct slider semantics out of the box (no custom ARIA implementation needed)

**Token references:**
- `--surface-primary`, `--surface-inverse`, `--content-primary`, `--border-components`
- Inline non-token: `rgba(0, 0, 0, 0.08)` for thumb border (see Thumb note above)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Slider.tsx`
- Spec export: `sliderSpecs` (line 17)

---

### 13. Pagination

Page navigation primitive — Prev/Next icon arrows + numbered page buttons + ellipsis placeholders for collapsed page ranges. Renders nothing when `totalPages <= 1`. Uses smart ellipsis (always shows first and last pages, plus ±1 around current).

| Property | Value |
|----------|-------|
| Container | `<nav aria-label="Pagination" className="flex items-center gap-1">` |
| Button size | `h-8 w-8` (32×32) — matches Button sm size token |
| Border radius | `rounded-md` (6px) |
| Inter-button gap | `gap-1` (4px) |
| Border | `border border-border-components` on all interactive buttons |

**Page button (numbered) — active:**
- `bg-surface-inverse text-content-inverse` (FILLED DARK — current page is the dark-filled element)
- Hover: `hover:opacity-90` (transition-opacity)
- Used for: the page that matches `currentPage`

**Page button (numbered) — inactive:**
- `bg-surface-primary text-content-primary`
- Hover: `hover:bg-surface-subtle`
- Used for: every other numbered page in the visible range

**Ellipsis placeholder:**
- `<span>` with `flex h-8 w-8 items-center justify-center text-caption font-normal text-content-primary/50`
- No border, no hover (it's not interactive)
- Renders as literal `...` text
- Inserted by the `getPageNumbers` algorithm (see Behavior below)

**Prev/Next arrow buttons:**
- Same shell as page buttons: `flex h-8 w-8 items-center justify-center rounded-md border border-border-components text-content-primary transition-colors`
- Hover: `hover:bg-surface-subtle`
- Icon: `ChevronLeft` (Prev) / `ChevronRight` (Next), lucide 16px
- Disabled state: `disabled:pointer-events-none disabled:opacity-50`
  - Prev disabled when `currentPage === 1`
  - Next disabled when `currentPage === totalPages`
- `aria-label="Previous page"` / `aria-label="Next page"`

**Behavior — page number generation (`getPageNumbers`):**
- If `totalPages <= 7`: show all pages (no ellipsis)
- Else: always show first (`1`) and last (`totalPages`) pages; show `current - 1`, `current`, `current + 1` (clamped to `[2, totalPages - 1]`); insert `...` ellipsis when there are gaps between rendered ranges
- Edge cases: at `currentPage = 1` or `currentPage = 2`, no leading ellipsis; at `currentPage = totalPages` or `totalPages - 1`, no trailing ellipsis

**Behavior — visibility:**
- Component returns `null` when `totalPages <= 1` (no pagination needed for a single page)

**Token references:**
- `--surface-primary`, `--surface-inverse`, `--surface-subtle`, `--content-primary`, `--content-inverse`, `--border-components`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Pagination.tsx`
- Spec export: `paginationSpecs` (line 20)

---

### 14. Toast Message

Top-of-viewport notification toast — pill-shaped notice with icon, title, optional description, auto-dismiss timer, and hover-revealed close button. Composed by §39 ToastContainer (which provides positioning + stacking). Animated via `framer-motion`.

> **Note:** This component does NOT export a spec object. Section content is sourced directly from the JSX (`Toast.tsx`). Future code-side cleanup could add `toastSpecs` to align with the rest of the catalog. Same disclosure pattern as §21 IdleWarningModal, §26 TurnstileWidget, §27 CountdownTimer (B4-B5 precedents).

| Property | Default | Type |
|----------|---------|------|
| `id` | — | `number` (required — used by ToastContainer key + onClose dispatch) |
| `variant` | — | `"error" \| "success" \| "warning" \| "info"` (required) |
| `title` | — | `string` (required) |
| `description` | — | `string` (optional — second line) |
| `duration` | `5000` | `number` (ms — auto-dismiss timer; pass `Infinity` for persistent toast that requires manual close) |
| `onClose` | — | `(id: number) => void` (required — typically `removeToast` from `useToast()` context) |

**Container styling:** `pointer-events-auto group grid grid-cols-[14px_1fr_auto] items-start gap-x-2 max-w-[550px] rounded-3xl border border-border-components bg-surface-primary py-3 pl-5 pr-4`. Note: the container is `pointer-events-auto` because the parent §39 ToastContainer is `pointer-events-none` — this layering allows clicks to pass through gaps between toasts to the underlying UI while keeping each toast itself interactive.

**3-column grid layout:**
- **Col 1 (icon — 14px wide)**: variant icon, `row-span-2 self-start shrink-0`
- **Col 2 (content — `1fr`)**: title (row 1) + optional description (row 2, `col-start-2`)
- **Col 3 (close button — `auto`)**: X button, `row-span-2 self-start shrink-0`, hover-revealed

**Variants (4):**

| Variant | Icon (lucide) | Color token |
|---------|---------------|-------------|
| `error` | `TriangleAlert` 14px | `text-error` |
| `success` | `CircleCheck` 14px | `text-success` |
| `warning` | `CircleAlert` 14px | `text-warning` |
| `info` | `Info` 14px | `text-info` |

> **Drift note (vs prior doc):** previous §19 specified 16px icons and `file-exclamation-point` for `info`. Current code uses **14px** (not 16) and **`Info` lucide** (not file-exclamation-point). Doc now reflects code reality.

**Typography:**
- **Title**: `text-caption font-semibold leading-4 text-content-primary`
- **Description** (when set): `text-caption leading-4 text-content-primary/50` — extends the [Display primitives opacity pattern](#display-primitives-opacity-pattern) (B6) to a 9th occurrence across 3 clusters

**Close button:** `row-span-2 self-start shrink-0 rounded-md p-1 text-content-tertiary opacity-0 transition-all hover:text-content-primary group-hover:opacity-100`. X icon `lucide/X` 12px. Negative margins `-mt-[7px] -mr-[7px]` to align flush with toast edges.

> **Accessibility note (close button):** the button is `opacity-0` until hover (`group-hover:opacity-100`). For keyboard users, the button is still in the focus order — once focused, it becomes interactable but remains visually hidden until a parent hover triggers reveal. **Recommendation**: consumers should ensure `:focus-visible` styling is added (e.g., via the existing `focus-visible:ring-1` pattern from §37 IconButton) so keyboard users see when the close button is focused. This is currently NOT implemented — a future enhancement.

**Auto-dismiss behavior:**
- Default duration `5000` ms (5 seconds) via `DEFAULT_DURATION` constant.
- Implementation: `useEffect(() => { const timer = setTimeout(dismiss, duration ?? DEFAULT_DURATION); return () => clearTimeout(timer); }, [dismiss, duration])`
- Pass `duration={Infinity}` to disable auto-dismiss (e.g., persistent error toasts the user must explicitly dismiss).
- The `dismiss` callback wraps `onClose(id)` via `useCallback`.

**Animation (framer-motion):**
- `layout` — animates layout shifts when other toasts are added/removed
- `initial={{ opacity: 0, y: -20 }}` — enters from above, transparent
- `animate={{ opacity: 1, y: 0 }}` — settles in place, opaque
- `exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}` — slides right + fades on dismiss (250ms)
- `transition={{ duration: 0.3 }}` — default 300ms for enter
- Used inside `<AnimatePresence>` (in §39 ToastContainer) to enable exit animation

**Accessibility:**
- `role="alert"` — announced as an alert region by screen readers
- `aria-live="assertive"` — interrupts current screen reader output (use sparingly; appropriate for error/success/warning that demands immediate attention)
- For non-urgent info toasts, consider whether `aria-live="polite"` would be more appropriate — currently fixed to `assertive` for all variants

**Token references:**
- Container: `--border-components`, `--surface-primary`, `--radius-3xl`
- Per variant: `--color-error`, `--color-success`, `--color-warning`, `--color-info`
- Title: `--content-primary`, `--text-caption` (12px)
- Description: `--content-primary` at 50% opacity (see [Display primitives opacity pattern](#display-primitives-opacity-pattern))
- Close button: `--content-tertiary` (verify token — see disclosure below), `--content-primary` on hover
- Spacing: `--space-3` (py), `--space-5` (pl), `--space-4` (pr), `--space-2` (gap-x)

> **Token verification — `text-content-tertiary`**: this token is used for the close button's resting color. It represents a third opacity step beyond `text-content-primary/50` (used in description). Verify the token name exists in the design system tokens definition (`--color-content-tertiary`?) — if not, this is a naming gap worth surfacing for code-side reconciliation.

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Toast.tsx`
- Spec export: **none** (JSX is the source of truth)
- Library: `framer-motion` (npm — `motion.div` + `AnimatePresence` parent)
- Cross-reference: §39 ToastContainer (composes for positioning + stacking); §40 AlertBox (sister inline notification — different positioning + persistence model)

---

### 15. Checkboxes

Checkbox primitive with checked, unchecked, indeterminate, and disabled states. 3 sizes. Optional inline label.

| Property | Value |
|----------|-------|
| Sizes | `sm` (16×16, icon 12px, radius 4px), `md` (20×20, icon 14px, radius 5px), `lg` (24×24, icon 16px, radius 6px) |
| Default size | `md` |
| Layout | `inline-flex items-center gap-1.5` (label sits horizontally to the right of the box, 6px gap) |
| Label | `text-body font-normal text-content-primary` |

**Checked state:**
- Box: `bg-surface-inverse border-surface-inverse`
- Icon: `Check` lucide, sized per `sm` (12px) / `md` (14px) / `lg` (16px), `strokeWidth=2`, `text-content-inverse`
- aria-checked: `"true"`

**Unchecked state:**
- Box: `bg-surface-primary border-border-components`
- Icon: none (empty box)
- aria-checked: `"false"`

**Indeterminate state:**
- Box: same as Checked (`bg-surface-inverse border-surface-inverse`)
- Icon: `Minus` lucide (horizontal line, NOT a check), same size as Check icon, `text-content-inverse`
- aria-checked: `"mixed"`
- Used to represent "some but not all" in tree/group selections

**Disabled state:**
- Box and label: `opacity-50 cursor-not-allowed`
- Combines with checked/unchecked/indeterminate (the icon and color stay; only opacity and cursor change)
- Hover effects suppressed

**Token references:**
- `--surface-primary`, `--surface-inverse`, `--content-primary`, `--content-inverse`, `--border-components`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Checkbox.tsx`
- Spec export: `checkboxSpecs` (line 29)

---

### 16. Input

Text input primitive with label, optional left/right icons, password toggle, loading state, and error state.

| Property | Value |
|----------|-------|
| Sizes | `sm` (h-10 / 40px), `md` (h-12 / 48px) |
| Default size | `md` |
| Variants | `default` (border + focus outline), `filled` (bg-surface-primary, no outline) |
| Default variant | `default` |
| Container | `flex items-center gap-2 rounded-lg border border-border-components` |
| Label | `text-body font-semibold leading-[22px]` |

**Default variant:**
- Container: transparent bg + `border-border-components` + `outline outline-2 outline-offset-2`
- Outline states: default `outline-transparent`, hover `outline-content-primary/75`, focus `focus-within:outline-content-primary/75`
- Used in: forms, auth flows, generic data entry

**Filled variant:**
- Container: `bg-surface-primary` (no outline)
- Used in: search bars, inline dropdowns where the input shouldn't compete visually with surrounding content

**Error state:**
- Outline: `outline-error/75` (replaces hover/focus outlines)
- Label color: `text-error/75` (instead of `text-content-primary`)
- Below input: `TriangleAlert` lucide icon 16px `text-error` + caption text `text-error`
- `aria-invalid` set on the underlying `<input>`

**Disabled state:**
- `cursor-not-allowed opacity-60` on container
- Underlying `<input>` is also disabled

**Slots:**
- `leftIcon`: ReactNode rendered as 16px lucide icon, `shrink-0 text-content-secondary` (typically Search, Mail, etc.)
- `rightIcon`: ReactNode rendered as 16px lucide icon, `shrink-0`. Mutually exclusive with password toggle and loading spinner.
- Password toggle: when `type=password`, `Eye`/`EyeOff` lucide icon (16px) appears as the right slot via `IconButton size=sm`. Click toggles between password and text input.
- Loading: when `loading={true}`, `Spinner size=sm` replaces the right slot (and disables the input).

**Token references:**
- `--surface-primary`, `--content-primary`, `--content-placeholder`, `--content-secondary`, `--border-components`, `--color-error`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Input.tsx`
- Spec export: `inputSpecs` (line 27)

---

### 17. DateInput

Date picker with an Input-styled trigger button and a Calendar popover.

| Property | Value |
|----------|-------|
| Sizes | `sm` (h-10 / 40px), `md` (h-12 / 48px) |
| Default size | `md` |
| Trigger | Input-styled `<button>` — matches §16 Input default variant visually |
| Popover | Calendar component (§3), `shadow-card` `rounded-xl`, anchored below the trigger |
| Value format | `YYYY-MM-DD` (ISO date string) |
| Display format | `DD/MM/YYYY` |

**Trigger states:**
- Default: `outline-transparent` (matches §16 Input default state)
- Hover: `outline-content-primary/75`
- Open (popover visible): `outline-transparent` (no hover effect while open)
- Error: `outline-error/75`
- Disabled: `cursor-not-allowed opacity-60`

**Trigger content:**
- Selected value: `text-body text-content-primary`, formatted as `DD/MM/YYYY`
- Empty (placeholder): `text-body text-content-placeholder`, default placeholder `"DD/MM/YYYY"`
- Right icon: `CalendarDays` lucide 16px `text-content-primary/50`

**Popover behavior:**
- Opens on trigger click (when not disabled)
- Closes on:
  - Outside click (mousedown listener on `document`)
  - Escape key
  - Date selection (auto-close after `onChange`)
- Position: `absolute left-0 top-full mt-1`, `z-50`
- Calendar receives the current value (parsed to `Date`) and `minDate` / `maxDate` constraints from `DateInput` props

**Error state:**
- Trigger outline becomes `outline-error/75`
- Below trigger: `text-caption text-error` (no icon — single-line caption only)

**Token references:**
- `--surface-primary`, `--content-primary`, `--content-placeholder`, `--content-secondary`, `--border-components`, `--color-error`

**Composition note:**
- DateInput is the canonical primitive for date entry in forms. Wrap it with §19 FormField when used inside a form to get label + error message styling consistency.
- The trigger style mirrors §16 Input's `default` variant — they should look indistinguishable at rest. The only visual cue distinguishing DateInput from Input is the right-side `CalendarDays` icon.

**Source:**
- Code: `nexacore-dashboard/src/components/ui/DateInput.tsx`
- Spec export: `dateInputSpecs` (line 25)

---

### 18. MfaDigitInput

Multi-cell digit input for MFA verification codes. N independent single-character `<input>` cells with auto-advance, paste-distribution, and arrow-key navigation.

| Property | Value |
|----------|-------|
| Cells | `length` prop (default `6`) |
| Cell sizing | `aspect-square` `flex-1` `max-w-12` `min-w-0` (auto-shrinks; max 48×48 in normal mode, 40×40 in compact) |
| Compact mode | Triggered automatically by `ResizeObserver` when container width < 348px |
| Container gap | `gap-3` (normal) → `gap-2.5` (compact) |
| Cell base | `rounded-lg border border-border-components bg-transparent text-center font-mono text-body text-content-primary outline outline-2 outline-offset-2` |
| Default font | `font-mono` (improves digit alignment) |

**Cell states:**
- Default: `outline-transparent`
- Hover: `outline-content-primary/75`
- Focus: `focus:outline-content-primary/75` (active cell receives focus from auto-advance)
- Error: `outline-error/75` — applied to ALL cells when `error={true}` (single error state for the whole group, not per-cell)

**Behaviors:**
- **Auto-advance**: typing a digit in cell N moves focus to cell N+1
- **Backspace navigation**: pressing Backspace in an empty cell moves focus to the previous cell (preserves UX expectation — users don't need to manually backspace then arrow-left)
- **Arrow key navigation**: ArrowLeft / ArrowRight move focus between cells without modifying values
- **Paste-to-distribute**: pasting an N-digit string fills N cells starting from cell 0; non-digits in the pasted text are stripped via `replace(/\D/g, "")`. If pasted length === total length, `onComplete` fires immediately.
- **inputMode="numeric"**: shows the numeric keyboard on mobile; combined with `maxLength={1}` per cell, prevents alpha entry without explicit validation
- **`onComplete(code)`**: fires when all cells contain a digit. The callback receives the joined string. Useful for auto-submitting the form once the user finishes typing.

**Accessibility:**
- Container: `role="group"` with `aria-label="Verification code digits"`
- Each cell: `aria-label="Digit N"` (1-indexed)
- First cell receives DOM id `${idPrefix}-0` (default prefix: `mfa-digit`) for label association in parent forms

**Compact mode (responsive):**
- ResizeObserver watches the container width
- Threshold: `width < 348px` → compact (sm cells 40×40, gap 10px)
- Default: `width >= 348px` → normal (md cells 48×48, gap 12px)
- Math: `6 cells × 48px + 5 gaps × 12px = 348px` minimum for normal mode; `6 cells × 40px + 5 gaps × 8px = 280px` minimum for compact

**Token references:**
- `--content-primary`, `--border-components`, `--color-error`
- Font family: tailwind `font-mono` (system mono stack, project-wide)

**Composition note:**
- MfaDigitInput is the canonical primitive for MFA verification UX. Used in /verify-mfa flows after login when 2FA is enabled, and during MFA enrollment to confirm the user can read codes from their authenticator app.
- The component is intentionally NOT wrappable in §19 FormField — its error state is a group-level boolean, and it has no label slot. Pair it with surrounding `<p>` instructional text and a separate `<button>` to submit, rather than the FormField pattern.

**Source:**
- Code: `nexacore-dashboard/src/components/ui/MfaDigitInput.tsx`
- Spec export: `mfaDigitInputSpecs` (line 5)

---

### 19. FormField

Composition wrapper that stacks an optional label, any form control, and an optional inline error message. Standardizes form-field anatomy across the app.

| Property | Value |
|----------|-------|
| Container | `flex flex-col gap-2` (vertical stack, 8px gap between elements) |
| Label slot | Optional, renders above the control |
| Children slot | Required — any form control (`§16 Input`, `§17 DateInput`, `§18 MfaDigitInput` (rare), Select, EmailSelector, Toggle, Checkbox, etc.) |
| Error slot | Optional, renders below the control via `InlineError` component |

**Label:**
- Default: `text-body font-semibold leading-[22px] text-content-primary`
- When `error` is set: label color shifts to `text-error/75` (matches §16 Input's labeled-error pattern)
- Renders only when `label` prop provided
- `htmlFor` prop forwards to the `<label>` element so it associates with the control's `id`

**Required indicator:**
- When `required={true}` AND `label` is set, appends `*` after the label text
- Style: `ml-0.5 text-error` (4px margin, error color)
- `aria-hidden="true"` (the form control should communicate required-ness via its own `aria-required` or `required` attribute — the asterisk is purely visual)

**Error message:**
- Rendered via `InlineError` component — see §42 InlineError for the canonical spec
- Shows below the control when `error` is a non-empty string

**Token references:**
- `--content-primary`, `--color-error`

**Composition rules:**
- **No automatic error cascade**: when `<FormField error="...">` is used, the consumer must ALSO pass the same error to the control (e.g., `<Input error="..." />`) for the control's outline/icon to reflect the error state. FormField wraps the message only — it does NOT propagate error styling to the control.
- **Pair with `§16 Input` for text input**: the standard composition is `<FormField label="..." error={errors.field}><Input error={errors.field} {...register("field")} /></FormField>`.
- **Skip for `§18 MfaDigitInput`**: MfaDigitInput has a group-level boolean error (no message), no label slot, no required asterisk — wrapping it in FormField would render an empty label and a duplicate error. Render MfaDigitInput directly with surrounding instructional text instead.
- **Optional for `§15 Checkboxes`**: small Checkbox flows often want the label inline (right of the box) which Checkbox already provides via its own `label` prop. Use FormField for Checkbox only when you need an above-control label (rare).

**Source:**
- Code: `nexacore-dashboard/src/components/ui/FormField.tsx`
- Spec export: `formFieldSpecs` (line 5)

---

### 20. Select

Form-input dropdown primitive — trigger button that opens a popover list of options. Single-value selection. Distinct from §6 Context Menu (which is a right-click context menu pattern, not a form input). For text input use §16 Input; for date selection use §17 DateInput.

| Property | Value |
|----------|-------|
| Sizes | `sm` (h-10 / 40px), `md` (h-12 / 48px) |
| Default size | `sm` |
| Trigger | `<button role="combobox">` styled like an Input default variant (rounded-md, px-6, h-10/h-12) |
| Dropdown | Popover list anchored to trigger with viewport-edge auto-positioning |
| Min dropdown width | `160px` (`w-fit min-w-[160px]`) |
| Animation | `animate-dropdown-down` / `animate-dropdown-up` (150ms ease-out) |

**Trigger states:**
- Closed (default): `text-content-primary/75 hover:text-content-primary hover:bg-surface-subtle`
- Open: `bg-surface-subtle text-content-primary` (subtle bg fills the trigger to indicate the dropdown is active)
- Disabled: `opacity-50 cursor-not-allowed`
- Right icon: `ChevronDown` lucide 16px `text-content-primary/50`, rotates 180° when open (`rotate-180`)

**Trigger content:**
- Selected value label (left): `text-body font-normal`, color depends on state (closed = 75% primary, open = 100% primary)
- Placeholder (no selection): default `"Select..."` (override via `placeholder` prop), same styling as the value
- Right icon: ChevronDown (above)

**Dropdown popover:**
- Container: `rounded-xl border border-border-components bg-surface-primary p-6 shadow-card max-h-64 overflow-auto`
- Position: **auto-detected** — flips vertical (up/down) when bottom space < 300px AND top space > 300px; flips horizontal (left/right) when the trigger's right edge + dropdown width would exceed viewport width
- Animation: 150ms ease-out, slides in from the trigger's edge (`animate-dropdown-down` for top-anchored, `animate-dropdown-up` for bottom-anchored)
- z-index: `z-50`

**Option states:**
- Base layout: `flex h-10 items-center gap-2 whitespace-nowrap px-6 py-2.5 rounded-md text-body font-normal`
- Default (unselected): `text-content-primary hover:bg-surface-subtle`
- Selected (current value): `bg-surface-inverse text-content-inverse` — visually fills the option with the inverse surface to indicate "this is the chosen value"
- Focused (keyboard navigation): `bg-surface-subtle text-content-primary` (subtle, distinct from selected)
- Danger variant (destructive options): `text-error hover:bg-error-bg`
- Optional left icon: 16×16 (`w-4 h-4 shrink-0`) — typically a lucide icon

**Behavior:**
- **Click trigger to toggle**: open if closed, close if open
- **Click an option**: selects it and closes the dropdown; calls `onChange(option.value)`
- **Click outside**: closes the dropdown (mousedown listener on `document`)
- **Hover over option**: sets that option as the focused index (mouse-and-keyboard hybrid navigation)

**Keyboard:**
- `Enter` / `Space` / `ArrowDown` / `ArrowUp` (when closed): opens the dropdown; focused index becomes the currently-selected option's index, or 0 if no value
- `ArrowDown` / `ArrowUp` (when open): moves focused index down / up (clamped to bounds)
- `Home` / `End` (when open): jumps focused index to first / last option
- `Enter` / `Space` (when open): selects the currently-focused option, calls `onChange`, closes dropdown
- `Escape` (when open): closes the dropdown without selecting

**Accessibility:**
- Trigger: `role="combobox"` with `aria-expanded`, `aria-haspopup="listbox"`, `aria-controls` pointing at dropdown id
- Dropdown: `role="listbox"` with `aria-activedescendant` pointing at the focused option's id
- Each option: `role="option"` with `aria-selected={isSelected}`
- Auto-generated dropdown id via `useId` for stable `aria-controls` / `aria-activedescendant` references

**Token references:**
- `--surface-primary`, `--surface-inverse`, `--surface-subtle`, `--content-primary`, `--content-inverse`, `--color-error`, `--color-error-bg`, `--border-components`

**Composition note:**
- **Pair with §19 FormField** when used in forms — `<FormField label="..." error={errors.field}><Select options={...} value={...} onChange={...} /></FormField>`. FormField handles the label + error message; Select handles the value selection.
- **Distinguish from §6 Context Menu** — Select is a form input (one of N options replaces the trigger label). Context Menu is a right-click action menu (Edit/Duplicate/Archive — actions, not values). They share visual language (rounded popover with items) but have different semantics.

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Select.tsx`
- Spec export: `selectSpecs` (line 23)

---

### 21. IdleWarningModal

Specialized modal for idle session warning. Distinct from §4 Modal: fixed w-[340px], embeds CountdownTimer + Button, no focus trap, no Escape close, no outside-click dismissal — by design, the user must actively click "Keep me signed in" to dismiss (passive dismissal would defeat the security purpose of the idle timeout).

> **Note:** This component does NOT export a spec object. Section content is sourced directly from the JSX (`IdleWarningModal.tsx:11-28`). Future code-side cleanup could add `idleWarningModalSpecs` to align with the rest of the catalog.

| Property | Value |
|----------|-------|
| Width | `w-[340px]` (fixed — does NOT use §4 Modal's size scale) |
| Container | `fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)]` |
| Modal shell | `flex w-[340px] flex-col items-center gap-4 rounded-xl border border-border-strong bg-surface-secondary p-6 shadow-card` |
| Border radius | `rounded-xl` (12px — same as §4 Modal) |
| z-index | `z-50` (same as §4 Modal) |

**Composition (top to bottom):**
1. **CountdownTimer** (top): `variant="warning"` + `size="lg"` — shows `secondsLeft` prop counting down. Visual emphasis on the urgency. (CountdownTimer documented separately — currently part of registry's "Feedback / Alerts" group, will get its own section in B5.)
2. **Body text** (middle): `text-center text-body text-content-secondary` — default copy: *"Your session is about to expire due to inactivity."* (Hardcoded in the component — not configurable. To customize, fork the component or wrap.)
3. **Button** (bottom): `fullWidth` + `autoFocus`, label: "Keep me signed in" — the only dismissal affordance. `onClick` calls the `onKeepAlive` prop.

**Behavior — by design:**
- **NO focus trap**: there's only one focusable element (the Button), so a focus trap is unnecessary and would add complexity.
- **NO Escape close**: pressing Escape does NOT dismiss. Idle UX requires active engagement.
- **NO outside-click dismissal**: clicking the overlay does nothing. Same rationale.
- **Body scroll lock**: NOT implemented in IdleWarningModal (unlike §4 Modal's scroll lock + scrollbar compensation). The component assumes it covers the full viewport so scroll behind doesn't matter.

**Why this design (security rationale):**
- An idle session warning that can be dismissed passively (Escape, outside click) defeats its security purpose — the user could "ignore" the warning while the session expires.
- Forcing the user to click the keep-alive button creates an active "I'm still here" interaction. This is the W3C WAI guidance for re-engagement prompts.

**Props:**
- `secondsLeft: number` — seconds remaining until session expires (passed through to CountdownTimer)
- `onKeepAlive: () => void` — called when user clicks the keep-alive button. Implementer is responsible for: (a) extending the session via API call, (b) closing the modal (this component does NOT manage its own visibility — parent renders/unrenders based on idle state).

**Token references:**
- `--surface-secondary`, `--content-secondary`, `--border-strong`
- CSS var: `var(--overlay)` (declared in globals.css — same as §4 Modal)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/IdleWarningModal.tsx`
- Spec export: **none** (JSX is the source of truth)
- Cross-reference: §4 Modal (the generic confirm modal — for general-purpose dialogs use §5 instead; §26 is specialized for idle session warning)

---

### 22. CommandPalette

Cmd+K command palette — full-screen overlay dialog with searchable groups (pages, users, actions). Built on the [cmdk](https://github.com/pacocoursey/cmdk) library for keyboard navigation, fuzzy filtering, and accessibility primitives. Replaces the original §9 Search Results and §20 Search Field doc sections (deleted per Ambiguity 1 resolution — those described UI patterns the code does not implement).

| Property | Value |
|----------|-------|
| Trigger | `<SearchTrigger>` button (see sub-section below) OR global Cmd+K / Ctrl+K keybind |
| Container max width | `max-w-[550px]` |
| Border radius | `rounded-xl` (12px) |
| Background | `bg-surface-primary` with `bg-[var(--overlay)]` overlay behind |
| Position (mobile) | `pt-[68px] px-4` — below the header bar |
| Position (desktop, lg+) | `pt-[20vh]` — 20% from viewport top (Linear / Vercel pattern) |
| Library | `cmdk` (Pacocoursey) — provides `Command.Root`, `Command.Input`, `Command.List`, `Command.Group`, `Command.Item`, `Command.Empty` |

**Layout (top to bottom):**
1. **Search input row** (`h-12 px-4 border-b border-border-strong`):
   - `Search` lucide 16px `text-content-tertiary` (left)
   - Input field: matches Input md size (`h-12 text-body leading-6 placeholder:text-content-placeholder`), placeholder: `"Type a command or search..."`
   - X close `IconButton size="sm"` (right)
2. **Results list** (`max-h-[300px] overflow-y-auto p-2`):
   - **Empty state**: `"No results found."` in `py-6 text-center text-body text-content-tertiary`
   - **Groups** (rendered when applicable):
     - **Pages**: navigation shortcuts (Dashboard, Profile, Settings, etc. — permission-filtered via `usePermissions`)
     - **Users** (admin-only): debounced search `/users?search=...` (300ms debounce, 5 results max). Renders `Avatar + name + email`. Hidden when no `users:read` permission or query length < 2.
     - **Actions**: Toggle dark mode (theme switch — Moon/Sun icon based on current theme), Sign out (logout — `text-error` for the destructive action)

**Group heading style:**
- `text-caption font-semibold uppercase tracking-wider text-content-tertiary px-3 py-2`
- Applied via `[&_[cmdk-group-heading]]:` Tailwind arbitrary attribute selector

**Item style (each `Command.Item`):**
- Default: `flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-body text-content-primary`
- Selected (keyboard nav or hover): `aria-selected:bg-surface-subtle` (cmdk auto-applies `aria-selected` to focused item)
- Item icon: 16px lucide `text-content-secondary mr-3`

**Behavior:**
- **Open**: via global Cmd+K / Ctrl+K keybind (registered in app shell — outside this component) OR via `<SearchTrigger>` click
- **Close**: Escape key (registered listener on `document`), overlay click (`onClick` on overlay div), or after item selection (`runCommand` wrapper calls `onClose` before executing the action)
- **Item selection**: `onSelect` callback runs the action wrapped in `runCommand(fn)` — closes the palette first, then executes
- **Body scroll lock**: while open, `document.body.style.overflow = "hidden"`. Restored to previous value on close.
- **Reset on close**: `search` cleared, `users` cleared. Re-opening starts fresh.
- **User search debounce**: 300ms via `setTimeout`. Only fires when `search.length >= 2` AND user has `users:read` permission.

**Accessibility:**
- cmdk primitives provide `role="combobox"` (input), `role="listbox"` (list), `role="option"` (each item) automatically
- Auto-focus on open: cmdk focuses the input
- Keyboard: ArrowUp / ArrowDown navigate items, Enter selects, Escape closes
- Permission-filtering happens client-side BEFORE rendering — items the user can't access are not in the DOM at all

**Token references:**
- `--surface-primary`, `--surface-subtle`, `--surface-tertiary`, `--content-primary`, `--content-secondary`, `--content-tertiary`, `--content-placeholder`, `--border-strong`, `--color-error`
- CSS var: `var(--overlay)` for the backdrop

**Source:**
- Code: `nexacore-dashboard/src/components/ui/CommandPalette.tsx`
- Spec export: `commandPaletteSpecs` (line 28)
- Library: `cmdk` (npm)

#### SearchTrigger (sub-component)

The button that opens the CommandPalette. Visually distinct from the palette itself — sits in the dashboard header / navbar.

| Property | Value |
|----------|-------|
| Container | `<button>` styled like Button outline sm |
| Layout | `inline-flex items-center gap-2 rounded-md border border-border-components bg-transparent px-4 py-1.5 h-8` |
| Hover | `hover:bg-surface-subtle` |
| Text style | `text-caption text-content-primary` |

**Composition (left to right):**
- `Search` lucide 16px `shrink-0`
- Label: `"Search..."` text
- Keyboard shortcut Badge: `Badge variant="kbd" size="sm"` showing `⌘K` (macOS) or `Ctrl+K` (everywhere else)

**Mac detection:**
- `isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)`
- Note: `navigator.platform` is deprecated but still functional. Future migration: `navigator.userAgentData.platform` (when widely supported).

**Mobile variant (per spec, currently unimplemented in this component):**
- `searchTriggerSpecs.mobile` documents an `IconButton boxed sm` with Search 16px, `lg:hidden`
- The current `SearchTrigger.tsx` JSX renders only the desktop variant (full button with label + Badge). A mobile-specific icon-only variant is not in the JSX yet.
- Status: NOT currently rendered. Spec captures intent for a future enhancement (similar to §5 Tabs dot indicators precedent — design intent preserved as forward-looking baseline).

**Token references:**
- `--content-primary`, `--border-components`, `--surface-subtle`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/SearchTrigger.tsx`
- Spec export: `searchTriggerSpecs` (line 6)

---

### 23. CopyField

Read-only copyable text field — single-line value displayed in a styled container with a Copy icon button (right). Clicking the button copies the value to the clipboard and swaps Copy → Check icon for visual feedback. Wrapped in §9 Tooltip showing "Copy to clipboard" → "Copied!" on hover.

| Property | Value |
|----------|-------|
| Sizes | `sm` (h-10 / 40px), `md` (h-12 / 48px) |
| Default size | `md` |
| Container | `flex items-center gap-2 rounded-lg border border-border-components bg-surface-subtle px-4 overflow-hidden` |
| Value display | `<code>` element: `flex-1 truncate font-mono text-body leading-6 text-content-primary` |
| Copy button | `<button>`: `shrink-0 text-content-primary/50 transition-colors hover:text-content-primary` |
| Tooltip integration | Copy button wrapped in §9 Tooltip — content swaps "Copy to clipboard" → "Copied!" |

**States:**
- **Default**: shows `Copy` lucide icon 14px, default text color `text-content-primary/50`
- **Hover (button)**: text color `text-content-primary` (transition-colors)
- **Copied (2-second window)**: shows `Check` lucide icon 14px with `text-green-600` color, Tooltip text changes to "Copied!"
- After 2 seconds: reverts to default `Copy` icon

**Copy mechanism:**
- `navigator.clipboard.writeText(value)` — modern Clipboard API, requires HTTPS context (or localhost)
- No fallback for older browsers (project supports modern only — see browserslist config)
- No error handling — if clipboard write fails (e.g., permission denied), icon won't toggle. Future code-side enhancement could add error state.

**Truncation:**
- `truncate` class on the `<code>` element — long values overflow with ellipsis
- Container has `overflow-hidden` — prevents the value spilling outside the rounded border

**Accessibility:**
- `<code>` element preserves monospace semantic for the value
- Button: `aria-label="Copy to clipboard"`
- Tooltip provides hover label (helpful when icon is the only affordance)

**Honest disclosure (non-token color):**
- The Check icon uses `text-green-600` (Tailwind direct value) for the success state — this is NOT a project design token. The project does not currently expose a `--color-success` or `--color-success-content` semantic token. When such a token becomes available, this can be migrated. Same precedent as B2 §12 Slider's thumb `rgba(0,0,0,0.08)` non-token disclosure.

**Token references:**
- `--surface-subtle`, `--content-primary`, `--border-components`
- Non-token: `text-green-600` (Tailwind direct — see disclosure above)

**Use cases:**
- MFA secret display (paired with QR code in §24 QrCodeCard)
- API token display (settings → API keys page)
- Generic "click to copy" UX wherever a single-line value needs to be copyable

**Source:**
- Code: `nexacore-dashboard/src/components/ui/CopyField.tsx`
- Spec export: `copyFieldSpecs` (line 7)
- Cross-reference: composed inside §24 QrCodeCard for the MFA secret display

---

### 24. QrCodeCard

QR code display card for MFA enrollment — shows the QR code (192×192) above a §23 CopyField containing the same secret in text form (so users who can't scan can copy manually). Container is **always white** (NOT theme-aware) so the QR remains scannable in dark mode.

| Property | Value |
|----------|-------|
| Wrapper | `flex flex-col gap-2` |
| QR container | `flex justify-center rounded-lg border border-border-components bg-white p-4` |
| QR image | `h-48 w-48` (192×192px — matches the QR generation width) |
| Secret display | §23 CopyField below (default md size) |
| Background | `bg-white` (hardcoded — NOT theme-aware) |

**Why bg-white is hardcoded:**
- QR code scanners need high contrast (typically dark modules on light bg) to read accurately
- A theme-aware container would render the QR on dark bg in dark mode → reduced scan reliability
- The trade-off: visual inconsistency in dark mode (white card stands out) is acceptable to preserve scannability
- Same precedent as printed QR codes always being on white paper

**QR generation (client-side):**
- Library: dynamic import of `qrcode` package — `(await import("qrcode")).default`
- Secret format: 16-character base32 string (uppercase A-Z + digits 2-7), generated via `Math.random()` from the alphabet `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`
- TOTP URL format (RFC 6238): `otpauth://totp/NexaCore:demo@example.com?secret=${secret}&issuer=NexaCore`
- QR options: `{ width: 192, margin: 1 }` — matches the `h-48 w-48` rendered size

**Props:**
- `secret?: string` — external override; if provided, skips client-side generation
- `qrDataUrl?: string` — external override; if provided, skips QR generation entirely (use this when the server pre-generated the QR)
- `onGenerate?: () => void` — declared in type but currently unused in JSX (possible dead prop or planned callback for "regenerate" UX). Future code-side cleanup could either wire it to the regenerate action or remove it.
- `className?: string` — passed through to wrapper for layout customization

**States:**
- **Generating**: shows `"Loading..."` text (`text-caption text-content-primary/50`) inside the 192×192 box while the QR data URL is being computed
- **Generated**: shows the `<img src={qrDataUrl} alt="QR Code" className="h-48 w-48" />` with the QR rendered

**Default secret (dev fallback):**
- Initial state: `"JBSWY3DPEHPK3PXP"` — well-known TOTP test secret from RFC 6238 examples
- Replaced on first `useEffect` if no `qrDataUrl` provided externally
- Useful for showcase / Storybook rendering; production should always pass a server-generated `secret` via prop

**Composition:**
- The §23 CopyField below the QR is the canonical companion — provides text-copy fallback when scanning fails (broken camera, screen-share, accessibility)
- Combined with §25 RecoveryCodesGrid in MFA setup flow: scan QR → enter test code → save recovery codes

**Token references:**
- `--border-components`, `--content-primary` (only on the loading text)
- Non-token: `bg-white` (hardcoded — see "Why bg-white is hardcoded" above)

**Use cases:**
- MFA enrollment / setup flow (single use case)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/QrCodeCard.tsx`
- Spec export: `qrCodeCardSpecs` (line 6)
- Composes: §23 CopyField (for the secret display below the QR)
- Library: `qrcode` (npm) — dynamic import

---

### 25. RecoveryCodesGrid

Display + copy primitive for MFA recovery codes — N codes rendered in a 2-column grid, with a "Copy all codes" Button below that copies all codes to the clipboard joined by newlines. Used in MFA setup to let users save their recovery codes (the one-time-use codes that bypass MFA if they lose their authenticator).

| Property | Value |
|----------|-------|
| Wrapper | `flex flex-col gap-2` |
| Container | `rounded-lg border border-border-components bg-surface-subtle p-4` |
| Grid | `grid grid-cols-2 gap-2` (2 columns, 8px gap between items) |
| Each code | `<code>` element: `flex h-10 items-center justify-center rounded-md bg-surface-primary font-mono text-body text-content-primary` |
| Copy-all button | `<Button variant="outline" size="sm" fullWidth={false}>` |

**Code styling:**
- Each code is a `<code>` element (preserves monospace semantic for screen readers)
- Visual: 40px tall pill (`h-10`) with subtle background (`bg-surface-primary` against the container's `bg-surface-subtle` — slight contrast)
- Centered horizontally + vertically
- 6px corner radius (`rounded-md`)
- Mono font, body size, primary text color

**Copy-all behavior:**
- Click button → `navigator.clipboard.writeText(codes.join("\n"))` — writes ALL codes joined by newlines
- 2-second window: button content swaps from "Copy all codes" to "Copied!" with the icon swap (Copy → Check)
- After 2s: reverts to default state
- Same revert timing + Copy/Check icon pattern as §23 CopyField (consistency across copy primitives)

**Icons:**
- Default: `Copy` lucide 16px (Button standard size, matches Button outline sm conventions)
- Success: `Check` lucide 16px with `text-green-600` color
- ⚠️ **Honest disclosure**: `text-green-600` is a Tailwind direct value (NOT a project token). Same disclosure as §23 CopyField — when a `--color-success` token becomes available, this can be migrated. Both §28 and §30 should migrate together for consistency.

**Props:**
- `codes: string[]` — required. Array of recovery code strings to render. Component renders `codes.length` cells; if odd count, the last cell sits alone in column 1 of its row (CSS Grid auto-fill behavior — no special handling).
- `className?: string` — passed through to wrapper for layout customization

**Composition:**
- Typically used after §24 QrCodeCard in MFA setup flow: scan QR → enter test code → display + save recovery codes (this section)
- Recovery codes are usually 10-12 codes per the typical MFA UX; the 2-col grid handles 10/12 cleanly (5/6 rows)

**Accessibility:**
- `<code>` elements preserve monospace semantic — screen readers may announce each digit separately (helpful for hearing the code accurately)
- Copy-all Button is the only interactive element — Tab focuses it, Enter triggers
- No per-code copy button (intentional — recovery codes are meant to be saved as a SET, not used individually until needed)

**Token references:**
- `--surface-subtle` (container bg), `--surface-primary` (code cell bg), `--content-primary`, `--border-components`
- Non-token: `text-green-600` for success state (see ⚠️ disclosure above)

**Use cases:**
- MFA setup flow — display codes immediately after MFA enrollment (single use case)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/RecoveryCodesGrid.tsx`
- Spec export: `recoveryCodesGridSpecs` (line 7)
- Cross-reference: §23 CopyField (shares the Copy/Check icon swap UX + 2s revert pattern); §24 QrCodeCard (companion in MFA setup flow)

---

### 26. TurnstileWidget

Wrapper around Cloudflare's [Turnstile](https://www.cloudflare.com/products/turnstile/) bot-detection widget — a CAPTCHA replacement that's typically invisible to legitimate users, only showing an interactive challenge when the heuristic flags suspicious traffic. Used in auth pages (login / register / forgot-password) before form submission. Theme-aware (matches dashboard's light/dark theme).

> **Note:** This component does NOT export a spec object. Section content is sourced directly from the JSX (`TurnstileWidget.tsx`). Future code-side cleanup could add `turnstileWidgetSpecs` to align with the rest of the catalog. Same disclosure pattern as §21 IdleWarningModal (B4 precedent).

| Property | Value |
|----------|-------|
| Library | `@marsidev/react-turnstile` (npm — Cloudflare-blessed React wrapper) |
| Wrapper container | `<div className="mb-4">` (16px bottom margin — designed to live inside auth forms above the submit button) |
| Site key (env) | `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| Site key fallback | `"1x00000000000000000000AA"` — Cloudflare's "always-pass" test key (dev fallback when env var missing) |
| Theme | `useTheme()` hook → passed to Turnstile's `options.theme` (light / dark / auto) |
| Layout size | `"flexible"` — adapts to container width (vs `"normal"` 300×65 or `"compact"` 130×120) |
| Action tag | `"auth"` — Cloudflare analytics tag for auth-flow telemetry |

**Props:**
- `onToken: (token: string) => void` — required. Called when Turnstile successfully validates the user. The token is short-lived (typically 5 minutes) and must be sent to the server for verification via the Cloudflare siteverify API.
- `onExpire?: () => void` — optional. Called when the token expires. The widget auto-resets via `ref.current?.reset()`, then the optional callback fires (so the consumer can clear any cached token state).
- `resetKey?: number` — optional. Incrementing this prop forces React to remount the widget (via the `key={resetKey}` prop on the inner Turnstile). Useful for resetting after form submission errors that need a fresh token.

**Reset mechanism (two paths):**
- **Auto-reset via `onError`**: if Cloudflare's challenge errors, the widget calls `ref.current?.reset()` to fetch a fresh challenge.
- **Auto-reset via `onExpire`**: same — when the token TTL elapses, reset the widget so the user gets a fresh challenge if they're still on the form.
- **Manual reset via `resetKey`**: bumping the prop remounts the widget. The component also exports a hook `useTurnstileReset(ref)` for imperative reset:
  ```tsx
  const ref = useRef<TurnstileInstance>(null);
  const reset = useTurnstileReset(ref);
  // call reset() after form error to refresh the challenge
  ```

**Server-side verification (out of scope for this component):**
- The token returned via `onToken` must be POST'd to `https://challenges.cloudflare.com/turnstile/v0/siteverify` along with your secret key (server-side env var, NOT `NEXT_PUBLIC_*`)
- The Cloudflare API responds with `{success: boolean, ...}` — only proceed with auth flow on `success: true`
- Server-side verification is implemented in the auth API endpoints (out of scope for the UI component)

**Theme behavior:**
- The `useTheme` hook returns the dashboard's current theme (`"light"` or `"dark"`)
- Turnstile renders the challenge UI matching the theme — important for visual consistency on dark-mode auth pages
- If the user toggles the theme while the widget is mounted, the widget re-renders with the new theme automatically

**Accessibility:**
- Cloudflare's widget is rated AA-compliant (WCAG 2.1) by Cloudflare's own audit
- The challenge UI (when shown) includes audio alternative for users who can't complete the visual challenge
- The widget reads its own state to screen readers via internal ARIA
- For most legitimate users, the widget shows an "Invisible" success state — no interaction required

**Use cases:**
- Login form (gate before credentials POST)
- Register form (gate before user creation)
- Forgot-password form (gate before reset email send)
- Generally: any unauthenticated form endpoint that needs bot protection

**Token references:**
- None — Cloudflare's widget styles itself based on the theme prop, not project tokens

**Source:**
- Code: `nexacore-dashboard/src/components/ui/TurnstileWidget.tsx`
- Spec export: **none** (JSX is the source of truth)
- Library: `@marsidev/react-turnstile` (npm)
- Cloudflare docs: [Turnstile documentation](https://developers.cloudflare.com/turnstile/)
- Companion: server-side siteverify endpoint (out of scope — see auth API)

---

### 27. CountdownTimer

Animated countdown display — N digit boxes with vertical slide-in animation on each digit change. Used for time-bounded UX where the remaining seconds matter visually (MFA throttle lockout, idle session warning). Renders `MM:SS` when `seconds >= 60`, otherwise just `SS`.

> **Note:** This component does NOT export a spec object. Section content is sourced directly from the JSX (`CountdownTimer.tsx`). Future code-side cleanup could add `countdownTimerSpecs` to align with the rest of the catalog. Same disclosure pattern as §21 IdleWarningModal and §26 TurnstileWidget.

| Property | Value |
|----------|-------|
| Container | `inline-flex shrink-0 items-center ${gap}` (gap varies per size) |
| Variants | `error` (default), `warning` |
| Sizes | `sm` (default), `lg` |
| Format | `MM:SS` when `seconds >= 60`, just `SS` otherwise |
| Default props | `variant="error"`, `size="sm"` |
| Animation | `countdown-slide` CSS keyframe (declared in `globals.css`) |

**Variants:**
- `error` (default — for lockout / hard-fail countdowns):
  - Digit background: `bg-error-bg`
  - Digit text: `text-error`
  - Separator (`:`): `text-error/60`
- `warning` (for soft-warning countdowns — used in §21 IdleWarningModal):
  - Digit background: `bg-warning-bg`
  - Digit text: `text-warning`
  - Separator (`:`): `text-warning`

**Sizes:**
- `sm` (default — inline contexts like form throttle messages):
  - Digit: `w-[1.25em] h-[1.5em] text-[11px] rounded-[3px]` (em-relative — scales with parent font-size)
  - Separator: `text-caption mx-px`
  - Container gap: `gap-px` (1px)
- `lg` (modal contexts — used in §21 IdleWarningModal):
  - Digit: `w-8 h-10 text-2xl rounded-lg` (32×40px fixed)
  - Separator: `text-2xl mx-1`
  - Container gap: `gap-1` (4px)

**Animation mechanism (React key-remount + CSS keyframe):**
- Each digit renders inside a wrapper `<span>` with a child `<span>` that has `key={value}` and `className="countdown-slide"`
- When the digit value changes (e.g., "5" → "4"), React unmounts the old child `<span>` and mounts a new one (because the key changed)
- The new `<span>` triggers the `countdown-slide` CSS animation (defined in `globals.css`) which slides the digit in vertically
- Result: each digit position has its own micro-animation as values tick down — visually emphasizes the elapsing time
- This is a **non-obvious React + CSS pattern** worth understanding before customizing the component

**Tabular numbers:**
- Digit wrappers use `font-semibold tabular-nums` — the `tabular-nums` ensures all digits have equal width, so the timer doesn't jitter horizontally as values change (e.g., "1" wouldn't be visually narrower than "8")

**Format logic:**
- `mins = Math.floor(seconds / 60)` and `secs = seconds % 60`
- Both padded to 2 digits via `String(...).padStart(2, "0")`
- If `mins > 0`: render `MMa MMb : SSa SSb` (5 elements with separator)
- Else: render `SSa SSb` only (2 elements, no separator)
- The conditional render means transitioning from 60s → 59s changes the layout from MM:SS to SS — minor visual jump at that boundary (intentional — the "minutes are gone, only seconds remaining" cue is informative)

**Props:**
- `seconds: number` — required. Total seconds remaining. Component does NOT manage its own countdown — parent must decrement and re-render with new value (typically via `setInterval` or a custom hook).
- `variant?: "error" | "warning"` — defaults to `"error"`
- `size?: "sm" | "lg"` — defaults to `"sm"`

**Composition:**
- Used in §21 IdleWarningModal at the top: `<CountdownTimer seconds={secondsLeft} variant="warning" size="lg" />`
- This section fulfills the forward-reference made in §26 (B4 noted "CountdownTimer documented separately... will get its own section in B5")
- Other use cases: MFA throttle lockout banner (typically `variant="error"` `size="sm"` inline with the throttle message)

**Accessibility:**
- The component renders no semantic elements — it's a purely visual countdown (`<span>` only)
- Screen readers will announce the digits as inline text, not as a "countdown" semantic
- For accessibility-critical countdowns (e.g., "your session expires in N seconds"), pair the timer with surrounding `<p>` text that describes what's counting down — the timer is visual emphasis, not the primary message

**Token references:**
- `--color-error-bg`, `--color-error`, `--color-warning-bg`, `--color-warning`
- CSS keyframe: `countdown-slide` (declared in `globals.css`)

**Use cases:**
- MFA throttle (login lockout countdown — typically `variant="error"`, `size="sm"`)
- Idle session warning — used in §21 IdleWarningModal (`variant="warning"`, `size="lg"`)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/CountdownTimer.tsx`
- Spec export: **none** (JSX is the source of truth)
- CSS keyframe: `countdown-slide` declared in `nexacore-dashboard/src/app/globals.css`
- Cross-reference: §21 IdleWarningModal (uses CountdownTimer with variant=warning + size=lg)

---

### 28. Avatar

User profile picture with smart fallback chain (image → name initials → User icon). Round, three sizes, theme-aware.

| Property | Default | Type |
|----------|---------|------|
| `src` | `null` | `string \| null` (optional) |
| `name` | — | `string` (optional, drives initials) |
| `size` | `"md"` | `"sm" \| "md" \| "lg"` |
| `alt` | `name ?? "Avatar"` | `string` |
| `className` | `""` | `string` |

**Sizes (square, `rounded-full`):**
- **`sm`** — `w-8 h-8` (32×32), `text-caption` for initials, User-icon fallback at 14px
- **`md`** — `w-10 h-10` (40×40), `text-body` for initials, User-icon fallback at 18px
- **`lg`** — `w-16 h-16` (64×64), `text-h2` for initials, User-icon fallback at 28px

**Container styling:** `rounded-full border border-border-components bg-surface-tertiary overflow-hidden shrink-0`. ARIA: `role="img"`, `aria-label={alt ?? name ?? "Avatar"}`.

**Three-tier fallback chain (in order):**
1. **Image** — if `src` is provided AND no `onError` event has fired, render `<img>` with `object-cover`. Path resolution: paths starting with `/uploads/` are prefixed with `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000`); other paths pass through unchanged. Exposed as `resolveAvatarSrc(src)` helper.
2. **Initials** — if image fails or no `src`, derive from `name` via `getInitials()`: 2+ words → first letter of first two words (e.g., `"John Doe"` → `JD`), 1 word → first letter only (e.g., `"Alice"` → `A`). Rendered with `font-normal text-content-secondary select-none`.
3. **User icon** — if `name` is also missing/empty, render `lucide/User` at the per-size pixel value, color `text-content-primary/50`.

**Token references:**
- `--border-components`, `--surface-tertiary`, `--content-secondary`
- `--content-primary` at 50% opacity (fallback icon — see [Display primitives opacity pattern](#display-primitives-opacity-pattern) at end of cluster)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Avatar.tsx`
- Spec exports: `baseClass` (line 21), `sizeClasses` (line 24) — split exports, no consolidated `avatarSpecs`
- Helper: `resolveAvatarSrc(src)` exported from same file

> **Note on split exports:** Avatar uses `baseClass` + `sizeClasses` rather than a consolidated `avatarSpecs` object. The Source citation lists both. Future code-side cleanup could consolidate into `avatarSpecs` to align with the rest of the catalog.

---

### 29. Badge

Compact label for status, count, keyboard shortcut, or overlay annotation. 7 variants × 3 sizes — most variant-rich primitive in the cluster.

| Property | Default | Type |
|----------|---------|------|
| `variant` | `"default"` | `"default" \| "success" \| "warning" \| "error" \| "info" \| "kbd" \| "overlay"` |
| `size` | `"md"` | `"sm" \| "md" \| "lg"` |
| `children` | — | `ReactNode` (required) |
| `className` | `""` | `string` |

**Base styling:** `inline-flex items-center font-normal rounded-md` (radius `--radius-md` = 6px). Renders as `<span>` (inline element — does not break flow).

**Variants (7):**
- **`default`** — `bg-surface-subtle text-content-secondary`. Neutral status (e.g., "Draft", count badges).
- **`success`** — `bg-success-bg text-success`. Positive status (e.g., "Active", "Verified").
- **`warning`** — `bg-warning-bg text-warning`. Attention (e.g., "Pending", "2FA Required").
- **`error`** — `bg-error-bg text-error`. Negative status (e.g., "Failed", "Expired").
- **`info`** — `bg-info-bg text-info`. Informational (e.g., "New", "Beta").
- **`kbd`** — `bg-surface-tertiary text-content-primary font-mono`. Keyboard shortcut (e.g., `⌘K`, `Esc`). Used in §22 CommandPalette and §9 Tooltip.
- **`overlay`** — `bg-surface-inverse text-content-inverse border border-border-components backdrop-blur-sm`. For floating use on top of media or bright backgrounds (e.g., image-corner labels). Inverse-colored — readable on any backdrop.

**Sizes (typography + padding):**
- **`sm`** — `text-caption px-2 py-0.5` (~12px text, 8/2 padding)
- **`md`** — `text-body px-2.5 py-1` (~14px text, 10/4 padding)
- **`lg`** — `text-h3 px-3 py-1.5` (~16px text, 12/6 padding)

**Token references:**
- Per variant: `--surface-subtle`, `--content-secondary`, `--success-bg`, `--success`, `--warning-bg`, `--warning`, `--error-bg`, `--error`, `--info-bg`, `--info`, `--surface-tertiary`, `--content-primary`, `--surface-inverse`, `--content-inverse`, `--border-components`
- Spacing: `--space-2`, `--space-2.5`, `--space-3` (px); `--space-0.5`, `--space-1`, `--space-1.5` (py)
- Radius: `--radius-md`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Badge.tsx`
- Spec exports: `baseClass` (line 17), `variantClasses` (line 19), `sizeClasses` (line 30) — 3 split exports, no consolidated `badgeSpecs`

> **Note on split exports:** Badge uses 3 split exports rather than a consolidated `badgeSpecs` object. The Source citation lists all three. Same pattern as §28 Avatar; future cleanup could consolidate.

---

### 30. IconBadge

Square colored container for a single icon. Used as visual anchor for status, category, or feature flag. Distinct from §28 Avatar (round, image-bearing) and §29 Badge (text-bearing pill).

| Property | Default | Type |
|----------|---------|------|
| `variant` | `"default"` | `"default" \| "success" \| "warning" \| "error" \| "info"` |
| `size` | `"md"` | `"sm" \| "md" \| "lg"` |
| `children` | — | `ReactNode` (required — typically a `lucide` icon) |
| `className` | `""` | `string` |

**Base styling:** `inline-flex shrink-0 items-center justify-center rounded-md`. Square container — width = height. Renders as `<div>`.

**Variants (5 — same color tokens as §29 Badge, minus `kbd` and `overlay`):**
- **`default`** — `bg-surface-subtle text-content-secondary`
- **`success`** — `bg-success-bg text-success`
- **`warning`** — `bg-warning-bg text-warning`
- **`error`** — `bg-error-bg text-error`
- **`info`** — `bg-info-bg text-info`

**Sizes (square pixel + recommended icon size):**
- **`sm`** — `h-8 w-8` (32×32) — recommended icon: 16px
- **`md`** — `h-10 w-10` (40×40) — recommended icon: 24px
- **`lg`** — `h-14 w-14` (56×56) — recommended icon: 32px

**Token references:**
- Per variant: `--surface-subtle`, `--content-secondary`, `--success-bg`, `--success`, `--warning-bg`, `--warning`, `--error-bg`, `--error`, `--info-bg`, `--info`
- Sizing: `--space-8`, `--space-10`, `--space-14`
- Radius: `--radius-md`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/IconBadge.tsx`
- Spec export: `iconBadgeSpecs` (line 12)
- Cross-reference: §28 Avatar (rounded vs square; image-bearing vs icon-only); §29 Badge (text-bearing pill — shares the color palette)

> **Note on icon sizing:** The recommended icon sizes (16/24/32 per `sm/md/lg`) listed in `iconBadgeSpecs.sizes` are **not enforced by the component** — IconBadge renders `{children}` verbatim and relies on the consumer to size the lucide icon correctly (e.g., `<IconBadge size="md"><Settings size={24} /></IconBadge>`). A future enhancement could auto-size children via `React.cloneElement`, but currently icon sizing is consumer-responsibility.

---

### 31. Spinner

Generic circular border spinner — the canonical "data is loading" indicator. First of the **Spinner trio** (§31 / §32 / §33) — see comparison table at the end of §33.

| Property | Default | Type |
|----------|---------|------|
| `size` | `"md"` | `"sm" \| "md" \| "lg"` |
| `className` | `""` | `string` |

**Base styling:** `animate-spin rounded-full border-border-strong border-t-content-primary`. Technique: a full circle border colored neutrally, with the **top quarter** colored darker — Tailwind's `animate-spin` then rotates the whole `<div>` continuously, creating the illusion of a single rotating arc. Renders as `<div role="status" aria-label="Loading">`.

**Sizes (square pixel + border thickness scales with size):**
- **`sm`** — `h-4 w-4 border-[1.5px]` (16×16, 1.5px border) — inline contexts (inputs, buttons-with-loading text)
- **`md`** — `h-6 w-6 border-2` (24×24, 2px border) — section loading (tables, cards)
- **`lg`** — `h-8 w-8 border-[3px]` (32×32, 3px border) — large sections, full panels

**Use case:** data fetching for a panel, table, or card body. NOT for full-page loads (use §33 RingSpinner) and NOT for inside Buttons during loading (use §32 InfinitySpinner — the figure-8 has a smaller visual footprint that won't disrupt button layout).

**The 300ms delay pattern (mandatory for non-trivial fetches):**

> **Why:** A spinner that flashes for <300ms feels like a glitch — users perceive it as a UI bug, not a loading state. The 300ms threshold is the perceptual lower bound for "intentional feedback".
>
> **How to apply:**
> ```tsx
> const [showSpinner, setShowSpinner] = useState(false);
> useEffect(() => {
>   if (!isLoading) return;
>   const t = setTimeout(() => setShowSpinner(true), 300);
>   return () => clearTimeout(t);
> }, [isLoading]);
>
> if (isLoading && showSpinner) return <Spinner />;
> ```
>
> The pattern is documented in `spinnerSpecs.delayPattern`. Apply it whenever the underlying request can return in <300ms (most cached or local API calls).

**Accessibility:** `role="status"` exposes the loading state to screen readers; `aria-label="Loading"` provides the text. Visually, the spinner does not need a text label.

**Token references:**
- `--border-strong` (track color), `--content-primary` (arc color)
- Sizing: `--space-4`, `--space-6`, `--space-8`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Spinner.tsx`
- Spec export: `spinnerSpecs` (line 6) — includes `delayPattern: "300ms delay before showing — prevents flash on fast responses"`
- Cross-reference: §32 InfinitySpinner (in-button), §33 RingSpinner (page-level) — comparison table at end of §38

---

### 32. InfinitySpinner

Figure-8 lemniscate (∞) loading indicator. Inline SVG + CSS `@keyframes` replication of DaisyUI v5 `loading-infinity`. Second of the **Spinner trio** (§31 / §32 / §33) — see comparison table at the end of §33.

| Property | Default | Type |
|----------|---------|------|
| `size` | `"md"` | `"sm" \| "md" \| "lg"` |

**Sizes (square pixel — stroke is fixed at 2px regardless of size):**
- **`sm`** — 16px
- **`md`** — 24px
- **`lg`** — 32px

**Visual technique:**
- Square SVG with `viewBox="0 0 100 100"`. Width/height set per size.
- Single `<path>` traces the lemniscate (figure-8 S-curve) — coordinates extracted from DaisyUI v5 source.
- `transform: scale(0.8) origin(50px 50px)` (via Tailwind `scale-[0.8] origin-[50px_50px]`) — matches DaisyUI's built-in padding so the stroke does not clip at the viewBox edges.
- `vectorEffect="non-scaling-stroke"` + `strokeWidth="2"` → stroke is exactly 2px at every size, immune to viewBox and CSS scale transforms.
- `stroke="currentColor"` — color inherited from the parent's text color (set via Tailwind `text-*` utilities). When used inside a Button, the spinner picks up the button's text color automatically.

**Animation:**
- CSS class `infinity-spinner` (defined in `globals.css:379`) applies `@keyframes infinity-spin` (`globals.css:370-377`): `stroke-dashoffset: 0 → 256.589` over `2s linear infinite`.
- `strokeDasharray="205.271 51.318"` (long dash ≈80% of path + short gap ≈20%). Total cycle = `205.271 + 51.318 = 256.589`.
- The dashoffset shift moves the visible dash around the full path once per 2s, producing the smooth "tracing the infinity sign" effect.

**Use case:** **inside Buttons during loading state** — the figure-8 has a smaller and steadier visual footprint than the rotating circle (§31), which makes it less disruptive when the button width is fixed and the loading state replaces the label inline.

**Accessibility:** rendered as `<svg aria-hidden="true">`. Loading state must be announced by the parent (typically a `<button disabled aria-busy="true">`). See §38 trio Accessibility note for standalone use.

**Token references:** none — color inherited via `currentColor` from parent's `text-*` utility.

**Source:**
- Code: `nexacore-dashboard/src/components/ui/InfinitySpinner.tsx`
- Spec export: `infinitySpinnerSpecs` (line 23)
- Animation: `nexacore-dashboard/src/app/globals.css:370-381` (`@keyframes infinity-spin` + `.infinity-spinner` class)
- Origin: DaisyUI v5 `loading-infinity` (replicated as inline SVG + CSS keyframes)

> **Note on size scale:** `infinitySpinnerSpecs.sizes` exposes 3 sizes (`sm` 16, `md` 24, `lg` 32) — a deliberate subset of DaisyUI v5's full 5-size scale (`xs` 16, `sm` 20, `md` 24, `lg` 28, `xl` 32). Our `sm` maps to DaisyUI's `xs`, our `md` to DaisyUI's `md`, our `lg` to DaisyUI's `xl`. DaisyUI's `sm` (20) and `lg` (28) are not exposed. The component's JSDoc references the full DaisyUI scale for context — could mislead a reader expecting all 5 sizes.

---

### 33. RingSpinner

Ripple/sonar dual-ring loading indicator. Inline SVG with **SMIL** animation (no CSS keyframes — all animation is handled by SVG `<animate>` elements). Replicates DaisyUI v5 `loading-ring`. Third and final of the **Spinner trio** (§31 / §32 / §33).

| Property | Default | Type |
|----------|---------|------|
| `size` | `"md"` | `"sm" \| "md" \| "lg"` |

**Sizes (square pixel — same scale as §32 InfinitySpinner):**
- **`sm`** — 16px
- **`md`** — 24px
- **`lg`** — 32px

**Visual technique:**
- Square SVG with `viewBox="0 0 44 44"`. Width/height set per size.
- Two `<circle>` elements share the same center (`cx=22 cy=22`). Identical in shape but offset in time.
- `strokeWidth="2"` set on the wrapping `<g>`, in SVG user units. Inherits color via `stroke="currentColor"` — same mechanism as §32.

**Animation (SMIL — pure SVG, no CSS):**
- Each circle has two `<animate>` children:
  1. **Radius**: `r` animates `1 → 20` over `1.8s`, `repeatCount="indefinite"`. Easing: `keySplines="0.165,0.84,0.44,1"` (ease-out — fast initial expansion that decelerates as it approaches the edge).
  2. **Opacity**: `stroke-opacity` animates `1 → 0` over `1.8s`, `repeatCount="indefinite"`. Easing: `keySplines="0.3,0.61,0.355,1"` (ease-out — quick initial fade, slow finish).
- **Stagger:** Circle 1 begins at `t=0`, Circle 2 begins at `t=-0.9s` (half of the 1.8s period). Together they create a continuous ripple — at any moment one ring is expanding from the center while the other is halfway to the edge.

**Use case:** **page-level loading** — full-route fetches, initial app boot, large data lazy-loads. The dual-ring sonar pattern occupies a noticeable area without the rotational motion of §31 (less dizzying when filling a large viewport) and with a more organic feel than the geometric figure-8 of §32.

**Token references:** none — color inherited via `currentColor` from parent's `text-*` utility.

**Source:**
- Code: `nexacore-dashboard/src/components/ui/RingSpinner.tsx`
- Spec export: `ringSpinnerSpecs` (line 24)
- Origin: DaisyUI v5 `loading-ring` (replicated as inline SVG with SMIL `<animate>`)

> **Note on size scale:** Same 3-of-5 subset as §37 — DaisyUI's `xs`/`sm`/`md`/`lg`/`xl` scale (16/20/24/28/32) is mapped to our `sm`/`md`/`lg` (16/24/32), skipping DaisyUI's `sm` (20) and `lg` (28). The component's JSDoc references the full DaisyUI scale for context.

#### Spinner trio comparison

| Aspect | §31 Spinner | §32 InfinitySpinner | §33 RingSpinner |
|--------|-------------|---------------------|-----------------|
| Visual | Single rotating arc on a full circle | Figure-8 lemniscate (∞) | Dual concentric expanding rings (sonar) |
| Animation tech | Tailwind `animate-spin` (CSS rotation transform) | CSS `@keyframes` on `stroke-dashoffset` | SVG SMIL `<animate>` on `r` + `stroke-opacity` |
| Animation source | Inline (Tailwind class on the `<div>`) | `globals.css:370-381` | Inline (SVG `<animate>` children) |
| Period | Tailwind default (1s) | 2s linear | 1.8s ease-out, two circles staggered by 0.9s |
| Color mechanism | `border-border-strong` track + `border-t-content-primary` arc | `stroke="currentColor"` (inherits text color) | `stroke="currentColor"` (inherits text color) |
| Sizes | sm 16 / md 24 / lg 32 (border thickness scales: 1.5 / 2 / 3px) | sm 16 / md 24 / lg 32 (stroke fixed at 2px via `non-scaling-stroke`) | sm 16 / md 24 / lg 32 (stroke fixed at 2 user units) |
| Container | `<div role="status">` | `<svg aria-hidden>` (silent) | `<svg aria-hidden>` (silent) |
| Use case | Section/panel/card loading | Inside Buttons during loading | Page-level loading |
| When to choose | Default — inline anywhere data is fetching | When the spinner must live inside a fixed-width container without disrupting layout | When the loading area is large enough that a rotating arc would feel jittery |

**Accessibility note (trio-wide):** Only §31 Spinner exposes `role="status"` + `aria-label="Loading"`. §37 and §38 use `aria-hidden="true"` because they are typically composed with a parent that already announces the loading state (a Button's `disabled` + `aria-busy` for §37; a page-level skeleton or "Loading…" headline for §38). If you place §37 or §38 in isolation, wrap them in a `<div role="status" aria-label="Loading">`.

---

### 34. Divider

Visual separator between sibling content blocks. Three orientations: horizontal line, horizontal line with centered label, vertical line.

| Property | Default | Type |
|----------|---------|------|
| `orientation` | `"horizontal"` | `"horizontal" \| "vertical"` |
| `label` | — | `string` (optional — adds centered text) |
| `className` | `""` | `string` |

**Color:** always `bg-border-strong` (`rgba(0,0,0,0.08)` light theme / `rgba(255,255,255,0.12)` dark theme — see Theme System).

**Thickness:** 1px (`h-px` for horizontal, `w-px` for vertical).

**Four rendering modes:**
- **Horizontal line** (default — no `label`, `orientation="horizontal"`):
  - Single `<div className="h-px w-full bg-border-strong">`
  - Use case: separating sections within a card or list group
- **Horizontal with label** (`label` set, `orientation="horizontal"`):
  - Layout: `flex items-center gap-4` — two `flex-1` lines (left + right) flanking centered text
  - Label typography: `text-caption text-content-primary/50`
  - Use case: "or" separator between auth methods (e.g., "Continue with Google" / **or** / email + password form)
- **Vertical line** (no `label`, `orientation="vertical"`):
  - `<div className="mx-1 w-px self-stretch bg-border-strong">` — `self-stretch` requires the parent to be a flex container so the line takes the parent's full height; `mx-1` adds 4px horizontal margin for breathing room
  - Use case: separating inline groups (e.g., toolbar segments)
- **Vertical with label** (`label` set, `orientation="vertical"`):
  - Layout: `flex flex-col items-center gap-2 self-stretch` — two `flex-1` lines (top + bottom) flanking the label
  - Same label typography as horizontal
  - Use case: less common — mostly for tall sidebars or vertical step lists

**Token references:**
- `--border-strong` (line color)
- `--content-primary` at 50% opacity (label text — see [Display primitives opacity pattern](#display-primitives-opacity-pattern) at end of cluster)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Divider.tsx`
- Spec export: `dividerSpecs` (line 7)

> **Note on inline text dividers elsewhere in the doc:** §10 Breadcrumbs uses `lucide/ChevronRight` between segments, and §7 Analytics Graph uses inline `|` separators in legend rows. Those are **NOT this component** — they're per-context inline characters/icons. Use Divider only for structural separation between content blocks.

---

### 35. Accordion

Vertically stacked collapsible items — single-open exclusivity (opening one item closes others). Accessibility-friendly height animation via CSS Grid trick (no JavaScript height measurement). Two visual variants for trigger styling.

| Property | Default | Type |
|----------|---------|------|
| `items` | — | `Array<{title: string; children: ReactNode}>` (required) |
| `variant` | `"default"` | `"default" \| "section"` |
| `borderless` | `false` | `boolean` (removes outer border + rounded) |
| `defaultOpen` | `null` | `number` (item index to open initially) |
| `className` | `""` | `string` |

**Container styling:**
- Outer (`borderless={false}`): `rounded-md border border-border-components overflow-hidden bg-surface-primary`
- Outer (`borderless={true}`): bg + overflow only — no border, no radius (use case: nesting inside another card that already has its own border)
- Internal: `divide-y divide-border-strong` between items (always applied — see disclosure below)

**Trigger styling (every item header):**
- Layout: `<button>` with `flex w-full items-center justify-between px-4 py-3`
- Hover: `hover:bg-surface-subtle transition-colors`
- Trailing icon: `lucide/ChevronDown size={16}` with `text-content-primary/50` (see [Display primitives opacity pattern](#display-primitives-opacity-pattern))
- Icon rotation on open: `rotate-180` with `transition-transform duration-200`

**Trigger typography (per variant):**
- **`default`** — `text-body font-normal text-content-primary` (~14px, regular weight). Standard collapsible content (FAQs, settings groups).
- **`section`** — `text-h3 font-semibold uppercase tracking-wider text-content-primary` (~16px, bold uppercase). Heavy section dividers (sidebar group headers, dashboard panel groupings).

**Content area (per item, when open):** `px-4 pt-3 pb-4` — slightly different vertical rhythm than trigger to visually distinguish content from header.

**Animation pattern — the Radix UI grid-row trick:**

> **Why this pattern:** animating `height: auto` with CSS is impossible (browsers can't interpolate between `0` and `auto`). The traditional workaround is `max-height: 9999px`, but that's brittle (animation eases over phantom space) and inaccessible (content is technically rendered with 0 height). The CSS Grid trick is the canonical accessible solution.
>
> **How it works:**
> ```html
> <div class="grid transition-[grid-template-rows] duration-200 ease-out
>             grid-rows-[0fr]">  <!-- collapsed -->
>   <div class="overflow-hidden">
>     <div class="px-4 pt-3 pb-4"> {content} </div>
>   </div>
> </div>
> ```
>
> When open, `grid-rows-[0fr]` flips to `grid-rows-[1fr]`. The outer grid container animates `grid-template-rows` (a numeric `fr` interpolation works), the inner `overflow-hidden` clips, and the innermost `<div>` is the natural-height content. Result: height auto-animates with no measurement code, no `max-height` ceiling, and full screen-reader access (content is always mounted).

**Animation timing:** 200ms ease-out for both height (grid-template-rows) and chevron (transform).

**Sister export:** `SingleAccordion` (also exported from `Accordion.tsx`) — a simpler component for a **single** collapsible item (no array, no exclusivity logic). Use when you only need one toggleable section (e.g., "Show advanced options").

**Token references:**
- `--surface-primary`, `--border-components`, `--border-strong`, `--surface-subtle`
- `--content-primary` (text + icon at 50% opacity — see [Display primitives opacity pattern](#display-primitives-opacity-pattern) at end of cluster)
- Spacing: `--space-4` (px-4), `--space-3` (py-3, pt-3), `--space-4` (pb-4)
- Radius: `--radius-md`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/Accordion.tsx`
- Spec export: `accordionSpecs` (line 19)
- Sister export: `SingleAccordion` (line 100 — same file)

> **Note on the `borderless` prop:** `accordionSpecs.container.divider` describes `divide-y divide-border-strong` as a conditional, but the JSX **always** applies it regardless of the `borderless` prop. The `borderless` flag only removes the outer border and rounded corners — items remain divided. This is intentional (dividers between items make sense even without an outer container) but the spec wording could mislead a reader.

---

### 36. EmptyState

Centered placeholder for empty lists, search-no-results, error states, or zero-state screens. Composes icon + title + description + optional action Button. Two visual variants: `default` (neutral) and `error` (semantic red).

| Property | Default | Type |
|----------|---------|------|
| `variant` | `"default"` | `"default" \| "error"` (SCRUM-408) |
| `title` | — | `string` (required) |
| `description` | — | `string` (optional) |
| `icon` | variant-dependent (see below) | `ReactNode` (optional — overrides variant default) |
| `action` | — | `ReactNode` (optional — typically a Button or Link) |
| `className` | `""` | `string` |

**Variants:**

| Variant | Default icon | Icon color | Use case |
|---------|--------------|------------|----------|
| `default` | `<Inbox size={48} />` | `text-content-primary/30` (neutral gray) | Empty list, search no-results, zero-state |
| `error` | `<AlertTriangle size={48} />` | `text-error` (semantic red — `--color-error`) | Failed-to-load placeholders (replaces inline error text per §0.2 Loading/Empty/Error patterns) |

Title color (`text-content-primary`), description color (`text-content-primary/50`), and container layout are identical across variants. The variant signal is conveyed via the icon shape + color, keeping the text neutral (matches Stripe Dashboard / GitHub / Linear convention for error placeholders).

**Container styling:** `flex flex-col items-center gap-3 py-12` — vertical stack, center-aligned, 12-unit (48px) vertical breathing room. **No horizontal padding** — relies on the parent for horizontal constraints.

**Composition (top to bottom):**
1. **Icon** — wrapped in a `<span>` carrying the variant color class. Default icon swaps to `lucide/AlertTriangle` when `variant="error"`. Override by passing any ReactNode (e.g., `<Search size={48} />` for search-no-results); the consumer-supplied icon inherits the variant color via `currentColor`.
2. **Title** — `<p className="text-body font-semibold text-content-primary">`. Required. Short, declarative (e.g., "No projects yet", "Couldn't load users").
3. **Description** — `<p className="text-caption text-content-primary/50 text-center">` (rendered only if `description` prop is set). Brief explanatory text (e.g., "Create your first project to get started", "Network error — please try again").
4. **Action** — rendered as-is (no wrapper). Typically a `Button` (see §10 Button Set) for the primary recovery action ("Create project", "Retry"), or a `Link` for a secondary navigation cue.

**Use cases (per variant):**

- `default`: empty list (zero projects, zero notifications), search no-results, permission gate (no items to view), zero-state onboarding.
- `error`: failed-to-load placeholders for tables (see §47 DataTable), profile-section error states (ActiveSessions / TrustedDevices / PasskeyManager / SecurityActivity per SCRUM-403), or any data-driven section whose fetch errored. Always provide a retry `action` Button when the operation is retryable.

**Token references:**
- `--content-primary` at 30% (default icon), 100% (title), 50% (description) — see [Display primitives opacity pattern](#display-primitives-opacity-pattern) immediately below
- `--color-error` (error variant icon) — semantic feedback token from §Semantic Feedback Colors
- Spacing: `--space-3` (gap-3), `--space-12` (py-12)
- Typography: `--text-body`, `--text-caption`
- Cross-reference: [Loading, Empty & Error State Patterns (SCRUM-352)](#loading-empty--error-state-patterns-scrum-352) defines when to use `<EmptyState variant="error">` vs in-table `emptyMessage` vs section loaders

**Source:**
- Code: `nexacore-dashboard/src/components/ui/EmptyState.tsx`
- Spec export: `emptyStateSpecs.variants` (added by SCRUM-408)
- Cross-references: §10 Button Set (action prop typically receives a Button), §47 DataTable (consumes `<EmptyState variant="error">` for table-wide error state per SCRUM-407)

---

#### <a id="display-primitives-opacity-pattern"></a>Display primitives opacity pattern

Across the Display primitives cluster (§28-§36), **four components** apply Tailwind opacity modifiers to `--color-content-primary` instead of using a dedicated semantic token:

| Section | Use | Class |
|---------|-----|-------|
| §28 Avatar | User-icon fallback color (when no `src` and no `name`) | `text-content-primary/50` |
| §34 Divider | Label text on horizontal/vertical labelled dividers | `text-content-primary/50` |
| §35 Accordion | ChevronDown trigger icon | `text-content-primary/50` |
| §36 EmptyState | Default icon wrapper | `text-content-primary/30` |
| §36 EmptyState | Description text | `text-content-primary/50` |

This is **not a token violation in spirit** — `--color-content-primary` is the source value and Tailwind's `/30` and `/50` modifiers compute the same result they would if dedicated `--color-content-tertiary` (50%) and `--color-content-quaternary` (30%) tokens existed. The current state is a **token coverage gap**, not a wrong-color choice.

> **Future cleanup recommendation:** when `--color-content-tertiary` and `--color-content-quaternary` (or equivalent named tokens) are added to the design system, migrate all 5 occurrences in **one coordinated PR** (not one component at a time) to avoid drift. Same coordination principle as the `--color-success` migration tracked in §23 CopyField + §25 RecoveryCodesGrid (B5).

---

### 37. IconButton

Single-icon button — used wherever a labeled `<Button>` would be too verbose (toolbar actions, in-input affordances, calendar nav, theme toggle). Composes optionally with §9 Tooltip for hover-discovered labels. Forwards refs for parent-controlled focus / imperative APIs.

| Property | Default | Type |
|----------|---------|------|
| `variant` | `"default"` | `"default" \| "danger" \| "boxed" \| "boxed-hover"` |
| `size` | `"sm"` | `"sm" \| "md"` |
| `loading` | `false` | `boolean` |
| `tooltip` | — | `boolean \| string` (see "Tooltip composition" below) |
| `tooltipPosition` | `"auto"` | `TooltipPosition` (re-exported from §9 Tooltip) |
| `disabled` | — | inherited from `ButtonHTMLAttributes` |
| `className` | `""` | `string` |

Plus all native `<button>` attributes via `React.ButtonHTMLAttributes<HTMLButtonElement>`. Wrapped in `forwardRef<HTMLButtonElement, IconButtonProps>` for imperative parent access.

**Base styling:** `inline-flex items-center justify-center shrink-0 p-2 rounded-md cursor-pointer`. Note: `p-2` in the `baseClass` is overridden by `sizeClasses` per size — see split-export disclosure below.

**Variants (4 in TS type — `IconButtonVariant`):**
- **`default`** (default) — `text-content-primary/50 transition-colors hover:text-content-primary`. Use case: muted icon-only affordance (theme toggle, copy secret button). Inactive opacity matches the [Display primitives opacity pattern](#display-primitives-opacity-pattern) — same `text-content-primary/50` source as Avatar fallback / Divider label / Accordion chevron / EmptyState description.
- **`danger`** — `text-error transition-colors hover:bg-error-bg`. Use case: destructive icon action (e.g., remove member, dismiss alert).
- **`boxed`** — `bg-surface-tertiary text-content-primary hover:bg-surface-subtle focus-visible:ring-1 focus-visible:ring-border-components aria-pressed:ring-1 aria-pressed:ring-border-components`. **Toggle-button semantics**: the `aria-pressed:ring-1` styling triggers when consumer sets `aria-pressed="true"` (e.g., theme toggle, settings buttons with on/off state). Used in §3 Calendar nav arrows and §2 Sidebar Items collapsed-mode triggers.
- **`boxed-hover`** — `text-content-primary/50 transition-colors hover:bg-surface-tertiary hover:text-content-primary`. Hybrid of `default` (muted by default) + `boxed` (background on hover). Use case: secondary toolbar actions where the box appears only on user attention. Same `/50` opacity as `default`.

**Sizes:**
- **`sm`** (default — only component in this cluster where `sm` is default) — `p-2 rounded-md` (8px padding all sides, expected ~32×32 with a 16px icon)
- **`md`** — `p-3 rounded-md` (12px padding, expected ~40×40 with a 16-24px icon)

**Tooltip composition:**
- Pass `tooltip={true}` to wrap the button in `<Tooltip>` using `aria-label` as the tooltip text (consumer must set `aria-label` for accessibility anyway, so this is zero-cost).
- Pass `tooltip="custom text"` to use explicit string instead of `aria-label`.
- Pass `tooltipPosition="top|bottom|left|right|auto"` (defaults to `"auto"` — Tooltip auto-detects viewport edges, see §9 Tooltip).
- If `tooltip` is set but no text resolves (no `aria-label`, no string), the wrapper is skipped — degrades gracefully.

**Loading mechanism (different from §10 Button — third spinner pattern in the codebase):**
- When `loading={true}`: children are replaced (NOT overlaid) with a local inline circular spinner: `<div className="h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current" />`.
- This is **NOT** §31 Spinner (which is a standalone primitive with `border-border-strong` track) and **NOT** §32 InfinitySpinner (figure-8). It's an inline-CSS implementation specific to IconButton — color inherited via `currentColor`.
- `loading` also forces `disabled` (prevents double-trigger).

**`usage` export (use cases, line 28 of source):**

| Use case | Composer | Icon | Variant |
|----------|----------|------|---------|
| Theme toggle | `AuthLayout` | `Moon` / `SunDim` 16px | `default` |
| Copy secret | `MfaSetupStep` | `Copy` / `Check` 16px | `default` |
| Password eye | `Input` | `Eye` / `EyeOff` 16px | **`inside input` (orphan — see disclosure)** |
| Calendar nav | `Calendar` | `ChevronLeft` / `ChevronRight` 16px | `boxed` |
| Calendar day | `Calendar` | day number text | **`circle` (orphan — see disclosure)** |

**Token references:**
- Per variant: `--content-primary` (at 50% opacity for `default` + `boxed-hover` — see [Display primitives opacity pattern](#display-primitives-opacity-pattern)), `--error`, `--error-bg`, `--surface-tertiary`, `--surface-subtle`, `--border-components`
- Spacing: `--space-2`, `--space-3`
- Radius: `--radius-md`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/IconButton.tsx`
- Spec exports: `baseClass` (line 8), `variantClasses` (line 11), `sizeClasses` (line 23), `usage` (line 28) — **4 split exports, no consolidated `iconButtonSpecs`**
- Type union: `IconButtonVariant` (exported, line 6 — only 4 variants, not the 5 in `variantClasses` runtime)
- Cross-reference: §9 Tooltip (composition partner); §10 Button Set (sister button primitive — IconButton is the icon-only specialization); §38 SegmentedControl (sister interactive primitive)

> **Note on split exports:** IconButton uses 4 split exports (`baseClass` + `variantClasses` + `sizeClasses` + `usage`) — same most-split count as §10 Button. Source citation lists all four. The `usage` export is informational only (not used by the component itself) but valuable for discoverability of where IconButton appears in the codebase.

> **Note on orphan variants — both directions:**
> 1. **`inside input` is in `variantClasses` runtime but NOT in `IconButtonVariant` TS union.** Consumer code that wants to use it must `// @ts-expect-error` or pass via `className` override. Used in §16 Input for the password-eye toggle.
> 2. **`circle` is referenced in the `usage` export ("Calendar — day number text (circle)") but NOT in `variantClasses` runtime nor in TS union.** Either the calendar day button uses an undocumented inline `className`, or the `usage` export is stale (predates a `circle` variant that was removed). Worth a code-side audit to reconcile — either add `circle` to `variantClasses` or update the `usage` entry.

> **Note on the third spinner pattern:** IconButton's loading spinner is an inline SVG-CSS implementation distinct from §31 Spinner, §32 InfinitySpinner, and §33 RingSpinner. It uses `border-current/20` track + `border-t-current` arc — the same visual mechanic as §31 Spinner but inlined to inherit the button's text color via `currentColor`. Could be unified with §36 by having §36 accept `currentColor`-aware tokens, but kept inline for now to avoid coupling.

---

### 38. SegmentedControl

Bordered group of mutually-exclusive options — like a tab group but visually compact and meant for inline filter / sort / view-mode switches rather than full content-section navigation. Generically typed for type-safe `value` props. 3 variants × 3 sizes.

| Property | Default | Type |
|----------|---------|------|
| `options` | — | `Array<{value: T; label: string; icon?: ReactNode}>` (required) |
| `value` | — | `T extends string` (required — controlled component) |
| `onChange` | — | `(value: T) => void` (required) |
| `variant` | `"primary"` | `"primary" \| "secondary" \| "outline"` |
| `size` | `"sm"` | `"sm" \| "md" \| "lg"` (note: `sm` is the default — the only component in this cluster where `sm` is default) |
| `className` | `""` | `string` |

Generic typing: `SegmentedControl<T extends string>` — `value` and `onChange` are constrained to a string-literal union, so passing `value="invalid"` when options are `"a" | "b"` is a TS error at the call site.

**Container styling:** `inline-flex rounded-lg border border-border-components bg-surface-subtle p-1`. The `p-1` (4px) creates the inset gap between the option buttons and the container border, producing the "pill inside a track" look.

**Variants (3 — all share the active `shadow-sm` ring):**
- **`primary`** (default) — active: `bg-surface-inverse text-content-inverse border border-border-components shadow-sm`. Use case: dominant view-mode switch (e.g., List / Grid / Card view selector at the top of a list page).
- **`secondary`** — active: `bg-surface-tertiary text-content-primary border border-border-components shadow-sm`. Use case: secondary filter (e.g., timeframe selector — Today / Week / Month).
- **`outline`** — active: `bg-surface-primary text-content-primary border border-border-components shadow-sm`. Use case: subtle in-card filter where the active state should match the surrounding surface.

**Inactive state (all variants):** `border border-transparent text-content-primary/50 hover:text-content-primary`. The `border-transparent` reserves the same border-width as the active state — prevents the layout from shifting 1px when the user clicks a different option.

> The `text-content-primary/50` inactive color extends the [Display primitives opacity pattern](#display-primitives-opacity-pattern) (B6) to the Buttons + interactive cluster. Same coordinated-migration recommendation applies: when `--color-content-tertiary` token is added, migrate this occurrence together with the 5 occurrences in §28 Avatar / §34 Divider / §35 Accordion / §36 EmptyState.

**Sizes (per option button):**
- **`sm`** (default) — `h-8 px-4 text-caption` (32px height)
- **`md`** — `h-10 px-6 text-body` (40px height)
- **`lg`** — `h-12 px-8 text-h3` (48px height)

**Option button styling (shared):** `flex items-center gap-1.5 rounded-md font-normal transition-all`. The `gap-1.5` is the spacing between the optional `icon` and the `label`.

**Optional icon per option:**
- Each option can include an `icon: ReactNode` (typically a `lucide` icon at 16px).
- Renders before the label inside the option button.
- No automatic sizing — consumer is responsible for icon size (similar to §30 IconBadge consumer-responsibility pattern).

**Comparison with §5 Tabs (sister tab-like primitive):**

| Aspect | §5 Tabs | §38 SegmentedControl |
|--------|---------|----------------------|
| Visual | Tab row with bottom-border on active (or fill, depending on variant) | Pill group inside a bordered track |
| Active state | `nav` border-bottom + filled `subtle` variant | `shadow-sm` filled variant |
| Use case | Content-section navigation (whole-page tabs, sidebar nav) | Inline filter / sort / view-mode switch |
| Generic typing | No | Yes (`<T extends string>`) |
| Mutual exclusivity | Yes (single active tab) | Yes (single active value) |
| When to choose | When switching whole content sections / routes | When switching one filter inside a panel without changing context |

**Token references:**
- Container: `--surface-subtle`, `--border-components`, `--radius-lg`, `--space-1` (p-1 inset)
- Active per variant: `--surface-inverse`, `--content-inverse`, `--surface-tertiary`, `--content-primary`, `--surface-primary` (per variant)
- Inactive: `--content-primary` at 50% opacity (see Display primitives opacity pattern)
- Per size: `--space-8` / `--space-10` / `--space-12` (h), `--space-4` / `--space-6` / `--space-8` (px), `--text-caption` / `--text-body` / `--text-h3`
- Option button: `--radius-md`, `--space-1.5` (gap)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/SegmentedControl.tsx`
- Spec exports: `segmentedControlSpecs` (line 22 — consolidated) + `sizeClasses` (line 16 — split) — **2 split exports**
- Type union: `SegmentedVariant` (exported, line 5)
- Internal const: `activeClasses` (line 7 — NOT exported; consumers can't inspect via the spec object alone)
- Cross-reference: §5 Tabs (sister tab-like primitive — see comparison table above); §10 Button Set (sister interactive primitive); §30 IconBadge (consumer-responsibility icon sizing precedent)

> **Note on partial split exports:** SegmentedControl has a consolidated `segmentedControlSpecs` (which includes the `variants` field with active classes per variant) BUT also exports `sizeClasses` separately — and the `activeClasses` const that the JSX actually applies is INTERNAL (not exported). So a consumer reading only the spec exports gets sizes twice (in `segmentedControlSpecs.sizes` AND `sizeClasses`) but cannot directly inspect what runtime classes are applied for the active state without reading the source. Future code-side cleanup could either: (a) export `activeClasses` and drop `segmentedControlSpecs.variants`, or (b) drop the standalone `sizeClasses` export since it's redundant with `segmentedControlSpecs.sizes`.

---

### 39. ToastContainer

Singleton container that renders all active §14 Toast instances at the top of the viewport. Connects to the `useToast()` context to read the toast list and provides the `removeToast` callback to each Toast. Wraps everything in framer-motion's `<AnimatePresence>` to enable Toast's exit animation.

> **Note:** This component does NOT export a spec object. Section content is sourced directly from the JSX (`ToastContainer.tsx`, 27 lines). Future code-side cleanup could add `toastContainerSpecs` to align with the rest of the catalog. Same disclosure pattern as §14 Toast (B5+ JSX-only precedent).

| Property | Value |
|----------|-------|
| Props | None — singleton; no configuration surface |
| Dependencies | `useToast()` from `@/context/ToastContext` (provides `{toasts, removeToast}`); `<Toast>` from `@/components/ui/Toast`; `<AnimatePresence>` from `framer-motion` |
| Render contract | Reads `toasts` array from context, maps each to a `<Toast>` keyed by `toast.id`, passes `onClose={removeToast}` |

**Container styling:** `pointer-events-none fixed inset-x-0 top-6 z-50 flex flex-col items-center gap-2 px-[50px]`.

**Layout breakdown:**
- **`fixed inset-x-0`**: pinned to the top of the viewport, full horizontal width
- **`top-6`**: 24px from viewport top
- **`z-50`**: same layer as §4 Modal — see collision note below
- **`flex flex-col items-center`**: vertical stack, horizontally centered
- **`gap-2`**: 8px between stacked toasts
- **`px-[50px]`**: 50px horizontal safe area on each side — prevents toasts from touching viewport edges

**Pointer-events layering rationale:**
- The container itself is `pointer-events-none` — clicks pass through gaps between toasts to the underlying UI (e.g., dashboard content remains interactive while toasts are visible).
- Each child §14 Toast sets `pointer-events-auto` on its own element — making the toast content (close button, links, etc.) interactive.
- This pattern is what allows toasts to be "non-blocking" notifications — they appear without disabling the page.

**AnimatePresence wrapper:**
```tsx
<AnimatePresence>
  {toasts.map((toast) => (
    <Toast key={toast.id} ...props onClose={removeToast} />
  ))}
</AnimatePresence>
```
- `AnimatePresence` from `framer-motion` is required to trigger §14 Toast's `exit` animation (slide right + fade) when a toast is removed from the list.
- Without `AnimatePresence`, removed toasts would unmount instantly without their dismissal animation.
- The `key={toast.id}` is critical — `AnimatePresence` uses keys to track which children are entering, present, or exiting.

> **Z-index collision note:** ToastContainer at `z-50` shares the same layer as §4 Modal. In practice this means: if a Modal is open AND a Toast appears, render order determines which appears on top. Since ToastContainer is typically mounted near the root of the app (above pages, sibling to modals), toasts will render ABOVE modal content as long as ToastContainer's DOM position is later than Modal's. This is the current behavior — verify when adding new top-layer components.

**Mounting:**
- Singleton: only one `<ToastContainer>` should be mounted in the app, typically in a root layout (e.g., `RootLayout` or `Providers`) so it's available across all pages.
- Coupled to `ToastProvider` — must be inside the React tree where `useToast()` is provided (the `ToastContext.Provider`).

**Accessibility:**
- The container itself has no ARIA role — it's a positioning + layout wrapper.
- The accessibility semantics live on each §14 Toast (`role="alert"` + `aria-live="assertive"`).
- Screen readers announce each new Toast as it enters the DOM.

**Token references:**
- Spacing: `--space-6` (top-6 = 24px), `--space-2` (gap-2 = 8px)
- Custom: `px-[50px]` is a Tailwind arbitrary value (NOT a token) — could be migrated to `--space-12` (48px, closest standard) or kept as-is for the explicit safe-area intent.

**Source:**
- Code: `nexacore-dashboard/src/components/ui/ToastContainer.tsx`
- Spec export: **none** (JSX is the source of truth)
- Library: `framer-motion` (`AnimatePresence`)
- Context: `@/context/ToastContext` (`useToast()`)
- Cross-reference: §14 Toast (composes for each entry); §4 Modal (z-index sibling — see collision note above)

> **Note on `px-[50px]` non-token value:** The 50px lateral safe area is a Tailwind arbitrary value. Could be migrated to a token (`--space-12` = 48px is the closest standard) but the explicit `[50px]` reads as an intentional design choice rather than a missing token. Worth flagging during a future token coverage audit.

---

### 40. AlertBox

Inline boxed alert — colored border + background + icon + message, used for in-flow notices that should remain visible until the surrounding context changes (unlike §14 Toast which is transient and auto-dismisses). Single body slot, no title, no dismiss button. The simplest of the alert family.

| Property | Default | Type |
|----------|---------|------|
| `variant` | — | `"warning" \| "error" \| "info" \| "success"` (required) |
| `children` | — | `ReactNode` (required — alert message body) |
| `className` | `""` | `string` |

**Container styling:** `inline-flex items-start gap-2 rounded-lg border ${border} ${bg} p-3` — note **`inline-flex` (NOT block)**. Disclosure: this means AlertBox sizes to its content's intrinsic width, NOT to its parent. Wrap in a full-width container or pass `className="w-full"` if you need it to fill the row (e.g., inside a form column).

**Variants (4 — same set as §14 Toast for visual + semantic consistency):**

| Variant | Icon (lucide) | Border + BG + Icon Color |
|---------|---------------|--------------------------|
| `warning` | `AlertTriangle` 16px | `border-warning-border bg-warning-bg text-warning` |
| `error` | `CircleX` 16px | `border-error-border bg-error-bg text-error` |
| `info` | `Info` 16px | `border-info-border bg-info-bg text-info` |
| `success` | `CircleCheck` 16px | `border-success-border bg-success-bg text-success` |

> **Variant icon difference vs §14 Toast:** Toast's `error` uses `TriangleAlert` (lucide), while AlertBox's `warning` uses `AlertTriangle` (lucide alias for the same icon) — visually identical. AlertBox's `error` uses `CircleX` (NOT TriangleAlert) — a distinct visual to differentiate the two error displays at a glance.

**Icon styling:** `mt-0.5 shrink-0 16px` — slight top offset (`mt-0.5` = 2px) for vertical alignment with the first line of caption-sized text. `shrink-0` prevents the icon from compressing if the message is long.

**Body styling:** `text-caption text-content-primary` — same typography as §14 Toast title (12px). The body color is `text-content-primary` (full opacity) regardless of variant — only the border + bg + icon convey the variant.

**Accessibility:**
- `role="alert"` — announced as an alert region by screen readers
- No `aria-live` set explicitly — defaults to `"assertive"` for `role="alert"` per ARIA spec (browsers + assistive tech handle this automatically)
- Unlike §14 Toast (transient), AlertBox stays in the DOM until the consumer removes it — so `role="alert"` is appropriate for the initial announcement; subsequent message changes inside the same AlertBox would NOT re-announce (this is browser/AT behavior, not a bug)

**When to use AlertBox vs sister alert components:**

| Use case | Component |
|----------|-----------|
| Persistent notice tied to current screen state (e.g., "MFA not enabled") | **§40 AlertBox** (this section) — inline-flex, no dismiss, body-only |
| Transient notification triggered by an action (e.g., "Saved successfully") | **§14 Toast** — top-of-viewport, auto-dismiss, hover-revealed close |
| Page-level error with optional dismiss + larger typography | **§41 ErrorAlert** — block, `text-body text-error`, optional dismiss button (composes §37 IconButton) |
| Form-control-level error message under a single field | **§42 InlineError** — minimal, no border/bg, `text-caption text-error` |
| Rate-limit lockout with countdown timer | **§43 RateLimitBanner** — composes §27 CountdownTimer |

**Token references:**
- Per variant: `--warning-border`, `--warning-bg`, `--color-warning`, `--error-border`, `--error-bg`, `--color-error`, `--info-border`, `--info-bg`, `--color-info`, `--success-border`, `--success-bg`, `--color-success`
- Body: `--content-primary`, `--text-caption`
- Spacing: `--space-2` (gap), `--space-3` (p), `--space-0.5` (mt for icon)
- Radius: `--radius-lg`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/AlertBox.tsx`
- Spec export: `alertBoxSpecs` (line 34)
- Cross-reference: §14 Toast (sister 4-variant alert with different position + persistence model — see comparison above); §41 ErrorAlert (sister error-specific component — different typography density + optional dismiss); §42 InlineError (sister field-level error)

---

### 41. ErrorAlert

Page-level error display — larger and more prominent than §40 AlertBox's `error` variant. Single `error` variant only (no other), `text-body` typography (not caption), optional dismiss button (composes §37 IconButton), and an **inline custom SVG** info-circle icon (NOT lucide). Used for top-of-form server errors, page-load failures, or any error that warrants more visual weight than a one-line caption.

> **Note:** This component does NOT export a spec object. Section content is sourced directly from the JSX (`ErrorAlert.tsx`, 50 lines). Future code-side cleanup could add `errorAlertSpecs` to align with the rest of the catalog.

| Property | Default | Type |
|----------|---------|------|
| `message` | — | `string` (required — null-renders when empty) |
| `onDismiss` | — | `() => void` (optional — when provided, renders dismiss IconButton) |
| `className` | `""` | `string` |

**Container styling:** `flex items-start gap-3 rounded-xl border border-error-border bg-error-bg p-4`. Block-level (`flex`, NOT `inline-flex` like §40 AlertBox) — fills the parent's width by default.

**Icon — inline custom SVG (NOT lucide):**
```svg
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" class="mt-0.5 shrink-0 text-error">
  <circle cx="12" cy="12" r="10" />
  <line x1="12" y1="8" x2="12" y2="12" />
  <line x1="12" y1="16" x2="12.01" y2="16" />
</svg>
```
- Visual: info-circle (circle outline + vertical line + dot) — same shape as `lucide/Info` but rendered as inline SVG
- Size: 20×20 explicit (NOT a token)
- Stroke: 1.5 (thinner than lucide's default 2 — more refined visual)
- Color: `text-error` (inherits via `currentColor`)
- Layout: `mt-0.5 shrink-0` — same vertical alignment trick as §40 AlertBox

> **Disclosure — inline SVG instead of lucide:** ErrorAlert is the only B8 component using a hand-coded SVG for its icon. Reasons could be: (a) predates the project's lucide adoption, (b) intentional `strokeWidth="1.5"` for a more refined look (lucide default is 2), (c) bundle-size optimization (skipping a lucide import for a single icon). Worth a code-side audit to either: convert to `<Info size={20} strokeWidth={1.5} />` from lucide for consistency, OR document the rationale and keep as-is.

**Body styling:** `flex-1 text-body text-error` — `text-body` (~14px), error color, fills remaining space. **Typography difference vs §40 AlertBox**: AlertBox uses `text-caption text-content-primary` (12px, neutral color); ErrorAlert uses `text-body text-error` (14px, error color). ErrorAlert visually screams "error" more loudly.

**Optional dismiss button:**
- When `onDismiss` is provided, renders `<IconButton variant="danger" size="sm" aria-label="Dismiss error"><X size={16} /></IconButton>` after the message.
- Composes §37 IconButton (first **B8 → B7** cross-cluster cross-reference).
- The X icon is `lucide/X` 16px (component renders via children).
- ARIA label `"Dismiss error"` is hardcoded — consumers cannot localize the dismiss tooltip text without overriding `aria-label`.

**Null-render guard:** `if (!message) return null` — prevents rendering an empty error box. Consumers can pass `error={null}` or `error=""` to conditionally hide without wrapper logic.

**Accessibility:**
- `role="alert"` — same announcement contract as §14 Toast / §40 AlertBox / §42 InlineError
- Dismiss button has `aria-label="Dismiss error"` (English only — see localization note above)

**When to use ErrorAlert vs sister components:** see comparison table in §40 AlertBox.

**Token references:**
- Container: `--error-border`, `--error-bg`
- Icon: `--color-error` (via `currentColor`)
- Body: `--color-error`, `--text-body`
- Spacing: `--space-3` (gap-3), `--space-4` (p-4), `--space-0.5` (mt for icon)
- Radius: `--radius-xl`
- Custom: `width="20" height="20"` SVG dimensions are explicit pixel values (NOT a token) — see SVG disclosure above

**Source:**
- Code: `nexacore-dashboard/src/components/ui/ErrorAlert.tsx`
- Spec export: **none** (JSX is the source of truth)
- Cross-reference: §37 IconButton (composes for dismiss button); §40 AlertBox (sister inline alert — different sizing + variant model — see comparison in §45); §42 InlineError (sister field-level error)

---

### 42. InlineError

Form-control-level error message — the smallest of the alert family. Used as the error slot by §19 FormField, and inline below any standalone form control where a per-field validation error needs to render. Single-line, no border, no background, just an icon + caption-sized text.

> **Note on promotion:** prior to B8, this component was documented inline in the Common Patterns "Input Field" section + cross-referenced from §19 FormField. Promoted to its own dedicated §47 section as part of B8 (SCRUM-341 / Option A canonicalization) for discoverability in the Components list. Common Patterns "Input Field" + §19 FormField cross-references now point here. Same canonicalization precedent as B4 Ambiguity 1 (deleted §9/§20 when §27 became canonical) and B7 Common Patterns Button cleanup.

| Property | Default | Type |
|----------|---------|------|
| `message` | — | `string` (required — null-renders when empty) |
| `className` | `""` | `string` |

**Container styling:** `flex items-center gap-2`. No border, no background, no padding — InlineError is meant to render directly under a form control without adding box-model weight.

**Icon:** `AlertTriangle` lucide 16px, `shrink-0 text-error`. Same icon as §40 AlertBox's `warning` variant — but here it indicates error (semantic difference: AlertBox uses warning for soft notices, InlineError uses AlertTriangle universally for any field error).

**Text:** `flex-1 text-caption leading-6 text-error` — caption size (12px), `leading-6` (24px line-height for vertical alignment with adjacent form controls' baseline), error color, fills remaining space.

**Null-render guard:** `if (!message) return null` — same pattern as §41 ErrorAlert. Pass `message=""` or `null` to conditionally hide without wrapper logic.

**Accessibility:**
- `role="alert"` — same announcement contract as §14 Toast / §40 AlertBox / §41 ErrorAlert
- The single-line caption format is appropriate for short field-validation messages ("Email is required", "Password must be at least 8 characters")

**Composition pattern (canonical use case — wrapped by §19 FormField):**
```tsx
<FormField label="Email" error={errors.email?.message}>
  <Input {...register("email")} error={errors.email?.message} />
</FormField>
```
The FormField renders InlineError below the control automatically when `error` is a non-empty string. The control itself (e.g., §16 Input) ALSO needs the `error` prop to apply its error-state outline — see §19 FormField composition rules.

**Standalone use** (without FormField): render InlineError directly anywhere a per-field error message is needed. Example:
```tsx
<Toggle checked={value} onChange={setValue} />
{error && <InlineError message={error} />}
```

**When to use InlineError vs sister components:** see comparison table in §40 AlertBox.

**Token references:**
- Icon + text: `--color-error`
- Spacing: `--space-2` (gap-2)
- Typography: `--text-caption`, `leading-6` (24px line-height)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/InlineError.tsx`
- Spec export: `inlineErrorSpecs` (line 5)
- Cross-reference: §19 FormField (canonical consumer — uses InlineError as the error slot); §40 AlertBox (sister inline alert — different sizing + 4-variant model); §41 ErrorAlert (sister error display — page-level instead of field-level)

---

### 43. RateLimitBanner

Inline rate-limit / lockout banner — error-themed icon + message + visible countdown timer. Composes §27 CountdownTimer (B5 cross-cluster reference). Used during auth throttling, MFA lockouts, or any "wait N seconds before retrying" UX. Self-managing internal timer with `onExpired` callback when the countdown reaches zero.

> **Note:** This component does NOT export a spec object. Section content is sourced directly from the JSX (`RateLimitBanner.tsx`, 58 lines). Future code-side cleanup could add `rateLimitBannerSpecs` to align with the rest of the catalog.

| Property | Default | Type |
|----------|---------|------|
| `retryAfter` | — | `number` (required — initial seconds remaining; component owns the countdown internally) |
| `message` | — | `string` (required — explanation text shown next to the timer) |
| `kind` | — | `RateLimitKind` (optional — `"lockout"` switches icon to `Lock`; otherwise `AlertTriangle`) |
| `onExpired` | — | `() => void` (optional — called once when `secondsLeft` reaches 0) |

The `RateLimitKind` type is defined in `@/lib/types` (verify type union members during /verify cross-ref check).

**Container styling:** `flex items-start gap-2`. No border, no background, no padding — same lightweight pattern as §42 InlineError. Renders inline within whatever container the consumer places it in (typically below a form or inside a §40 AlertBox-style wrapper if more visual weight is wanted).

**Icon (kind-based switch):**

| `kind` value | Icon (lucide) | Use case |
|--------------|---------------|----------|
| `"lockout"` | `Lock` 16px | Account locked after N failed attempts (more severe — implies the user must wait before any retry is possible) |
| `undefined` (or any other value) | `AlertTriangle` 16px | Soft rate limit (request throttled — retry possible after the timer) |

Both icons share styling: `mt-1 shrink-0 text-error`. The `mt-1` (4px) top offset aligns with the first line of the wrapped text+timer row.

**Body styling:** `flex flex-1 flex-wrap items-center gap-x-2 gap-y-1` — wraps when narrow (e.g., on mobile or in a sidebar). The CountdownTimer can drop to a second line below the message when there isn't enough horizontal room.

**Message:** `text-caption leading-6 text-error` — same typography as §42 InlineError, error color.

**CountdownTimer (composed — §32 cross-reference):** rendered inline next to the message **only when `secondsLeft > 0`**. After the countdown expires, the timer disappears (the message remains, then the parent typically unmounts the banner via the `onExpired` callback). Default §32 styling (small/error variant).

**Internal timer behavior:**

```tsx
const [secondsLeft, setSecondsLeft] = useState(retryAfter);

useEffect(() => {
  setSecondsLeft(retryAfter);  // resets when prop changes
}, [retryAfter]);

useEffect(() => {
  if (secondsLeft <= 0) {
    onExpired?.();
    return;
  }
  const timer = setInterval(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        clearInterval(timer);
        onExpired?.();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(timer);
}, [secondsLeft, onExpired]);
```

**Behavior notes:**
- `retryAfter` is a controlled INPUT — the consumer passes it once, and the component owns the countdown internally.
- If the parent updates `retryAfter` (e.g., a fresh server response with a new lockout duration), the internal timer resets via the first `useEffect`.
- `onExpired` fires both at the start (if `retryAfter <= 0` is passed) AND when the countdown actually reaches 0 — consumers should idempotent-handle the callback.
- The interval cleans up on unmount + on prop change (proper React effect lifecycle).

**Accessibility:**
- `role="alert"` — same announcement contract as the rest of the alert family
- The CountdownTimer updates every second — screen readers do NOT re-announce the role-alert region on every tick (browser/AT behavior). Only the initial render is announced.

**Use case examples:**
- **Auth throttling**: "Too many failed attempts. Try again in [00:30]." (kind=undefined, AlertTriangle icon)
- **MFA lockout**: "Account locked after 5 failed MFA attempts. Try again in [05:00]." (kind="lockout", Lock icon)
- **Generic 429 response**: "Rate limit exceeded. Please wait [00:15] before retrying." (kind=undefined)

**When to use RateLimitBanner vs sister components:** see comparison table in §40 AlertBox.

**Token references:**
- Icon: `--color-error`
- Message: `--color-error`, `--text-caption`, `leading-6`
- Spacing: `--space-2` (gap), `--space-1` (mt for icon), `--space-2` (gap-x in flex-wrap), `--space-1` (gap-y in flex-wrap)
- (Composed §27 CountdownTimer brings its own tokens — see §32)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/RateLimitBanner.tsx`
- Spec export: **none** (JSX is the source of truth)
- Type: `RateLimitKind` from `@/lib/types`
- Cross-reference: §27 CountdownTimer (composes — first **B8 → B5** cross-cluster reference); §40 AlertBox + §42 InlineError (sister inline alerts — see comparison in §45); §41 ErrorAlert (sister page-level error)

---

### 44. ThemeToggle

Theme switcher button — single-click toggle between light and dark themes. Composes §37 IconButton (`variant="boxed"`, `size="sm"`, `tooltip`) for the visual shell; provides Sun/Moon icon based on current theme. SSR-safe via deferred mount.

> **Note:** This component does NOT export a spec object. Section content is sourced directly from the JSX (`ThemeToggle.tsx`, 36 lines). Future code-side cleanup could add `themeToggleSpecs` to align with the rest of the catalog. Same disclosure pattern as §14 Toast, §39 ToastContainer, §41 ErrorAlert, §43 RateLimitBanner (B5+ JSX-only precedent).

> **Note on promotion:** prior to B9a, this component was documented inline in the `## Theme System (Light / Dark)` chapter as a sub-section ("Toggle Component" at line 126). **Promoted** to its own dedicated §49 section as part of B9a (SCRUM-343 / Decision 1 Option A) — discoverable in Components list now that §37 IconButton (its composer) is documented (B7). The Theme System chapter's "Toggle Component" sub-section now cross-references §49 for the canonical spec. Same canonicalization precedent as B4 Ambiguity 1, B7 Common Patterns Button cleanup, B8 InlineError promotion.

| Property | Default | Type |
|----------|---------|------|
| `className` | `""` | `string` (forwarded to the wrapping IconButton) |

That's the entire prop surface — ThemeToggle is opinionated and self-contained.

**Composition** (renders as):
```tsx
<IconButton
  variant="boxed"
  size="sm"
  tooltip
  onClick={toggleTheme}
  className={className}
  aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
>
  {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
</IconButton>
```

**Icons (lucide):**

| `theme` value | Icon shown | Next click switches to |
|---------------|------------|------------------------|
| `"light"` | `Sun` 16px | dark mode |
| `"dark"` | `Moon` 16px | light mode |

> **Drift note (vs prior Theme System docs):** prior "Toggle Component" sub-section described `sun-dim` (16x16) + `moon` (16x16) icons. Current code uses `Sun` (NOT `sun-dim`) and `Moon` from lucide. Doc now reflects code reality. The icon name change happened during a refactor that consolidated lucide imports — `sun-dim` was the old icon name; `Sun` is the canonical lucide name.

**Theme integration:**
- Uses `useTheme()` hook from `@/hooks/useTheme`, which provides `{ theme: "light" | "dark", toggleTheme: () => void }`
- The hook handles persistence (localStorage), DOM class toggle (`dark` class on `<html>`), and system-preference detection on first mount
- ThemeToggle is purely a view component — it reads `theme` to pick the icon and calls `toggleTheme` on click

**SSR-safe mounted state:**
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);
if (!mounted) return <div className={`h-8 w-8 ${className}`} />;
```
- **Why this pattern:** the `useTheme` hook reads from `localStorage` on first render. During SSR (where `localStorage` doesn't exist), the hook defaults to `"light"`. If we render the icon based on the SSR theme and then hydrate with the actual stored theme, the user sees a brief flash where the icon switches. The `mounted` state defers icon rendering until after hydration, so the placeholder div takes the same space (preventing layout shift) without committing to an icon until the real theme is known.
- **Placeholder dimensions:** `h-8 w-8` (32px × 32px) — matches the `IconButton size="sm"` rendered dimensions exactly. The `className` is forwarded so consumer-applied positioning (e.g., margins) still applies pre-mount.

**Accessibility:**
- **Dynamic aria-label**: ``Switch to ${theme === "light" ? "dark" : "light"} mode`` — describes the *action* (what clicking will do), not the current state. This matches the WAI-ARIA pattern for toggle buttons (label describes the action, not the current state).
- The §37 IconButton wrapper provides `tooltip` (uses `aria-label` as tooltip text — see §42), giving sighted users hover affordance and screen readers explicit label.
- The `boxed` variant of §37 IconButton supports `aria-pressed` toggle semantics — could be added in a future enhancement to make the pressed state visible (currently the icon-swap is the only visual cue of state).

**Use cases (from §37 IconButton's `usage` export):**
- AuthLayout header — "theme toggle" entry in the usage table at §42

**Token references:**
- All inherited from §37 IconButton (`variant="boxed"` styling) — no Theme System tokens applied directly here. The `Sun` / `Moon` icons inherit `currentColor` from the IconButton wrapper.

**Source:**
- Code: `nexacore-dashboard/src/components/ui/ThemeToggle.tsx`
- Spec export: **none** (JSX is the source of truth)
- Hook: `useTheme` from `@/hooks/useTheme`
- Cross-reference: §37 IconButton (composes — provides the visual shell + tooltip); `## Theme System (Light / Dark)` chapter (sibling — describes the broader light/dark token system that this component toggles between)

---

### 45. LanguageSelector

Borderless selector trigger with searchable popover. Used in footer / header contexts where the trigger sits among other text elements (subtle visual weight). Composes §28 Avatar (per-language code initial) and §16 Input (search filter). Smart 4-quadrant viewport-aware popover positioning. LocalStorage-backed persistence.

> **Note on promotion:** prior to B9a, this component was documented in the Common Patterns "Selector Trigger (Popover Pattern)" sub-section as the **Borderless** variant. **Promoted** to its own dedicated §50 section as part of B9a (SCRUM-343 / Decision 2 Option A) — alongside §46 EmailSelector for the Bordered variant. The Common Patterns sub-section was deleted (~90 lines removed) as canonicalization. Same precedent as B4 Ambiguity 1 (deleted §9/§20), B7 Common Patterns Button cleanup, B8 InlineError promotion.

| Property | Default | Type |
|----------|---------|------|
| `triggerClassName` | `""` | `string` (forwarded to the trigger button) |
| `triggerStyle` | — | `React.CSSProperties` (inline style for the trigger button) |

That's the entire prop surface — LanguageSelector is opinionated and self-contained: language list is hardcoded, persistence is automatic via localStorage.

**Trigger styling — shared box model:**
- Both states share: `flex h-10 items-center gap-2 px-4 text-body font-normal rounded-md transition-colors` — same h-10/px-4/rounded-md geometry to **prevent layout shift** when toggling open/closed.
- ChevronDown 16px after the language label (right side), `rotate-180 transition-transform duration-200` on open.

**Trigger states (Borderless variant):**

| State | Border | Background | Text color |
|-------|--------|------------|------------|
| **Closed** | `border-transparent` | `bg-transparent` | `text-content-primary/75` (opacity pattern reference) → `hover:text-content-primary` |
| **Open** | `border border-border-components` | `bg-surface-subtle` | `text-content-primary` |

> **Spec-vs-JSX minor drift:** `languageSelectorSpecs.trigger.open` describes `bg-surface-primary`, but the JSX uses `bg-surface-subtle` for the open state. Doc reflects the JSX (code reality). Worth a code-side reconciliation: either update the spec field to `bg-surface-subtle` or update the JSX to match the spec. The `bg-surface-subtle` choice integrates better with the open popover (shared subtle background creates visual continuity).

**Smart popover positioning (4 quadrants — viewport-aware):**

Computed at trigger-click time via `getBoundingClientRect()`:
- **Vertical**: `up` if `rect.top > popoverHeight (350px)` (footer context — popover would clip below) else `down`
- **Horizontal**: `right` if `rect.left + popoverWidth (330px) > window.innerWidth` (right-edge context — popover would clip right) else `left`

The `popoverHeight` (350px) and `popoverWidth` (330px) are hardcoded estimation values matching the typical popover dimensions (results card 240px max + search bar 56px + gaps).

**Popover container:** `absolute z-50 w-fit min-w-[200px]` — width sized to content with 200px floor. Positioning class derived from quadrant:
- `top-full mt-1` (down) or `bottom-full mb-1` (up) — 4px gap from trigger (mt-1/mb-1)
- `left-0` (left) or `right-0` (right) — alignment to trigger edge

**Popover content layout:**

| Direction | Order (top to bottom) | Rationale |
|-----------|------------------------|-----------|
| `down` | Trigger → Search → Results | Header context — natural top-down flow |
| `up` | Results → Search → Trigger | Footer context — search stays adjacent to trigger (closest element) for visual continuity. Implementation uses `flex-col-reverse` on the inner wrapper to flip order. |

The `animate-stagger` class on the inner content wrapper triggers a staggered entrance animation (search appears first, results appear second — see `globals.css` for the animation definition; first documentation in Part B).

**Search bar:**
- Composes §16 Input (variant=`"filled"`)
- `leftIcon`: `Search` lucide 16px (always visible)
- `rightIcon`: `X` lucide 12px (visible only when search has text — clears the input on click via `setSearch("")`)
- `ref` forwarded to the underlying input — auto-focused on popover open via `useEffect(() => { if (isOpen) searchInputRef.current?.focus(); }, [isOpen])`
- `className="shadow-card"` — adds shadow distinct from the parent popover container

**Results card:** `max-h-[240px] overflow-y-auto rounded-xl border border-border-components bg-surface-primary p-4 shadow-card` — scrollable list with `240px` max height.

**Option button (per language):** `flex h-10 items-center gap-2 rounded-md px-2 text-body font-normal transition-colors`. Same `h-10` + `px-2` for all options (denser than trigger's `px-4`).

**Option states:**

| State | Background | Text color |
|-------|------------|------------|
| Selected (matches `selected.code`) | `bg-surface-subtle` | `text-content-primary` |
| Default | `bg-transparent` | `text-content-primary` → `hover:bg-surface-subtle` |

**Option content:**
- §28 Avatar (`size="sm"`, `name={lang.code}`) — renders the 2-letter language code as initials (e.g., "EN", "ES", "FR") on a circular 32×32 avatar
- Language name: `truncate text-body` (e.g., "English (United Kingdom)")

**Empty state** (search filter returns no matches): `<p className="py-2 text-center text-body text-content-primary/50">No results</p>` — opacity pattern reference (10th occurrence territory).

**Hardcoded language list:**
```ts
const LANGUAGES: Language[] = [
  { code: "EN", name: "English (United Kingdom)" },
  { code: "ES", name: "Español (España)" },
  { code: "FR", name: "Français (France)" },
];
```
- The component is **not extensible** via props — adding languages requires editing the source file
- Each language has `{ code: string, name: string }`
- Filter operates on both `code` (case-insensitive) and `name` (case-insensitive)

**LocalStorage persistence:**
- Key: `STORAGE_KEY = "nexacore-language"` (constant)
- On mount: reads stored code, finds matching language in `LANGUAGES`, sets as selected
- On select: writes `lang.code` to localStorage, updates `selected` state, closes popover, clears search
- Hydration-safe: the initial `useState(LANGUAGES[0])` defaults to English; localStorage read happens in `useEffect` (post-mount)

**Click-outside dismissal:** `useEffect` registers a `mousedown` listener on `document` while open; clicking outside the `containerRef` closes the popover and clears the search.

**Accessibility:**
- Trigger is a native `<button>` — implicit button semantics
- Popover is NOT marked `role="dialog"` or `role="listbox"` — uses native button semantics for each option (could be enhanced to `role="listbox"` + `role="option"` + `aria-activedescendant` for full WAI-ARIA combobox pattern)
- Search input inherits §16 Input's accessibility (no explicit label here — placeholder "Search language..." doubles as label)
- Future enhancement: add `aria-expanded` to trigger; add ARIA combobox pattern for screen reader keyboard navigation through options

**Token references:**
- Trigger: `--content-primary` (at 75% — opacity pattern reference; at 100% — open + hover), `--border-components`, `--surface-subtle`, `--text-body`, `--space-10` (h-10), `--space-4` (px-4), `--space-2` (gap-2), `--radius-md`
- Popover container: `--surface-primary`, `--border-components`, `--radius-xl`, `--space-4` (p-4), `--shadow-card`
- Option: `--surface-subtle` (selected + hover), `--content-primary`, `--text-body`, `--space-10` (h-10), `--space-2` (px-2 + gap-2), `--radius-md`
- Empty state: `--content-primary` at 50% (opacity pattern), `--text-body`

**Source:**
- Code: `nexacore-dashboard/src/components/ui/LanguageSelector.tsx`
- Spec export: `languageSelectorSpecs` (line 21) — note minor spec-vs-JSX drift on `trigger.open` background (see disclosure above)
- Animation class: `animate-stagger` (defined in `globals.css` — verify class definition; first documentation in Part B)
- Cross-reference: §28 Avatar (composes for each option's code initial); §16 Input (composes the search bar with `variant="filled"`); §46 EmailSelector (sister Bordered selector — companion section)

---

### 46. EmailSelector

Bordered selector trigger with single-action dropdown — used in auth flows to re-display the selected email + provide an escape link to change it. Despite being named a "selector", it does NOT present a list of options to choose from — the dropdown shows the *currently selected email* as a non-interactive item plus a "Try a different email address" link button. Composes §28 Avatar (email initial) and §10 Button (escape link).

> **Note on promotion:** prior to B9a, this component was documented in the Common Patterns "Selector Trigger (Popover Pattern)" sub-section as the **Bordered** variant. **Promoted** to its own dedicated §51 section as part of B9a (SCRUM-343 / Decision 2 Option A) — alongside §45 LanguageSelector for the Borderless variant. The Common Patterns sub-section was deleted (~90 lines removed) as canonicalization. Same precedent as B4 Ambiguity 1, B7 Common Patterns Button cleanup, B8 InlineError promotion.

| Property | Default | Type |
|----------|---------|------|
| `email` | — | `string` (required — currently selected email address shown in trigger + dropdown) |
| `onChangeEmail` | — | `() => void` (required — fired when user clicks the "Try a different email address" link) |
| `className` | `""` | `string` (forwarded to the wrapping container — not the trigger itself) |

> **Naming note (single-action dropdown):** EmailSelector follows the visual pattern of a selector trigger (`button` + ChevronDown + dropdown) but has only **one action** in the dropdown — clicking the escape link to invoke `onChangeEmail`. There is no list of emails to choose from. The dropdown's primary purpose is *confirmation + escape* (re-show the entered email so the user can verify it, plus provide a way to back out). Worth keeping in mind when reading the JSX — it is structurally a dropdown but semantically a confirmation box with an escape hatch.

**Trigger styling — Bordered variant (always-visible border):**
- Layout: `flex h-10 items-center justify-center gap-2 rounded-md px-6 py-2.5 text-body font-normal whitespace-nowrap border border-border-components transition-colors`
- Note: `justify-center` and `whitespace-nowrap` — trigger sizes to content (no truncation, no fullWidth)
- ChevronDown 16px after the email label (right side), `rotate-180 transition-transform` on open

**Trigger states (Bordered variant):**

| State | Background | Text color |
|-------|------------|------------|
| **Closed** | `bg-transparent` | `text-content-primary` → `hover:bg-surface-subtle` |
| **Open** | `bg-surface-subtle` | `text-content-primary` |

The border is **always visible** (`border border-border-components` in both states) — distinguishes from §45 LanguageSelector's Borderless variant where the border only appears on open. Use Bordered when the selector should be a recognizable affordance even at rest (e.g., auth flows where users need to clearly see "this is my email — I can change it").

**Dropdown positioning (fixed downward — NO smart positioning):**
- `absolute left-0 top-full z-50 mt-1 w-[300px] animate-dropdown-down`
- Always opens **downward** + **left-aligned** to the trigger — unlike §45 LanguageSelector's 4-quadrant smart positioning
- Rationale: single use case is auth flows where the trigger is always in the same screen position (typically header area or below a step indicator), so smart positioning is overkill. Hardcoded width `w-[300px]` matches the typical auth card width.
- `animate-dropdown-down` class — globals.css animation (verify class definition; reused from other downward-opening dropdowns in the codebase)

**Dropdown container:** `rounded-xl border border-border-components bg-surface-primary p-4 shadow-card` — same container styling as §45 LanguageSelector's results card for consistency.

**Selected email display (non-interactive button):**
- Layout: `flex h-10 w-full items-center gap-2 rounded-md bg-surface-subtle px-2 text-body font-normal text-content-primary transition-colors`
- Renders as a `<button>` with `onClick={() => setOpen(false)}` (clicking it just closes the dropdown — no other behavior)
- §28 Avatar (`size="sm"`, `name={emailInitial}`) — first character of email uppercased, fallback `"?"` if email is empty
- Email text: `truncate text-body` — handles long emails gracefully

**Email initial extraction:**
```ts
const emailInitial = (email[0] || "?").toUpperCase();
```
- Single-character initial from the first character of `email` prop
- Fallback `"?"` if `email` is empty/undefined (defensive — prevents `Avatar` from receiving an empty `name`)
- Always uppercased for visual consistency in the avatar

**Action link (escape hatch):**
- Composes §10 Button (`variant="link-underline"`, `size="md"`, `fullWidth={false}`)
- Margin top: `mt-4` (16px from the selected email display)
- Label: `"Try a different email address"` (English-only — i18n enhancement pending)
- On click: closes the dropdown AND calls `onChangeEmail` callback (consumer typically resets the auth flow to the email-entry step)

**Click-outside dismissal:** `useEffect` registers a `mousedown` listener on `document` while open; clicking outside the `containerRef` closes the dropdown.

**Container positioning context:** `relative self-start` — the wrapping `<div>` uses `self-start` to opt out of any parent flex stretching. Required when EmailSelector is placed inside a flex column (common in auth layouts) — without it, the trigger would stretch full-width.

**Comparison with §45 LanguageSelector (sister selector primitive):**

| Aspect | §45 LanguageSelector | §46 EmailSelector |
|--------|----------------------|-------------------|
| **Visual variant** | Borderless (closed: transparent border + bg) | Bordered (closed: visible border + transparent bg) |
| **Dropdown content** | Searchable list of selectable options | Single-action confirmation + escape link |
| **Positioning** | Smart 4-quadrant (viewport-aware) | Fixed downward + left-aligned |
| **Composes** | §28 Avatar + §16 Input (search) | §28 Avatar + §10 Button (escape) |
| **Persistence** | LocalStorage (`STORAGE_KEY = "nexacore-language"`) | None — controlled by parent via `email` prop |
| **Use case** | Footer / header language switcher (browser nav) | Auth flow email confirmation + retry path |
| **Hardcoded data** | `LANGUAGES` array (3 entries) | None |

**Accessibility:**
- Trigger and selected-email display are both `<button>` — implicit button semantics
- Action link inherits §10 Button (`variant="link-underline"`) accessibility
- No explicit ARIA combobox/listbox pattern — appropriate since the dropdown is NOT a list of options
- Future enhancement: add `aria-expanded` to the trigger to communicate open/closed state to screen readers

**Token references:**
- Trigger: `--border-components`, `--surface-subtle` (open + hover), `--content-primary`, `--text-body`, `--space-10` (h-10), `--space-6` (px-6), `--space-2.5` (py-2.5), `--space-2` (gap-2), `--radius-md`
- Dropdown container: `--surface-primary`, `--border-components`, `--radius-xl`, `--space-4` (p-4), `--shadow-card`, `--space-1` (mt-1 from trigger)
- Selected display: `--surface-subtle`, `--content-primary`, `--text-body`, `--space-10` (h-10), `--space-2` (px-2 + gap-2), `--radius-md`
- Action link: inherits §10 Button `variant="link-underline"` tokens, `--space-4` (mt-4 from selected display)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/EmailSelector.tsx`
- Spec export: `emailSelectorSpecs` (line 8)
- Animation class: `animate-dropdown-down` (defined in `globals.css` — verify class definition)
- Cross-reference: §28 Avatar (composes for the email initial); §10 Button Set (composes the escape link); §45 LanguageSelector (sister Borderless selector — see comparison table above)

---

### 47. DataTable

Generic typed table primitive — accepts an array of any row type `T` plus a `ColumnDef<T>` array describing how to render each column. Built-in skeleton loading state, empty state, optional row-click handler, optional hover effect, alignment + custom width per column. Token-based throughout; horizontally scrollable when content overflows the container.

> **Note:** This component does NOT export a spec object. Section content is sourced directly from the JSX (`DataTable.tsx`, 122 lines). Future code-side cleanup could add `dataTableSpecs` to align with the rest of the catalog. Same disclosure pattern as §14 Toast, §39 ToastContainer, §41 ErrorAlert, §43 RateLimitBanner, §44 ThemeToggle (B5+ JSX-only precedent).

| Property | Default | Type |
|----------|---------|------|
| `data` | — | `T[]` (required — array of rows) |
| `columns` | — | `ColumnDef<T>[]` (required — column definitions) |
| `keyExtractor` | — | `(row: T) => string` (required — stable React key per row) |
| `loading` | `false` | `boolean` (renders skeleton rows instead of data) |
| `loadingRows` | `5` | `number` (skeleton row count when loading) |
| `emptyMessage` | `"No data found."` | `string` (rendered when `data.length === 0`) |
| `onRowClick` | — | `(row: T) => void` (optional — adds `cursor-pointer` to rows) |
| `hoverRows` | `true` | `boolean` (toggles `hover:bg-surface-subtle` on rows) |
| `headerRowClassName` | `""` | `string` (forwarded to `<tr>` of header) |
| `className` | `""` | `string` (forwarded to outer container) |

**Generic typing** — DataTable is parameterized as `DataTable<T>` (same pattern as §38 SegmentedControl). The `T` type flows through `data: T[]`, `columns: ColumnDef<T>[]`, `keyExtractor: (row: T) => string`, and `onRowClick?: (row: T) => void` — so a misaligned column `render(row)` call is a TS error at the call site.

**`ColumnDef<T>` interface** (exported):

| Field | Type | Purpose |
|-------|------|---------|
| `key` | `string` | Stable React key for the column (used in header + cell maps) |
| `label` | `string` | Header text (uppercased + tracking-wider via styling — pass mixed-case input) |
| `render` | `(row: T) => ReactNode` | Cell renderer — returns the body cell content |
| `width` | `string` (optional) | CSS width value (e.g. `"120px"`, `"20%"`) — applied to both `<th>` and `<td>` |
| `align` | `"left" \| "center" \| "right"` (optional, default `"left"`) | Text alignment for header + cells |
| `headerClassName` | `string` (optional) | Additional Tailwind classes for `<th>` |
| `cellClassName` | `string` (optional) | Additional Tailwind classes for `<td>` |

**Container styling:** `overflow-x-auto rounded-xl border border-border-strong bg-surface-primary`. The `overflow-x-auto` enables horizontal scroll on narrow viewports — required because `<table className="w-full">` may overflow when columns have fixed widths.

**Header row styling:**
- Row: `border-b border-border-strong bg-surface-secondary` + optional `headerRowClassName`
- Cell: `px-4 py-3 text-caption font-semibold uppercase tracking-wider text-content-tertiary` + alignment + `headerClassName`
- Width: applied via inline `style={{ width: col.width }}` when set

> **3rd opacity step disclosure (`text-content-tertiary`):** the header uses `text-content-tertiary` — the same 3rd opacity step beyond `text-content-primary/{30,50,75}` first surfaced in B8 §14 Toast close-button. Token name verification still pending: confirm whether `--color-content-tertiary` is formally defined or is a Tailwind-derived utility class. If formalized, this becomes the 11th occurrence to track in the coordinated migration scope alongside the [Display primitives opacity pattern](#display-primitives-opacity-pattern) (currently 10 occurrences across 4 clusters — same disclosure category, different opacity step).

**Body row styling:**
- Default: `border-b border-border-strong last:border-b-0`
- Hover (when `hoverRows={true}` — default): `transition-colors hover:bg-surface-subtle`
- Clickable (when `onRowClick` provided): `cursor-pointer` + the click handler fires with the row data

**Body cell styling:**
- Default: `px-4 py-3 text-body text-content-primary` + alignment + `cellClassName`
- Width: same `style={{ width: col.width }}` as header for column alignment

**Loading state** (when `loading={true}`):
- Renders `loadingRows` skeleton `<tr>` elements (default 5)
- Each skeleton cell: `<td className="px-4 py-3"><div className="h-4 rounded bg-surface-subtle animate-pulse" /></td>`
- `animate-pulse` is the Tailwind built-in pulsing-opacity animation
- Same border-bottom pattern as data rows

**Empty state** (when `data.length === 0` AND not loading):
- Single `<tr>` with full-width cell: `<td colSpan={columns.length} className="px-4 py-12 text-center text-body text-content-secondary">{emptyMessage}</td>`
- Distinct from §36 EmptyState (which is a standalone primitive with icon + title + description) — this is a minimal in-table fallback

**Use cases:**
- Project lists with sortable / clickable rows (consumer wires sort callbacks via column `render`)
- Settings tables (key/value pairs)
- Audit logs (timestamp + actor + action + details)
- Any tabular data display

**Token references:**
- Container: `--border-strong`, `--surface-primary`, `--radius-xl`
- Header: `--surface-secondary`, `--content-tertiary` (3rd opacity step — see disclosure above), `--text-caption`
- Body: `--border-strong`, `--content-primary`, `--text-body`, `--surface-subtle` (hover)
- Cells: `--space-4` (px-4), `--space-3` (py-3), `--space-12` (py-12 for empty state)
- Skeleton: `--surface-subtle`, `--space-4` (h-4)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/DataTable.tsx`
- Spec export: **none** (JSX is the source of truth)
- Exported interface: `ColumnDef<T>` (consumer must import for column definitions)
- Cross-reference: §36 EmptyState (sister empty-display primitive — different visual context, fuller layout); §37 IconButton (potential row-action composer in consumer code via column `render`)

---

### 48. StickyCard

Card primitive that **floats fixed to the viewport edge when scrolled past**, then returns to in-flow when scrolled back. Two positions (top / bottom). On mobile, the floating card collapses into a thin strip with a chevron toggle (saving viewport space); on desktop, the floating card stays fully expanded. IntersectionObserver-driven — no scroll listeners, no manual offsets.

> **Note:** This component does NOT export a spec object. Section content is sourced directly from the JSX (`StickyCard.tsx`, 225 lines). Future code-side cleanup could add `stickyCardSpecs` to align with the rest of the catalog. Same disclosure pattern as §14 Toast, §39 ToastContainer, §41 ErrorAlert, §43 RateLimitBanner, §44 ThemeToggle, §47 DataTable (B5+ JSX-only precedent).

| Property | Default | Type |
|----------|---------|------|
| `children` | — | `ReactNode` (required — card body content) |
| `position` | `"bottom"` | `"top" \| "bottom"` (which viewport edge to stick to when floating) |
| `className` | `""` | `string` (applied to the in-flow + desktop-floating wrappers; NOT to the mobile-collapsed strip) |

That's the entire prop surface. The component is opinionated: position is the only behavioral switch.

**Internal architecture — 2 sub-components** (StickyCardTop + StickyCardBottom, internal — not exported):
- The public `StickyCard` is a thin dispatcher that picks `StickyCardBottom` (default) or `StickyCardTop` based on `position`.
- Each sub-component owns its own `useState` for `isFloating` + `mobileExpanded` + `cardRect` (no shared state — they're isolated).
- The two sub-components share the same observation logic (IntersectionObserver + ResizeObserver) but differ in 6 places:

| Aspect | `StickyCardTop` | `StickyCardBottom` |
|--------|-----------------|---------------------|
| Floating position | `fixed top-0` | `fixed bottom-0` |
| Floating z-index | `z-10` | `z-30` |
| Floating border-radius | `rounded-b-xl` (rounds at the bottom — top edge flush with viewport) | `rounded-t-xl` (rounds at the top — bottom edge flush with viewport) |
| Mobile expanded order | icon (top) → content (below) | content (top) → icon (below) |
| Mobile chevron when expanded | `ChevronUp` (collapse hint = up) | `ChevronDown` (collapse hint = down) |
| Mobile chevron when collapsed | `ChevronDown` (expand hint = down) | `ChevronUp` (expand hint = up) |

**Default state (in-flow, not floating):** renders as `<div className="card-flat shadow-none">{children}</div>` — the `card-flat` CSS class (defined in `globals.css`) applies the standard card border + radius + padding, and `shadow-none` removes the default card shadow (since the in-flow card doesn't need elevation).

**IntersectionObserver-driven floating mode:**
```tsx
const observer = new IntersectionObserver(
  ([entry]) => {
    setIsFloating(!entry.isIntersecting);
    if (entry.isIntersecting) setMobileExpanded(false);
  },
  { threshold: 0.1 },
);
observer.observe(card);
```
- When card scrolls **out of viewport** (intersection ratio < 10%), `isFloating=true` triggers fixed-positioned floating clone.
- When card scrolls **back into viewport**, `isFloating=false` AND `mobileExpanded=false` (auto-collapse — prevents stale expanded state).
- Threshold `0.1` (10%) — small buffer prevents flicker when the card is barely visible at the edge.

**ResizeObserver tracks dimensions in real-time:**
```tsx
const resizeObserver = new ResizeObserver(() => updateRect());
resizeObserver.observe(card);
```
- The floating clone uses `style={{ left: cardRect.left, width: cardRect.width }}` to match the original card's position + width exactly (preserves visual continuity when the user scrolls back).
- ResizeObserver catches layout shifts (window resize, sidebar collapse, etc.).
- A separate `window.addEventListener("resize", updateRect)` runs only while `isFloating` (catches viewport resize specifically — covers cases ResizeObserver might miss).

**`minHeight` preservation** (prevents page jump):
```tsx
style={isFloating ? { minHeight: cardRect.height } : undefined}
```
- When floating, the in-flow placeholder keeps its original height — prevents the page below from jumping up when the card detaches.

**Floating styling:**
- Shared: `fixed [top|bottom]-0 z-[10|30] border border-border-strong bg-surface-primary shadow-card` + position-specific rounded corner
- Mobile collapsed strip: rounded corner + chevron toggle button (composes §37 IconButton variant=`default` size=`sm`)
- Desktop expanded: `p-6` + content (no chevron — desktop never collapses)

**Responsive branches** (Tailwind `sm:` breakpoint):
- **Mobile** (`sm:hidden`): renders the collapsed strip with chevron toggle. When `mobileExpanded=true`, also renders the children (with `p-6 pb-2` for bottom, `px-6 pb-4` for top).
- **Desktop** (`hidden sm:flex`): renders the always-expanded card with `p-6` — no chevron, no toggle state.

**Use cases:**
- Persistent action bar (e.g., "Save changes" buttons) that should stay visible while scrolling a long form
- Floating filters / search bar that should remain accessible during long-list scrolling
- Sticky table-of-contents on long article pages
- Any persistent UI that should stay one-tap-away without dominating the viewport

**Accessibility:**
- The mobile chevron button is a §37 IconButton with `aria-label={mobileExpanded ? "Collapse" : "Expand"}` — communicates the action (matches WAI-ARIA pattern from §44 ThemeToggle)
- The floating card itself has no special ARIA — it's a layout primitive, not a landmark
- Future enhancement: could add `aria-live="polite"` to announce when the card transitions to/from floating state (currently silent)

**Token references:**
- Default state: inherits from `card-flat` CSS class (see globals.css)
- Floating: `--border-strong`, `--surface-primary`, `--shadow-card`
- Mobile chevron: inherits from §37 IconButton
- Spacing: `--space-6` (p-6 desktop expanded, mobile expanded body)
- Z-index: `--z-10` (top), `--z-30` (bottom) — verify token definitions

**Source:**
- Code: `nexacore-dashboard/src/components/ui/StickyCard.tsx`
- Spec export: **none** (JSX is the source of truth)
- Internal sub-components: `StickyCardTop` + `StickyCardBottom` (both internal — not exported; share interface but distinct mobile/desktop branches as detailed above)
- CSS class: `card-flat` (defined in `nexacore-dashboard/src/app/globals.css` — verify class definition)
- Cross-reference: §37 IconButton (composes for mobile toggle — first **B9b → B7** cross-cluster cross-reference); §1 Card (sibling card primitive — same `card-flat` CSS class shared)

> **Note on the 2-sub-component pattern:** The decision to split into `StickyCardTop` + `StickyCardBottom` (rather than a single component with conditionals) was likely made because: (a) hooks ordering — both sub-components use `useState` + `useEffect` + `useCallback`, and a single component with conditional hook calls would violate React's Rules of Hooks; (b) clarity — the 6 distinct differences (position, z-index, radius direction, mobile order, expanded chevron, collapsed chevron) read more clearly as 2 implementations than as conditionals scattered through one. The trade-off: ~75 lines of near-duplicate code. A future refactor could extract a `useStickyState()` hook + a `<StickyShell>` render component to reduce duplication.

---

### 49. ImageCropper

Modal-based image cropping primitive — wraps `react-easy-crop` (external library) inside a §4 Modal with §12 Slider for zoom control. Outputs a JPEG blob (quality 0.9) via canvas extraction, plus a structured `CropData` object for layout-independent crop restoration. Default crop shape is round (matches §28 Avatar) at fixed 300×300 inside a 350×350 viewport. Used for avatar uploads + any single-image crop UX.

| Property | Default | Type |
|----------|---------|------|
| `open` | — | `boolean` (required — controls Modal visibility) |
| `imageSrc` | — | `string` (required — image URL or data: URI to crop) |
| `onCrop` | — | `(blob: Blob, cropData: CropData) => void` (required — fired on confirm) |
| `onClose` | — | `() => void` (required — fired on Modal dismiss) |
| `initialCropData` | — | `CropData` (optional — restores a previous crop's position + zoom) |
| `aspect` | `1` | `number` (crop area aspect ratio — `1` = square, `16/9` = wide, etc.) |
| `cropShape` | `"round"` | `"round" \| "rect"` |
| `loading` | `false` | `boolean` (propagates to ConfirmModal's loading state — disables Save while async work is in-flight) |

**Composition** (renders as):

```tsx
<ConfirmModal
  open={open}
  onClose={onClose}
  onConfirm={handleConfirm}
  title="Crop Photo"
  description="Drag to reposition and use the slider to zoom."
  confirmLabel="Save"
  size="lg"
  loading={loading}
>
  <div className="mt-4 space-y-4">
    <div className="relative mx-auto aspect-square w-[350px] overflow-hidden rounded-lg bg-surface-tertiary">
      {imageSrc && (
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={cropShape}
          cropSize={{ width: 300, height: 300 }}
          showGrid={false}
          /* ... */
        />
      )}
    </div>
    <Slider label="Zoom" value={zoom} onChange={setZoom} min={1} max={3} step={0.01} />
  </div>
</ConfirmModal>
```

**Composes §4 Modal** (via `ConfirmModal`, `size="lg"`) — first **B9b → B4** cross-cluster cross-reference. The Modal provides:
- Title + description in the header
- Save button (label "Save") that triggers `handleConfirm`
- Cancel button + outside-click + Escape — all dismiss via `onClose`
- `loading` state propagation — Save button disabled while `loading={true}`
- `size="lg"` — 720px max width, accommodates the 350px crop viewport + Slider with breathing room

**Composes §12 Slider** for zoom control — first **B9b → B2** cross-cluster cross-reference. Configured as:
- `label="Zoom"` (visible above the slider)
- `value={zoom}` + `onChange={setZoom}` (controlled component)
- `min={1}` (no zoom-out below 1×)
- `max={3}` (max 3× zoom)
- `step={0.01}` (smooth control — 200 steps total)

**External library — `react-easy-crop`:**
- 3rd external library documented in Part B (after `framer-motion` in B8 §19/§44 + `cmdk` in B4 §22 CommandPalette)
- npm package: `react-easy-crop` — provides the `Cropper` component + `Area` type
- Configured via:
  - `crop`: `{x, y}` position (controlled — managed by `useState`)
  - `zoom`: number (controlled — managed by `useState`, paired with §12 Slider)
  - `aspect`: from `aspect` prop (default `1`)
  - `cropShape`: from `cropShape` prop (default `"round"`)
  - `cropSize`: hardcoded `{width: 300, height: 300}` — the visible crop frame is always 300×300 px, regardless of `cropShape`
  - `showGrid={false}` — disables the rule-of-thirds grid overlay
  - `classes={{ cropAreaClassName: "cropper-crop-area" }}` — exposes a class hook for visual customization (verify CSS in `globals.css`)
  - `initialCroppedAreaPercentages={initialCropData?.areaPercent}` — restores a previous crop position
  - `onCropChange={setCrop}` + `onZoomChange={setZoom}` — controlled state callbacks
  - `onCropComplete={onCropComplete}` — fires after each crop change with `(areaPercent, areaPixels)` (both `Area` type from react-easy-crop)

**Crop viewport styling:** `relative mx-auto aspect-square w-[350px] overflow-hidden rounded-lg bg-surface-tertiary` — the 350×350 container is centered (`mx-auto`), squared (`aspect-square`), with 12px-radius corners and a tertiary-surface backdrop. The 300×300 crop frame sits inside, leaving 25px breathing room on each side for drag overflow.

**Output via canvas extraction:**
- On Save click → `handleConfirm` → `getCroppedImg(imageSrc, croppedAreaPixels)` (utility from `@/lib/crop-image`)
- The utility creates a canvas, draws the source image, extracts the crop region, and converts to a blob via `canvas.toBlob(blob => ..., "image/jpeg", 0.9)`
- **JPEG 0.9 quality** is hardcoded — non-obvious choice. PNG would preserve transparency but inflate file size; JPEG at 0.9 strikes a quality/size balance suitable for avatar uploads
- The `onCrop` callback receives the blob + the `CropData` object (consumer is responsible for upload + persistence)

**`CropData` type** (exported from the same file):

```ts
export type CropData = {
  /** Percentage-based crop area — used by initialCroppedAreaPercentages for restoration */
  areaPercent: { x: number; y: number; width: number; height: number };
  /** Pixel coordinates in the original image — used by getCroppedImg for canvas extraction */
  areaPixels: { x: number; y: number; width: number; height: number };
};
```

- **`areaPercent`** is layout-independent — works regardless of the source image's display size. Use this to persist + restore the user's crop position across sessions.
- **`areaPixels`** is in the source image's pixel coordinate space — required by `getCroppedImg` for canvas extraction. Re-derived from `areaPercent` on restoration; consumer can ignore if only persisting `areaPercent`.

**Use cases:**
- Avatar upload (default round crop, square aspect — pairs with §28 Avatar)
- Project cover images (override `aspect` + `cropShape="rect"` for non-square outputs)
- Any single-image crop step in a multi-step form (use `loading` while the parent uploads)

**Token references:**
- Crop viewport: `--surface-tertiary`, `--radius-lg`, `--space-[350px]` (custom width — non-token Tailwind arbitrary value, similar to B8 §39 ToastContainer's `px-[50px]`)
- Inner spacing: `--space-4` (mt-4 + space-y-4)
- All other styling inherited from §4 Modal (size=lg) + §12 Slider

**Source:**
- Code: `nexacore-dashboard/src/components/ui/ImageCropper.tsx`
- Spec export: `imageCropperSpecs` (line 10)
- Type export: `CropData` (consumer must import for restoration use cases)
- Library: `react-easy-crop` (npm — provides `Cropper` + `Area` type)
- Utility: `@/lib/crop-image:getCroppedImg` (handles the canvas extraction)
- Cross-reference: §4 Modal (composes — wrapper, `size="lg"`); §12 Slider (composes — zoom control); §28 Avatar (sister round-shape primitive — same circular crop result, ImageCropper output typically becomes an Avatar source)

> **Note on hardcoded values:** The `cropSize: {width: 300, height: 300}` and viewport `w-[350px]` are both hardcoded. Future enhancement could expose these as props (`cropSize` + `viewportWidth`) for non-avatar use cases (e.g., banner crops with rectangular viewports). For now, the component is opinionated for the avatar-crop use case.

> **Note on `cropShape="rect"` ambiguity:** When `cropShape="rect"` is set, `cropSize` is still 300×300 — meaning the rectangular crop is visually a 300×300 square (just without the round mask). To get a true rectangular crop area, both `aspect` AND `cropSize` would need adjustment — but `cropSize` isn't exposed as a prop. This is a partial-feature: `cropShape="rect"` removes the round mask but doesn't enable arbitrary rectangular crops. Worth a code-side audit to either fully implement rectangular crop sizing or document this limitation more prominently.

---

### 50. BeforeAfterSlider

Image comparison primitive — overlays two images (BEFORE + AFTER) with a draggable divider that reveals one or the other via CSS `clip-path`. 2 orientations (horizontal split, vertical split), 4 aspect ratios, 2 object-fit modes. Three composition slots: `before.label` clipped with the BEFORE image, `after.label` inverse-clipped (visible only where AFTER is exposed), `children` always visible (overlay). Touch-aware drag with multi-layer image-drag prevention. Composes Next.js `<Image>` (first time documented in Part B).

| Property | Default | Type |
|----------|---------|------|
| `before` | — | `Media` (required — `{src, alt, label?}`; the image revealed by the divider's BEFORE side) |
| `after` | — | `Media` (required — `{src, alt, label?}`; the base image always rendered behind) |
| `orientation` | `"horizontal"` | `"horizontal" \| "vertical"` (which axis the divider runs along — see "Orientation semantics" below) |
| `initialPosition` | `50` | `number` (0-100 — initial divider position as a percentage) |
| `aspectRatio` | `"4/5"` | `"4/5" \| "1/1" \| "16/9" \| "3/4"` (string union — see "Aspect ratios" below) |
| `objectFit` | `"cover"` | `"cover" \| "contain"` (image fit mode — see "Object fit" below) |
| `className` | `""` | `string` (applied to the outer container) |
| `children` | — | `ReactNode` (optional — always-visible overlay rendered above both clipped layers) |

The `Media` type (internal — not exported):
```ts
interface Media {
  src: string;
  alt: string;
  label?: ReactNode;
}
```

**Orientation semantics:**

| Orientation | Divider runs along | BEFORE is revealed where | AFTER is revealed where | Cursor on handle |
|-------------|---------------------|---------------------------|--------------------------|------------------|
| `horizontal` (default) | horizontal axis (left↔right line) | TOP of the divider | BOTTOM of the divider | `cursor-ns-resize` |
| `vertical` | vertical axis (top↔bottom line) | LEFT of the divider | RIGHT of the divider | `cursor-ew-resize` |

> **Naming note**: the prop is named after the divider's orientation, NOT the comparison direction. `orientation="horizontal"` produces a top-vs-bottom comparison; `orientation="vertical"` produces a left-vs-right comparison.

**Aspect ratios (string union mapped to Tailwind classes):**

| `aspectRatio` value | Tailwind class | Use case |
|----------------------|----------------|----------|
| `"4/5"` (default) | `aspect-[4/5]` | Portrait photos (mobile-first) |
| `"1/1"` | `aspect-square` | Square (Instagram-style) |
| `"16/9"` | `aspect-video` | Landscape photos / video previews |
| `"3/4"` | `aspect-[3/4]` | Slightly less narrow than 4/5 |

The mapping is hardcoded — adding a new aspect ratio requires editing both the type union AND the `aspectClass` lookup table inside the JSX.

**Object fit:**
- `cover` (default) — image fills the container, crops to match `aspectRatio`. Ideal for photos where framing is already good.
- `contain` — full image visible without cropping. Ideal for logos, diagrams, technical illustrations. Empty space around the image shows `bg-surface-tertiary` (the container background).

**Three composition slots** (rendered in this z-order, bottom to top):

1. **AFTER image** (full base layer): always rendered, never clipped, fills the container with `objectFit` mode. Carries the `after.alt` text for screen readers.
2. **BEFORE image** (clipped via divider position): rendered inside a `<div>` with `clipPath` set to `inset()` cropping. As the user drags the divider, the clip-path animates to reveal more or less of the BEFORE image. `before.label` (if provided) renders inside this same clipped container — visible only where the BEFORE image is visible.
3. **AFTER label** (inverse-clipped): rendered inside a separate `<div>` with the OPPOSITE `clipPath` — visible only where the AFTER image is exposed. Only rendered if `after.label` is provided.
4. **Divider line + handle**: 1px line at `top:position%` or `left:position%` with the 40×40 handle button centered on the line.
5. **`children` overlay**: always-visible content rendered above all clipped layers — never clips. Use for metadata badges, watermarks, etc.

**Clip-path technique** (the core mechanism):

| Orientation | BEFORE image clip-path | AFTER label clip-path |
|-------------|-------------------------|------------------------|
| `horizontal` | `inset(0 0 ${100 - position}% 0)` — clips from the BOTTOM by `(100 - position)%` | `inset(${position}% 0 0 0)` — clips from the TOP by `position%` |
| `vertical` | `inset(0 ${100 - position}% 0 0)` — clips from the RIGHT by `(100 - position)%` | `inset(0 0 0 ${position}%)` — clips from the LEFT by `position%` |

The two clip-paths are **complementary** — they always sum to the full container area. As `position` increases from 0 to 100, the BEFORE clip shrinks from the bottom/right while the AFTER label clip grows from the top/left (mirroring direction).

**Divider line + handle styling:**
- Line (horizontal): `pointer-events-none absolute inset-x-0 h-px bg-border-components` at `top:position%`
- Line (vertical): `pointer-events-none absolute inset-y-0 w-px bg-border-components` at `left:position%`
- Handle button: `pointer-events-auto absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border-components bg-surface-primary touch-none select-none ${cursorClass}`
- Arrow SVG inside handle: `h-4 w-4 text-content-primary/50` (opacity pattern reference) → `group-hover:text-content-primary` (full opacity on container hover). Path: stylized double-chevron `M7 8l5-5 5 5M7 16l5 5 5-5` (vertical arrows). For `vertical` orientation, the SVG is rotated 90° via `rotate-90` class to become horizontal arrows.

**Touch-aware drag:**
- Container: `touch-none` (Tailwind utility for `touch-action: none`) — disables browser default touch behaviors on the container
- Handle `onTouchStart`: `e.preventDefault()` — mirrors `onMouseDown` so swipe-aware parents (e.g. carousels using `e.defaultPrevented` as a bail signal) see `defaultPrevented=true` and skip their drag init
- Global `touchmove` listener: attached with `{passive: false}` so `preventDefault()` works (passive listeners can't preventDefault)
- Position update: `e.touches[0].clientX/Y` for touch events, `e.clientX/Y` for mouse events
- Listener lifecycle: `mousemove`/`touchmove`/`mouseup`/`touchend` attached only while `isDragging === true` (cleanup on drag end + on unmount)

**Image-drag prevention (3-layer defense)** — prevents the browser's native "drag image as ghost" behavior that would interfere with the slider drag:

1. `draggable={false}` on each `<Image>` element
2. `pointer-events-none` on every image layer (BEFORE container, AFTER base layer) — clicks pass through to the underlying handle
3. `onDragStart` on the container (`e.preventDefault()`) — final fallback if the browser still attempts a drag
4. `onMouseDown` on the handle (`e.preventDefault()`) — prevents text selection + image drag at the start of a slider drag

The 3 layers are belt-and-suspenders defense against subtle browser differences (Safari vs Chrome vs Firefox handle native image drag inconsistently).

**Animation behavior:**
- When NOT dragging: `transition: clip-path 300ms ease-out, top 300ms ease-out, left 300ms ease-out` — clicks on the container snap to position smoothly
- When dragging: `transition: none` — handle follows cursor instantly with no easing
- **First-click smoothness trick**: the handle's `onMouseDown` calls `updatePosition` synchronously THEN `requestAnimationFrame(() => setIsDragging(true))` — this lets the click-position transition complete one frame before drag mode disables transitions. Without this RAF wrap, the first click would feel jerky (instant snap with no easing).

**Why drag handlers live ONLY on the handle (not the container):**
On touch devices, dragging the image surface naturally means "scroll the page vertically". Putting drag handlers on the container would hijack that gesture — the page couldn't scroll past the slider. By scoping drag handlers to the small 40×40 handle, the user can scroll past the slider by touching the image area, and only initiates a slider drag by touching the handle specifically. **Same UX pattern as Apple Photos / Mapbox / Material Design** — referenced in the JSX comment at line 197-200.

**Use cases:**
- Before/after photo comparison (renovation, makeover, photo editing)
- Theme comparison (light vs dark — composes with §44 ThemeToggle as a marketing demo)
- Product comparisons (with vs without feature)
- Tutorial / how-to imagery (step N vs step N+1)

**Token references:**
- Container: `--surface-tertiary` (background), `--radius-xl`
- Divider: `--border-components`
- Handle: `--surface-primary`, `--border-components`, `--space-10` (h-10/w-10), `--radius-full`
- Arrow: `--content-primary` at 50% (opacity pattern reference) → 100% on hover, `--space-4` (h-4/w-4)

**Source:**
- Code: `nexacore-dashboard/src/components/ui/BeforeAfterSlider.tsx`
- Spec export: `beforeAfterSliderSpecs` (line 27)
- Internal type: `Media` (not exported — inferred from props)
- External library: Next.js `<Image>` from `next/image` — first time documented in Part B
- Cross-reference: §12 Slider (sister value-control primitive — different use case: position-as-percentage vs value-with-min/max); §28 Avatar (used by both as image-related primitive — composition example)

> **Note on the SVG arrow path:** The arrow is a hardcoded double-chevron SVG (`M7 8l5-5 5 5M7 16l5 5 5-5`) — NOT a lucide icon. Could be replaced with `lucide/ChevronsUpDown` (16px) for consistency with the rest of the codebase. Same disclosure category as B8 §41 ErrorAlert's inline custom SVG. Worth a code-side audit to either keep as-is (intentional minimalism / specific shape control) or convert to lucide.

> **Note on `aspectRatio` string-union prop:** The 4 hardcoded aspect ratios are an intentional restriction — adding a 5th requires editing both the TS type and the `aspectClass` lookup table inside the JSX. Future enhancement could accept a generic `string` (any Tailwind aspect class) at the cost of type safety. For now, the closed union catches typos at the call site.

> **Note on `text-content-primary/50` arrow color:** This is the **11th occurrence** of the [Display primitives opacity pattern](#display-primitives-opacity-pattern) (B6) — extends the coordinated migration scope from 10 (post-B9a) to 11. Inline cross-reference; B6 Pattern note table NOT modified (cluster-scope semantics preserved per B7/B8/B9a precedent — same as Calendar §4 in B9a).

---

## Common Patterns

### Auth Card Container (SCRUM-275)
Used by: Login Card, Register Card, and all auth status pages.
```
/* Outer card — #fbfbfb, holds footer area */
background: var(--surface-secondary)       /* #fbfbfb light / #242424 dark */
border: 1px solid var(--border-strong)     /* rgba(0,0,0,0.08) light / rgba(255,255,255,0.12) dark */
box-shadow: 0 8px 32px rgba(0,0,0,0.04)   /* subtle, invisible in dark mode */
border-radius: 24px
max-width: 750px
overflow: hidden
transition: height 300ms cubic-bezier(0.16,1,0.3,1)  /* smooth resize */

/* Inner container — white content area */
background: var(--surface-primary)         /* #ffffff light / #1a1a1a dark */
border-bottom: 1px solid var(--border-strong)  /* separator between content and footer */
border-radius: 24px 24px 0 0              /* top corners match card */
padding: 24px
gap: 24px

/* Footer — inherits card bg (#fbfbfb), no own fill */
padding: 8px
height: 56px
```

**Auth page background:** `var(--surface-tertiary)` — `#f2f2f2` light / `#2d2d2d` dark.

**Border rule for auth components:** ALL borders within auth pages use `border-strong` (`rgba(0,0,0,0.08)`) instead of `border-default` (`rgba(0,0,0,0.05)`). This applies to inputs, buttons, OAuth buttons, passkey, dividers, language selector, and email dropdown.

### Input Field

Composition pattern for form fields: label + control + error stack. For component-level details (variants, sizes, slots, states), see **§16 Input**. For the recommended wrapper that handles label + error layout, see **§19 FormField**.

**Composition rule:** form fields stack vertically as `label → control → error`, with `gap-2` (8px) between elements (per §19 FormField's container). The label uses `text-body font-semibold leading-[22px]`; the error message uses `InlineError` — see §42 InlineError for the canonical spec.

**Figma outline convention:** Figma strokes with `OUTSIDE` alignment and **2px** weight represent a CSS `outline: 2px solid` (not a border replacement). The default border remains unchanged; the outline is rendered with `outline-offset: 2px`. Figma cannot natively represent `outline-offset`, so the `OUTSIDE` stroke alignment is the closest visual approximation of the offset. This convention applies to all input-like primitives: §16 Input, §17 DateInput, §18 MfaDigitInput.

### Password Check (Auth Register)

Inline password strength indicator displayed in the System Message slot of the Register form. Shows 5 requirement icons; each displays a check badge when the requirement is met.

**Container:**
- Layout: `flex items-center gap-[15px]`, `shrink-0`, sits inside the 348×24px System Message row
- Total visual width: ~200px (5 × 24px icons + 4 × 15px gaps)

**Requirement Icon Box (per criterion):**
- Size: 24×24px, `rounded-lg` (8px), border 1px `#000000` 5%
- Icon size: 14×14px, color `#1c1c1c` 50% — **static, does not change when requirement is met**
- Icons (in order): `RulerDimensionLine` (length ≥ 8), `Hash` (number), `Asterisk` (special char), `CaseUpper` (uppercase), `CaseLower` (lowercase)

**Check Badge (appears when requirement met):**
- Size: 14×14px circle, `rounded-full`
- Position: `absolute -bottom-1 -right-1` (overlaps bottom-right of icon box)
- Background: `#ffffff` 100% (`bg-surface-primary`)
- Border: 1px `#000000` 5%
- Icon: `Check` 8×8px, color `#166534` **100%** (`text-green-800`) — `--color-success` light

**Error display (when error present, rendered after the Password Check):**
- Same pattern as all System Messages: `AlertTriangle` 16px at `--color-error` 100% + `<span>` at `--color-error` 100%

---

### Icons (Global)

All icons in the project use **lucide-react** at a fixed size of **16×16px**.

```
library: lucide-react
size: 16x16 (width={16} height={16})
stroke-width: 2 (lucide default)
color: inherits from parent text color
```

**Brand icons not available in lucide-react:**

| Brand | Figma uses | Code uses | Notes |
|-------|-----------|-----------|-------|
| Google | `lucide/chromium` (placeholder) | `GoogleIcon` (`@/components/icons/GoogleIcon`) | Custom monochrome SVG, uses `currentColor`, same API as lucide (`width`, `height`, `className`) |

When reading a Figma spec and encountering a `lucide/chromium` icon inside an OAuth or "Continue with" button, always map it to `GoogleIcon` in code — lucide does not have an official Google icon.

### Active/Inactive States
- Active: fill `#1c1c1c` (5% opacity) or `#1c1c1c` solid (for dropdown/buttons)
- Inactive: no fill or `#fbfbfb`
- Text active: `#1c1c1c` full opacity or `#ffffff` (on dark)
- Text inactive: `#1c1c1c` 40%-50% opacity

### Links / Text Links

**Common Properties (all link variants):**
- Font: Inter 14px / font-weight 500
- Line-height: 21px
- Color base: `#1c1c1c`
- Transition: `transition-colors`
- Cursor: pointer (inherent from `<a>` / `<Link>`)

**Link / Simple** (no text-decoration, dotted underline on pressed):

| State | Opacity | Decoration |
|-------|---------|------------|
| default | 75% | none |
| hover | 100% | none |
| pressed | 75% | underline dotted |
| disabled | 25% | none |

Use cases: Footer links, navigation links without hover underline

**Link / Underline** (underline on hover, dotted underline on pressed):

| State | Opacity | Decoration |
|-------|---------|------------|
| default | 75% | none |
| hover | 100% | underline |
| pressed | 75% | underline dotted |
| disabled | 25% | none |

Use cases: Action links (e.g. "Forgot password?", "Go back to the sign‑in screen.")

**Nav Link** (alias — same visual properties as Link / Simple, used in navigation contexts):

| State | Opacity | Decoration |
|-------|---------|------------|
| default | 75% | none |
| hover | 100% | none |
| pressed | 75% | underline dotted |
| disabled | 25% | none |

Use cases: Footer links (Help, Privacy, Terms), Go back to Home Page

### Decorative Background Grid (Auth Pages)

A set of thin structural lines that form a subtle grid behind auth page content. Implemented once in `AuthLayout` via the `AuthGridLines` component. Figma layer: **"Frame BG Lines"**.

**Spec:**
- Stroke: `#000000` at 8% opacity, 1px — matches `var(--border-strong)` (updated SCRUM-275)
- Lines are full-width (horizontal) or full-height (vertical)
- Positioned with CSS percentages derived from the 1440×1024 Figma artboard
- `aria-hidden="true"`, `pointer-events-none`

**Horizontal lines (2):**

| Name   | Figma y | CSS top  |
|--------|---------|----------|
| Line 5 | 97px    | 9.47%    |
| Line 8 | 820px   | 80.08%   |

**Vertical lines (6):**

| Name   | Figma x | CSS left |
|--------|---------|----------|
| Line 1 | 149px   | 10.35%   |
| Line 7 | 189px   | 13.13%   |
| Line 2 | 306px   | 21.25%   |
| Line 3 | 1142px  | 79.31%   |
| Line 4 | 1180px  | 81.94%   |
| Line 6 | 1351px  | 93.82%   |

**Implementation:** `src/components/auth/AuthGridLines.tsx` — a pure presentational component rendered inside the `relative` wrapper of `AuthLayout`.

---

### Auth Page Animations (SCRUM-275)

All animations are CSS-only (no external dependencies). Defined in `globals.css`.

**Easing curve:** `cubic-bezier(0.16, 1, 0.3, 1)` (expo ease-out) — used consistently across all auth animations.

#### Card Entrance (`auth-card-enter`)
Triggered on page load / route change. Card fades in and slides up.
```
@keyframes auth-card-enter {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
Duration: 400ms
```
- Applied to `.auth-card` and `GoBackSection` (with 120ms delay)

#### Step Transitions (`auth-step-forward` / `auth-step-back`)
Triggered when LoginForm switches between email and password steps. Reuses `auth-card-enter` keyframes.
```
Duration: 300ms
```

#### Card Smooth Resize
When content height changes (step switch, error messages), the card animates its height.
```
transition: height 300ms cubic-bezier(0.16, 1, 0.3, 1)
overflow: hidden
```
Implemented via `ResizeObserver` in `AuthLayout.tsx` — watches content wrapper, sets explicit `height` on card div.

#### Status Icon — Success (`icon-success`)
Used on verify-email success. Elastic scale bounce.
```
@keyframes icon-success {
  0%   { opacity: 0; transform: scale(0.3); }
  50%  { opacity: 1; transform: scale(1.08); }
  70%  { transform: scale(0.96); }
  100% { opacity: 1; transform: scale(1); }
}
Duration: 500ms
```

#### Status Icon — Error (`icon-error`)
Used on verify-email error. Scale-in then horizontal shake.
```
@keyframes icon-error {
  0%   { opacity: 0; transform: scale(0.5); }
  40%  { opacity: 1; transform: scale(1); }
  50%-90%  { translateX: -6px → 5px → -4px → 3px → -1px → 0 }
  100% { transform: translateX(0); }
}
Duration: 600ms
```

---

### Icon Color Conventions (SCRUM-275)

All 16x16 lucide icons follow these color rules:

| Context | Color | Notes |
|---------|-------|-------|
| Button icons (OAuth, passkey) | `text-content-primary/50` | 50% opacity |
| Nav/footer icons (house, chevron) | `text-content-primary/75` | 75% → 100% on hover |
| Theme toggle (sun/moon) | `text-content-primary/50` | 50% → 100% on hover |
| Error icons (alert triangle) | `text-error` | 100% (#8a1111 light / #ef4444 dark) |
| Status success (circle check) | `#166534` | Fixed green |
| Status error (circle x) | `#8a1111` | Fixed red |
| Default strokeWidth | `2` | Lucide default, matches Figma |

---

### Loading, Empty & Error State Patterns (SCRUM-352)

**Source**: `ai-specs/changes/dashboard/audit/loading-empty-states-2026-05-12/audit-table.md` (Phase A audit).
**Binding**: all dashboard code must comply. Sub-tickets B1-B6 (SCRUM-403 to SCRUM-408) cover existing violations.

#### Empty states

| Surface | Rule |
|---------|------|
| List / grid / card-feed (NO table) | Use `<EmptyState icon={...} title="..." description="..." action={...} />`. NEVER inline `<p>` text. |
| Table with no rows | Use `DataTable`'s `emptyMessage` prop. DataTable internally is expected to render that empty cell with `<EmptyState>` styling once SCRUM-407 (B5) lands. |
| Card / modal with no items | Use `<EmptyState>` always. |
| Section header collapsed with no children | Inline subtle hint OK (e.g., "—" or italic "None") — no full EmptyState. |

Decision rule: **if the empty area occupies ≥48px vertical space or is the primary content of the page, use `<EmptyState>`. Smaller hints can stay inline.**

#### "No data" vs "failed to load"

| State | Component / Pattern |
|-------|---------------------|
| No data (success, empty result) | `<EmptyState icon={Inbox\|...} title="No X yet" description="..." action={<Button>...} />` |
| Failed to load (error) | `<EmptyState variant="error" icon={AlertTriangle} title="Couldn't load X" description={errorMessage} action={<Button onClick={retry}>Retry</Button>} />` — `variant="error"` lands in SCRUM-408 (B6). |
| Loading (in-flight) | Section/page loader per next subsection; NOT EmptyState. |

#### Section / page loaders

| Surface | Rule |
|---------|------|
| Layout is known (table rows, fixed card grid) | **Skeleton rows / skeleton cards**. `DataTable` already implements `SkeletonRow`; list/grid components should mirror. |
| Layout is unknown (initial app boot, route transition, async page-level data) | **Centered `<Spinner size="lg" aria-label="..." />`** vertically centered in container. **NO bare `<p>Loading...</p>` text.** |
| Background polling / soft refresh (data already shown, user-initiated refresh) | **Inline `<Spinner size="sm" />`** next to refresh affordance; content stays. |

`<p>Loading...</p>` inline text is **forbidden** as a primary loading indicator. It is allowed only as fallback aria-label content for screen-readers, never as visual.

#### Button loaders (`<Spinner>` vs `<InfinitySpinner>` vs `<RingSpinner>`)

| Action type | Variant | Rationale |
|-------------|---------|-----------|
| Deterministic action (Submit, Save, Delete, Send) — finite duration | **`<Spinner>`** (CSS-ring) | User has clear "this will complete" expectation; circular implies progress toward known end. |
| Indeterminate action (Sync, Search, Polling, Background fetch) | **`<InfinitySpinner>`** | Loop signals "ongoing, no defined end". |
| Decorative / branding spinner (login redirect splash, etc.) | **`<RingSpinner>`** | Reserved for non-action UI. |

`<Button>`'s `loading` prop should pick the variant per action type. SCRUM-405 (B3) consolidates the rule in `Button.tsx`.

#### Table loaders

| Surface | Rule |
|---------|------|
| Initial table load | **Skeleton rows** (`<SkeletonRow>` matching column count). DataTable ✓. |
| Refresh of already-shown table | **Inline spinner in toolbar/header**, table content stays. |
| Pagination / filter change | **Skeleton rows** for the new page. |
| Table-wide error | DataTable accepts an `error` prop → renders `<EmptyState variant="error">` inside tbody. Implementation in SCRUM-407 (B5) + SCRUM-408 (B6). |
