# SCRUM-294 — Design System Showcase Polish (Retroactive Plan)

## Scope: FRONTEND

## Objective
Align all Design System showcase components to auth-verified design tokens, add comprehensive light/dark previews, dynamic specs, and interactive demos.

## Steps

### 1. Component Token Alignment
- Replace `text-content-tertiary` → `text-content-primary/50` across all UI components
- Replace `border-border-default` → `border-border-strong` across all UI components
- Replace `hover:bg-hover` → `hover:bg-surface-subtle`
- Replace `font-bold` → `font-semibold`
- Replace `bg-white` → `bg-surface-primary` (except Slider pseudo-elements)
- Remove `shadow-avatar` (non-existent token)

### 2. Button Section
- Add Link Buttons table (simple, underline, underline+icon) with active states
- Add Icon Buttons table (default, input, boxed)
- Add Circle button variant (calendar days)
- All in table format matching standard buttons
- Dynamic specs from exported constants

### 3. Component Showcases (Atoms)
- Each component: light/dark mode side by side
- Badge: 3 sizes (lg/md/sm) with all 5 variants
- Spinner: 3 types unified to sm/md/lg
- Avatar: 3 sizes, 3 fallback types
- Toggle/Checkbox: interactive states + 3 sizes
- Slider: auth-aligned thumb (border-solid fix for pseudo-elements)
- Accordion: new component created
- All with SpecsPanel (dynamic exports)

### 4. Component Showcases (Molecules)
- Select/Dropdown: 3 variants (Select, Email Selector, LanguageSelector) with auto edge detection
- Tabs: solid/nav/nav-horizontal variants, 3 sizes, mobile scroll+dots
- Navigation: Breadcrumbs (auto-collapse ResizeObserver) + Pagination (Button primary/outline)
- DataTable: unified header with bg-surface-secondary
- Feedback/Alerts: inline, boxed, rate limit (animated countdown), toast (4 variants interactive fixed-position), full page cards (error/success with hover animation)
- Charts: TotalUsersChart (real Chart.js, dark mode adaptive), DoughnutChartMock (Chart.js), SpeedometerChart (SVG, 3 sizes)
- Calendar: 3-level navigation (days→months→years)

### 5. Token Inspector
- Auth-verified colors section (13 tokens + opacity variants)
- Available (not in auth) section at 60% opacity
- Typography from auth patterns (heading, button, label, input, link, error, technical)
- Spacing from auth usage only
- Radius from auth usage only (md, lg, 3xl, full)
- Shadow: card/dropdown unified

### 6. Design System Page
- nav-horizontal tabs with icons
- Mobile: scroll+dots for tabs
- Accordion filter for catalog categories
- Clickable catalog cards → navigate to component section
- Removed Templates tab
- .light/.dark CSS classes for isolated theme previews

### 7. Global CSS Updates
- `.card` class: border-strong, shadow auth-card, radius 24px
- `.light` class: force light tokens inside dark page
- `.dark` class: propagate color for currentColor inheritance
- `scrollbar-hide` utility
- `animate-dropdown-down/up` animations (150ms ease-out)

### 8. Component Fixes
- Button: border-strong, hover:bg-surface-subtle (outline), InfinitySpinner for loading
- Input: min-w-0 on input element
- Toggle: bg-surface-tertiary (off), bg-surface-primary (circle)
- Checkbox: 3 sizes (sm/md/lg)
- Tabs: 4 variants, 3 sizes, separator borders, nav with ChevronRight
- Select: no-border trigger, auto position detection, dropdown animation
- LanguageSelector: auto position detection (4 edges), direction prop removed
- Calendar: 3-level nav, circle buttons, font-semibold label
- Pagination: Button primary/outline style
- Breadcrumbs: auto-collapse ResizeObserver, auth link colors
- DataTable: rounded-xl, bg-surface-secondary header, no shadow
- Spinner: border-border-strong + border-t-content-primary (semantic tokens)
- Slider: bg-surface-inverse fill, border-solid for pseudo-elements
- ChartCard: bg-surface-primary, rounded-3xl
- TotalUsersChart: useTheme() dark mode, interaction mode index, labelColor callback

## Files Changed
~40 files across components/ui/, components/admin/, components/dashboard/, app/admin/design-system/, app/globals.css, lib/component-registry.ts

## Acceptance Criteria
- All UI components use only auth-verified tokens
- Every showcase section has light/dark previews
- Dynamic specs update when component code changes
- Interactive demos (toasts, countdown, charts) work correctly
- Catalog cards navigate to correct component section
- Token Inspector shows auth-verified vs unused separation
