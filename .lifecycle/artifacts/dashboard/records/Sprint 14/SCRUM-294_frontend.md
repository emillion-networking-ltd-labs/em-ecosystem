# SCRUM-294 — Implementation Record

## Ticket
**SCRUM-294**: Design System showcase polish — auth token alignment & component documentation

## Execution
- **Sprint**: 14
- **Date**: 2026-03-22 to 2026-03-25
- **Commits**: 10 total

| Phase | Commit | Description |
|-------|--------|-------------|
| Phase 1 | `6b842c7` | Initial showcase polish, token alignment, 38 files |
| Breadcrumbs | `f95846c` | Breadcrumbs typography — font-normal, tracking-wide, en-dash/em-dash |
| Phase 2 | `c9bef70` | Geist font, font-medium→font-normal, card types, chart tooltip |
| Phase 3 | `ae1e12c` | Token rename (heading→h1), dropdown shadows, stagger animation |
| Auth align | `92dadf9` | Auth buttons text-h3→text-body (14px consistency) |
| Letter-spacing | `02fbfd7` | Global letter-spacing system (h1:-0.01em, body:+0.01em, caption:+0.02em) |
| Phase 4 | `2ebde04` | DataTable integration, dynamic Spinner specs, Accordion rounded-md |
| Phase 5 | `2197bba` | Select/Dropdown alignment, designTokens export, font:inherit global |
| Phase 6 | `70ea696` | Component verification, useAutoPlacement tooltip system, overflow dots |
| Phase 7 | `f2de8fa` | Tokens cards, catalog consolidation (31→19), heading hierarchy, system font |

## Scope
FRONTEND — ~200 files touched across 7 commits

## Changes Summary

### Token Alignment (28 UI components)
- `border-default` → `border-strong` (8%)
- `text-content-tertiary` → `text-content-primary/50`
- `hover:bg-hover` → `hover:bg-surface-subtle`
- `font-bold` → `font-semibold`
- `bg-white` → `bg-surface-primary`
- `shadow-avatar` removed
- `shadow-card` removed from 24 files, restored as Tailwind utility with auth value

### Typography
- Inter → Geist Sans (geist package)
- `font-medium` (500) → `font-normal` (400) across all files (GitHub 400/600 pattern)
- Auth buttons: `text-h3` (16px) → `text-body` (14px) for Button md consistency
- Global letter-spacing: body +0.01em, h1/h2 -0.01em, caption +0.02em
- Breadcrumbs: font-normal, en-dash/em-dash separators

### Card System (4 types)
- `card-container` (24px radius, shadow)
- `card-container-flat` (24px radius, no shadow)
- `card` / inner (12px radius, shadow)
- `card-flat` / inner-flat (12px radius, no shadow)

### Showcase Improvements
- Tables refactored from inline HTML to `<DataTable>` component
- DataTable: added `hoverRows` and `headerRowClassName` props
- Dynamic specs: Spinner, InfinitySpinner, RingSpinner export specs
- Heading hierarchy: h2(20px) → h3(16px) → body(14px) → caption(12px)
- Card showcase: light/dark containers with grid 2x2

### Chart Tooltip
- Custom React tooltip with diamond arrow (Tooltip.tsx structure)
- `useAutoPlacement.ts`: reusable flip+shift algorithm for viewport edge detection
- Both Line Chart and Doughnut use createPortal(document.body) + computePlacement()
- Geist font for Chart.js
- clip: false, instant point hover
- Chart ticks: 14px (match Calendar)

### Radius Unification
- Dropdowns: `rounded-xl` container, `rounded-md` triggers/options
- Accordion: `rounded-xl` → `rounded-md`
- Nav tabs: `rounded-md`
- ChartCard: `rounded-xl`

### Layout
- DashboardLayout: `max-w-[1200px] mx-auto` content area
- Design System page: title + divider + breadcrumbs inline
- LanguageSelector: stagger fade-in animation, triggerClassName prop, corner-grow animation for auth

### Select / Dropdown Alignment
- Select trigger: text-content-primary/75 normal, hover:text-content-primary (match Link Button)
- Select options: px-6 py-2.5 h-10 text-body font-normal (match Button outline md)
- Select dropdown: shadow-card added to JSX
- LanguageSelector: Avatar component for option icons
- designTokens exported from tailwind.config.ts — TokenInspector auto-updates
- Global CSS: font:inherit for button/input/select/textarea (Geist Sans propagation)

### Overflow & Scroll System
- ScrollDotsWrapper: ResizeObserver auto-detect overflow → show dots
- Dots: h-[9px] w-[9px] clickable with scrollIntoView
- Drag-to-scroll: mouse + touch with cursor grab/grabbing
- Applied to nav-horizontal tabs in showcase + Design System page

### Component Fixes
- Input: sm/md sizes (40px/48px), variant default/filled
- Slider value: `text-content-secondary` → `text-content-primary/50`
- Tooltip: `rounded-xs` → `rounded-lg` (match chart tooltip)
- LoginForm email selector: `rounded-md` trigger, `rounded-xl` dropdown
- Toast close: `text-content-secondary` → `text-content-primary/50`
- Toast texts: real auth messages
- DataTable empty: `text-content-secondary` → `text-content-primary/50`
- Breadcrumbs separator: `text-body` → `text-caption` (12px)
- Tabs: remove solid variant, default → nav
- Redundant leading-[21px] and leading-[36px] removed (~28 files)

## Deviations
| Type | Description |
|------|-------------|
| Accepted-Trivial | Slider thumb bg-white hardcoded (pseudo-elements) |
| Accepted-Trivial | ErrorAlert.tsx kept (cleanup pending) |

## Related Tickets
- **SCRUM-296**: Typography scale unification (Done — commit `28fa4cc`)
- **SCRUM-297**: Migrate auth inline elements to components (To Do — 24 buttons, 2 checkboxes, 5 inputs, 1 dropdown, feedback components)
- **SCRUM-298**: Migrate Chart.js (canvas) to Recharts (SVG) for rendering consistency (To Do)

## Test Results
- 1011/1011 tests passing across all commits
- TypeScript: 0 errors
- Pre-push hooks: PASS
