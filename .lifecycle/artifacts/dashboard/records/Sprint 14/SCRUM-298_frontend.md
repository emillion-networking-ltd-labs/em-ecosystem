# SCRUM-298 — Implementation Record

## Ticket
**SCRUM-298**: Migrate charts from Chart.js (canvas) to Recharts (SVG)

## Execution
- **Sprint**: 14
- **Date**: 2026-03-24
- **Commit**: `0bde051`
- **Branch**: feature/SCRUM-298-frontend → merged to main
- **PR**: Direct merge (pre-push hooks passed)

## Scope
FRONTEND — 10 files changed, 763 insertions, 630 deletions

## Changes Summary

### Library Swap
- Removed: chart.js 4.5.1, react-chartjs-2 5.3.1, geist
- Added: recharts 3.8.0
- Benefit: SVG rendering (same engine as HTML) — no canvas anti-aliasing differences

### Chart Migrations
| Component | Before | After |
|-----------|--------|-------|
| TotalUsersChart | `<Line>` (react-chartjs-2) | Recharts `<LineChart>` + `<Line>` |
| UserRoleChart | `<Doughnut>` (react-chartjs-2) | Recharts `<PieChart>` + `<Pie>` |
| DoughnutChartMock | `<Doughnut>` (showcase) | Recharts `<PieChart>` + `<Pie>` |

### Tooltips
- Custom HTML content via `<Tooltip content={...} />`
- Style: rounded-lg, border-strong, bg-surface-primary, shadow-card
- Color dots: h-2 w-2 rounded-sm with item.color
- No diamond arrow (Recharts controls position, no direction API)
- Recharts native auto-positioning (stays within chart bounds)

### Dark Mode
- TotalUsersChart: colors.line adaptive (#f5f5f5 dark / #1c1c1c light)
- UserRoleChart: SUPERADMIN color adaptive (#f5f5f5 dark / #1c1c1c light)
- DoughnutChartMock: isDark prop passed from showcase wrapper

### Workarounds Removed
- `hooks/useAutoPlacement.ts` — deleted (flip+shift algorithm)
- `createPortal` tooltip system — removed from both charts
- `ChartJS.register()`, `ChartJS.defaults.font.family` — removed
- `external` tooltip callback — removed
- `arrowClasses`, `getDoughnutPlacement`, `chartJsToPreferred` — removed

### Typography
- Geist Sans → System font stack (-apple-system, Segoe UI, Noto Sans) — like GitHub
- GeistSans removed from layout.tsx
- `svg text { font-family: inherit }` — SVG inherits system font
- `svg:focus { outline: none }` — remove browser focus ring on charts
- Speedometer labels: 8/10/11px → 12px (caption token)
- Speedometer sizes: sm 180px, md 230px, lg 260px (proportional to 12px labels)

### Showcase Fixes
- Tooltip.tsx: position="auto" (viewport edge detection), content ReactNode, arrowClasses exported
- FullPage card button: inline HTML → `<Button variant="outline" size="md">`
- Toast test buttons: sm → md
- Chart card radius: rounded-3xl → rounded-xl (card inner)

## Files Changed
| File | Change |
|------|--------|
| package.json / package-lock.json | Dependency swap |
| TotalUsersChart.tsx | Full rewrite (259 → 132 lines) |
| UserRoleChart.tsx | Full rewrite (153 → 156 lines) |
| ComponentShowcase.tsx | DoughnutChartMock, Speedometer, tooltips, specs |
| Tooltip.tsx | position="auto", content ReactNode, arrowClasses export |
| useAutoPlacement.ts | Deleted |
| globals.css | svg text inherit, svg focus, system font |
| layout.tsx | Remove GeistSans |
| tailwind.config.ts | System font stack |

## Deviations
| Type | Description |
|------|-------------|
| Accepted-Trivial | Chart tooltips without diamond (Recharts position limitation) |
| Accepted-Trivial | SVG 12px vs HTML 14px slight visual difference (inherent SVG rendering) |

## Test Results
- 1011/1011 tests passing
- TypeScript: 0 errors
- Pre-push hooks: PASS
- chart.js references: 0 across project
