# SCRUM-298 — Migrate Charts from Chart.js to Recharts (Plan)

## Scope: FRONTEND

## Objective
Replace react-chartjs-2 (canvas rendering) with Recharts (SVG/HTML rendering) for consistent typography and anti-aliasing across the entire UI.

## Pre-implementation Check
- [ ] recharts package available and compatible with Next.js 14
- [ ] No breaking changes in Recharts API for LineChart and PieChart

## Steps

### Step 1: Install Recharts, remove Chart.js
- `npm install recharts`
- `npm uninstall chart.js react-chartjs-2`
- Verify no other files depend on chart.js

### Step 2: Migrate TotalUsersChart (Line → LineChart)
- Replace `<Line>` with Recharts `<LineChart>` + `<Line>` + `<XAxis>` + `<YAxis>` + `<CartesianGrid>` + `<Tooltip>`
- Data: same arrays (labels, thisYearData, lastYearData)
- Tooltip: use Recharts custom `<Tooltip content={...}>` — native DOM, no createPortal needed
- Dark mode: same `useTheme()` pattern, pass colors to stroke/fill
- Remove: createPortal, computePlacement import, external callback, ChartJS.register, ChartJS.defaults
- Keep: ChartCard wrapper, legend, forceDark prop
- Tooltip style: same rounded-lg border-border-strong bg-surface-primary px-4 py-3 + diamond arrow

### Step 3: Migrate UserRoleChart (Doughnut → PieChart)
- Replace `<Doughnut>` with Recharts `<PieChart>` + `<Pie>` with `innerRadius` for doughnut effect
- Data: map API response to Recharts format `[{name, value, fill}]`
- Tooltip: same custom content as TotalUsersChart
- Remove: ChartJS.register, native Chart.js tooltip config
- Keep: API call, loading state, color mapping

### Step 4: Migrate DoughnutChartMock (Showcase)
- Replace `<Doughnut>` with Recharts `<PieChart>` + `<Pie>`
- Remove: createPortal, computePlacement, doughnutArrowClasses, getDoughnutPlacement
- Tooltip: same Recharts custom content
- Static data (no API)

### Step 5: Remove workarounds
- Delete `useAutoPlacement.ts` if no other consumers (check dropdowns first)
- Remove `createPortal` import from ComponentShowcase (if only used for chart tooltip)
- Remove `arrowClasses` constant from TotalUsersChart
- Clean up unused imports (ChartJS, ArcElement, etc.)

### Step 6: Verify rendering consistency
- Compare 14px text in chart vs 14px text in Calendar — should be identical
- Verify tooltip diamond arrow renders correctly (now native DOM)
- Test dark mode on both charts
- Test responsive behavior

### Step 7: Update specs
- Chart.js Config section in SpecsPanel → update to Recharts config
- Remove "createPortal" and "computePlacement" references
- Update TokenInspector if needed

## Acceptance Criteria
- All chart text renders with Geist Sans at exact same size as HTML elements
- Tooltips use native DOM (no createPortal, no computePlacement hacks)
- Dark mode works on both charts
- chart.js and react-chartjs-2 removed from package.json
- TypeScript 0 errors
- 1011 tests passing

## Files Changed (~5)
- `TotalUsersChart.tsx` — full rewrite
- `UserRoleChart.tsx` — full rewrite
- `ComponentShowcase.tsx` — DoughnutChartMock section
- `hooks/useAutoPlacement.ts` — potentially delete
- `package.json` / `package-lock.json` — dependency swap

## Risk
- Recharts PieChart may not support `cutout` (doughnut hole) in same way — use `innerRadius` prop
- Custom tooltip with diamond arrow needs to be implemented as Recharts `<Tooltip content={}>` — may need different positioning logic
