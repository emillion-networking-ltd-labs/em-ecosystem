# Frontend Implementation Plan: SCRUM-240 — Eliminate CSP unsafe-inline for style-src

## Overview

Eliminate `unsafe-inline` from CSP `style-src` by migrating recharts to Chart.js (canvas-based, no inline styles), converting inline `style={}` attributes to Tailwind classes, and converting `global-error.tsx` to a nonce-based `<style>` block. This hardens the application against CSS injection attacks (CWE-79, OWASP ASVS V14.4.3).

## Codebase State (2026-03-15)

- **Last completed ticket**: SCRUM-239
- **Files verified against live code**:
  - `nexacore-dashboard/src/middleware.ts` (61 lines) — CSP `style-src 'self' 'unsafe-inline'` at line 21, nonce generated at line 4, set in `x-nonce` header at lines 36/45
  - `nexacore-dashboard/src/app/layout.tsx` (29 lines) — Server component, `dangerouslySetInnerHTML` for theme script (no nonce currently)
  - `nexacore-dashboard/src/app/global-error.tsx` (129 lines) — Client component (`"use client"`), 10+ inline style objects
  - `nexacore-dashboard/src/components/dashboard/TotalUsersChart.tsx` (92 lines) — recharts LineChart, Tooltip contentStyle at lines 64-69
  - `nexacore-dashboard/src/components/dashboard/MarketingSeoChart.tsx` (75 lines) — recharts BarChart, Tooltip contentStyle at lines 57-62, Cell colors array
  - `nexacore-dashboard/src/components/dashboard/TrafficByDeviceChart.tsx` (67 lines) — recharts BarChart, Tooltip contentStyle at lines 49-54, Cell with entry.color
  - `nexacore-dashboard/src/components/dashboard/TrafficByLocationChart.tsx` (60 lines) — recharts PieChart, Tooltip contentStyle at lines 33-38, legend dot `style={{ backgroundColor: item.color }}` at line 49
  - `nexacore-dashboard/src/components/dashboard/TrafficByWebsiteChart.tsx` (38 lines) — No recharts, dynamic `style={{ width: ... }}` at line 29
  - `nexacore-dashboard/src/components/dashboard/ChartCard.tsx` (25 lines) — Wrapper component, no inline styles
  - `nexacore-dashboard/src/components/auth/AuthGridLines.tsx` (29 lines) — 8 positional `style={}` attributes (top/left percentages)
  - `nexacore-dashboard/src/components/layout/AuthLayout.tsx` (78 lines) — 3 conditional `style={}` attributes (maxWidth, overflow, borderRadius, height)
  - `nexacore-dashboard/src/components/ui/InfinitySpinner.tsx` (61 lines) — 1 SVG transform `style={}` at line 55
  - `nexacore-dashboard/package.json` — `recharts: ^3.7.0` in dependencies
- **Discrepancies with integration-state.md**: None (frontend-only ticket)

## Architecture Context

### CSP Nonce Infrastructure

The nonce is already generated per-request in `middleware.ts` and propagated via the `x-nonce` header. It's already used for `script-src` but NOT for `style-src`. The nonce can be read in server components via `headers()` from `next/headers`.

**Key constraint**: `global-error.tsx` is a `"use client"` component — it cannot call `headers()`. However, as a Next.js error boundary, it receives the full HTML shell. The solution is to inject the nonce into the `<style>` tag from the server-side layout, or use a `<style>` tag with the nonce passed as a prop from the error boundary's rendering context.

**Alternative approach for global-error.tsx**: Since this is the last-resort error page that renders when the CSS bundle may be broken, and it's a client component, we can use a different strategy — extract its styles to `globals.css` with dedicated class names. The CSS file is loaded via `<link>` which is allowed by `style-src 'self'`. This is simpler and more reliable than nonce injection for this specific case.

### Recharts → Chart.js Migration

recharts renders SVG with inline styles (tooltips, legends, axis labels). Chart.js renders to `<canvas>` which draws pixels directly — no DOM style attributes, fully CSP-compatible. The wrapper library `react-chartjs-2` provides React component bindings.

### Dynamic Inline Styles

Some components use `style={}` for truly dynamic values (computed percentages, data-driven colors). Two strategies:
1. **Static positions** (AuthGridLines): Convert to Tailwind arbitrary values `top-[9.47%]`
2. **Dynamic data-driven values** (TrafficByWebsiteChart width, TrafficByLocationChart colors): These are safe to keep as inline styles IF the values come from hardcoded data (not user input). However, for full CSP compliance, we should use CSS custom properties set via `className` with Tailwind arbitrary values where possible, or accept a pragmatic trade-off for data-driven `style={}` on non-user-controlled values.

**Important**: `style={}` attributes in React are NOT blocked by CSP `style-src` nonce restrictions. CSP `style-src` controls `<style>` blocks and the `style` HTML attribute set via `setAttribute()`. React's `style={}` prop uses `element.style.property = value` (direct property assignment), which is NOT restricted by CSP. Therefore, **React's `style={}` props are CSP-safe** and do NOT need to be removed for CSP compliance.

**What DOES require `unsafe-inline`**: Libraries like recharts that use `setAttribute('style', ...)` or inject `<style>` tags into the DOM. This is why recharts is the real blocker, not React's `style={}` prop.

### Revised Scope

Given the above CSP analysis:
1. **MUST change**: recharts → Chart.js (recharts injects `<style>` tags and uses `setAttribute`)
2. **MUST change**: CSP directive (`unsafe-inline` → `nonce-${nonce}`)
3. **SHOULD change for best practice**: `global-error.tsx` inline styles → `globals.css` classes (cleaner, but technically React `style={}` is CSP-safe)
4. **OPTIONAL / best practice**: AuthGridLines, AuthLayout, InfinitySpinner, TrafficByWebsiteChart, TrafficByLocationChart — React `style={}` is already CSP-safe, but converting to Tailwind is cleaner code

---

## Implementation Steps

### Step 0: Create Feature Branch

- **Branch**: `feature/SCRUM-240-frontend`
- **From**: `main` (latest)
- **Commands**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-240-frontend`

### Step 1: Install Chart.js and remove recharts

- **File**: `nexacore-dashboard/package.json`
- **Action**: Replace recharts with chart.js + react-chartjs-2
- **Implementation Steps**:
  1. `cd nexacore-dashboard && npm uninstall recharts && npm install chart.js react-chartjs-2`
  2. Verify package.json no longer has `recharts`, has `chart.js` and `react-chartjs-2`

### Step 2: Rewrite TotalUsersChart (Line chart)

- **File**: `nexacore-dashboard/src/components/dashboard/TotalUsersChart.tsx`
- **Action**: Replace recharts LineChart with react-chartjs-2 Line
- **Implementation Steps**:
  1. Replace recharts imports with: `import { Line } from 'react-chartjs-2'` and `import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'`
  2. Register chart components: `ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)`
  3. Convert `data` array to Chart.js format: `{ labels: [...months], datasets: [{ label, data, borderColor, ... }] }`
  4. Configure options: `{ responsive: true, maintainAspectRatio: false, scales, plugins }` matching current visual design
  5. Preserve: grid lines (CartesianGrid → scales.x/y.grid), axis formatting (formatYAxis → scales.y.ticks.callback), tooltip styling (contentStyle → plugins.tooltip), line colors (#content-primary, #a0bce8), dashed line for lastYear
  6. Keep the `<ChartCard>` wrapper and legend section unchanged
  7. Use CSS variables for theme-aware colors where possible: read CSS vars at render time or use a callback

### Step 3: Rewrite MarketingSeoChart (Bar chart with per-bar colors)

- **File**: `nexacore-dashboard/src/components/dashboard/MarketingSeoChart.tsx`
- **Action**: Replace recharts BarChart with react-chartjs-2 Bar
- **Implementation Steps**:
  1. Import `Bar` from react-chartjs-2, register `BarElement` and `CategoryScale`
  2. Convert data: `{ labels: [...months], datasets: [{ data: [...values], backgroundColor: colors (rotating array) }] }`
  3. Configure `borderRadius: 4` on dataset for rounded tops (matches current `radius={[4,4,0,0]}`)
  4. Tooltip styling via `plugins.tooltip.backgroundColor`, `borderColor`, `borderWidth`, `cornerRadius`
  5. Grid/axis: vertical grid hidden (`scales.x.grid.display: false`), horizontal with dashed lines

### Step 4: Rewrite TrafficByDeviceChart (Bar chart with data-driven colors)

- **File**: `nexacore-dashboard/src/components/dashboard/TrafficByDeviceChart.tsx`
- **Action**: Replace recharts BarChart with react-chartjs-2 Bar
- **Implementation Steps**:
  1. Same pattern as Step 3 but `backgroundColor` comes from `data[].color` array
  2. Chart.js supports per-bar colors natively: `backgroundColor: data.map(d => d.color)`

### Step 5: Rewrite TrafficByLocationChart (Pie/Doughnut chart)

- **File**: `nexacore-dashboard/src/components/dashboard/TrafficByLocationChart.tsx`
- **Action**: Replace recharts PieChart with react-chartjs-2 Doughnut
- **Implementation Steps**:
  1. Import `Doughnut` from react-chartjs-2, register `ArcElement`
  2. Convert data: `{ labels: [...names], datasets: [{ data: [...values], backgroundColor: [...colors] }] }`
  3. Configure `cutout: '60%'` for donut shape (matches innerRadius/outerRadius ratio 35/55 ≈ 64%)
  4. Keep the legend section (JSX) — only the chart rendering changes
  5. The legend dot `style={{ backgroundColor: item.color }}` is React `style={}` (CSP-safe), but convert to Tailwind `bg-[${color}]` for cleaner code if colors are static. Since colors are hardcoded constants, use Tailwind arbitrary `bg-[#a0bce8]` etc. via a color → class map

### Step 6: Convert AuthGridLines to Tailwind arbitrary values

- **File**: `nexacore-dashboard/src/components/auth/AuthGridLines.tsx`
- **Action**: Replace `style={{ top: 'X%' }}` and `style={{ left: 'X%' }}` with Tailwind arbitrary values
- **Implementation Steps**:
  1. `style={{ top: '9.47%' }}` → `top-[9.47%]`
  2. `style={{ top: '86.91%' }}` → `top-[86.91%]`
  3. `style={{ left: '10.35%' }}` → `left-[10.35%]`
  4. `style={{ left: '13.13%' }}` → `left-[13.13%]`
  5. `style={{ left: '19.93%' }}` → `left-[19.93%]`
  6. `style={{ left: '80.00%' }}` → `left-[80%]`
  7. `style={{ left: '81.94%' }}` → `left-[81.94%]`
  8. `style={{ left: '93.82%' }}` → `left-[93.82%]`
  9. Remove all `style={}` attributes

### Step 7: Convert AuthLayout to Tailwind classes

- **File**: `nexacore-dashboard/src/components/layout/AuthLayout.tsx`
- **Action**: Replace conditional `style={}` with Tailwind classes
- **Implementation Steps**:
  1. Line 27: `style={narrow ? { maxWidth: 350, overflow: "hidden" } : undefined}` → `className={... ${narrow ? "max-w-[350px] overflow-hidden" : ""}}`
  2. Line 32: `style={{ borderRadius: narrow ? 0 : "24px 24px 0 0" }}` → `className={... ${narrow ? "rounded-none" : "rounded-t-3xl"}}`  (24px ≈ `rounded-t-3xl` which is 1.5rem=24px)
  3. Line 67: `style={{ height: 56 }}` → `h-14` (56px = 3.5rem = h-14)

### Step 8: Convert InfinitySpinner to Tailwind

- **File**: `nexacore-dashboard/src/components/ui/InfinitySpinner.tsx`
- **Action**: Replace SVG transform style with Tailwind classes
- **Implementation Steps**:
  1. Line 55: `style={{ transform: 'scale(0.8)', transformOrigin: '50px 50px' }}` → `className="scale-[0.8] origin-[50px_50px]"`
  2. Keep existing `className="infinity-spinner"` — merge: `className="infinity-spinner scale-[0.8] origin-[50px_50px]"`

### Step 9: Convert global-error.tsx inline styles to globals.css classes

- **File**: `nexacore-dashboard/src/app/global-error.tsx` + `nexacore-dashboard/src/app/globals.css`
- **Action**: Extract all inline styles to CSS classes in globals.css, use class names in JSX
- **Implementation Steps**:
  1. Add a `/* Global Error Boundary */` section at the end of `globals.css` with classes:
     - `.global-error-body` — margin, min-height, display flex, center alignment, font-family, bg/color
     - `.global-error-container` — max-width, width, padding, text-center
     - `.global-error-icon` — margin auto + bottom
     - `.global-error-title` — font size, weight, margin, color
     - `.global-error-message` — font size, color, margin, line-height
     - `.global-error-digest` — font size, color, margin
     - `.global-error-actions` — flex, gap, center
     - `.global-error-btn-primary` — button styles (padding, font, bg, color, border, radius, cursor)
     - `.global-error-btn-secondary` — link styles (same but lighter bg)
  2. Replace all `style={{...}}` in global-error.tsx with `className="global-error-*"`
  3. This works because `globals.css` is loaded via `<link>` tag (allowed by `style-src 'self'`), and is available even when JS bundles fail (it's in the initial HTML shell)

### Step 10: Update CSP directive

- **File**: `nexacore-dashboard/src/middleware.ts`
- **Action**: Change `style-src` from `unsafe-inline` to nonce-based
- **Implementation Steps**:
  1. Line 21: Change `style-src 'self' 'unsafe-inline'` to `style-src 'self' 'nonce-${nonce}'`
  2. This ensures only server-generated `<style>` tags with the correct nonce execute
  3. `<link rel="stylesheet">` is allowed by `'self'` (same-origin CSS files)
  4. React `style={}` props continue to work (direct property assignment, not affected by CSP)

### Step 11: Update layout.tsx for nonce on theme script

- **File**: `nexacore-dashboard/src/app/layout.tsx`
- **Action**: The theme init script uses `dangerouslySetInnerHTML` — this already works because `script-src` uses nonce. But check if we need to pass nonce to the `<script>` tag.
- **Implementation Steps**:
  1. Import `headers` from `next/headers`
  2. Read nonce: `const nonce = headers().get('x-nonce') ?? ''`
  3. Add `nonce={nonce}` to the `<script>` tag: `<script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />`
  4. This was already working because `'strict-dynamic'` in script-src propagates trust, but adding the explicit nonce is correct practice

### Step 12: Verify build and CSP compliance

- **Action**: Run `npm run build` in nexacore-dashboard, verify clean compilation
- **Implementation Steps**:
  1. `npm run build` — must compile without errors
  2. Verify no recharts imports remain: `grep -r "recharts" nexacore-dashboard/src/`
  3. Verify no `style={}` in modified files (except TrafficByWebsiteChart dynamic width which is CSP-safe)
  4. Verify CSP header in middleware.ts has no `unsafe-inline`

### Step 13: Update Technical Documentation (via `/update-docs`)

---

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Install Chart.js, remove recharts
3. Steps 2-5: Rewrite 4 chart components (can be done sequentially)
4. Step 6: AuthGridLines → Tailwind
5. Step 7: AuthLayout → Tailwind
6. Step 8: InfinitySpinner → Tailwind
7. Step 9: global-error.tsx → globals.css classes
8. Step 10: Update CSP directive
9. Step 11: Update layout.tsx nonce
10. Step 12: Verify build
11. Step 13: Update documentation

## Testing Checklist

### Chart Migration
- [ ] TotalUsersChart renders Line chart with 2 series (this year, last year)
- [ ] MarketingSeoChart renders Bar chart with 12 bars, per-bar colors
- [ ] TrafficByDeviceChart renders Bar chart with 6 bars, data-driven colors
- [ ] TrafficByLocationChart renders Doughnut chart with 4 segments + legend
- [ ] TrafficByWebsiteChart renders progress bars (no recharts dependency)
- [ ] All charts responsive (resize browser)
- [ ] Tooltips appear on hover
- [ ] Dark mode colors work

### Inline Style Removal
- [ ] AuthGridLines: 8 lines positioned correctly via Tailwind
- [ ] AuthLayout: narrow vs normal mode renders correctly
- [ ] InfinitySpinner: animation plays correctly with scale
- [ ] global-error.tsx: renders correctly with CSS classes

### CSP Compliance
- [ ] CSP header contains `style-src 'self' 'nonce-...'` (no `unsafe-inline`)
- [ ] No CSP violations in browser console on login page
- [ ] No CSP violations in browser console on dashboard page
- [ ] No CSP violations in browser console on register page
- [ ] Turnstile CAPTCHA still works

### Build
- [ ] `npm run build` passes
- [ ] No recharts imports remain in codebase
- [ ] Bundle size reduced (recharts ~400KB removed, chart.js ~200KB added)

## Error Handling Patterns

- Chart.js components gracefully handle empty data arrays (no crash)
- If Chart.js fails to render, the `<ChartCard>` wrapper still shows the title
- global-error.tsx uses `globals.css` classes (available even when JS fails)

## UI/UX Considerations

- Chart visual fidelity must match current recharts output (colors, grid, tooltips)
- Chart.js provides native responsive behavior via `responsive: true`
- Dark mode: use CSS variables (`var(--border-default)`, `var(--surface-primary)`) in Chart.js options
- Chart.js dark mode may require programmatic theme detection for non-CSS options

## Dependencies

- **Add**: `chart.js`, `react-chartjs-2`
- **Remove**: `recharts`
- **Net bundle impact**: ~200KB reduction (recharts ~400KB → chart.js ~200KB)

## Notes

- **CSP technical detail**: React's `style={}` prop uses direct property assignment (`element.style.property = value`), which is NOT restricted by CSP `style-src`. Only `<style>` blocks and `setAttribute('style', ...)` require CSP permission. recharts uses both, which is why it's the real blocker.
- **global-error.tsx strategy**: Using `globals.css` classes instead of nonce injection because: (a) it's a client component, (b) CSS file is always available in the HTML shell, (c) simpler than nonce propagation
- **TrafficByWebsiteChart**: Keeps `style={{ width: ... }}` since it's React prop (CSP-safe) and the value is computed from hardcoded data. Could convert to Tailwind `w-[XX%]` but dynamic percentage makes this impractical.
- **Chart.js color theme awareness**: Chart.js options are set at render time. For CSS variable colors (like `var(--content-tertiary)`), use `getComputedStyle(document.documentElement).getPropertyValue('--content-tertiary')` or keep hex colors for non-theme-dependent values.

## Risk Assessment

- **Risk**: MEDIUM — Chart.js migration changes visual rendering of 4 dashboard charts
- **Mitigation**: Side-by-side visual comparison before/after, same color palette and layout preserved
- **Rollback**: Revert all file changes + `npm install recharts && npm uninstall chart.js react-chartjs-2`
