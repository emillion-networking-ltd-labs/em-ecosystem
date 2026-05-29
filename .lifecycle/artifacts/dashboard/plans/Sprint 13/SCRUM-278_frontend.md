# Frontend Implementation Plan: SCRUM-278 Dashboard Overview Page — Real Content & Widgets

## 1. Overview

Replace the hardcoded mock analytics data on `/dashboard` with real NexaCore-relevant content. The current page has 7 components showing generic placeholder data (Views, Visits, Traffic by Website/Device/Location, Marketing & SEO). This ticket replaces them with:

- **Metric cards** fetching real counts from existing APIs (`GET /users`, `GET /audit-logs`)
- **Recent Activity Feed** showing latest audit log entries
- **User Role Distribution** doughnut chart using real user data
- **Quick Actions** card with permission-gated links
- **Right Panel** kept as-is (static notifications/activities/contacts structure matches Figma)

All widgets are gated by permissions using the existing `usePermissions()` hook (established in SCRUM-276).

## 2. Architecture Context

### Components affected
- `nexacore-dashboard/src/app/dashboard/page.tsx` — main layout restructure
- `nexacore-dashboard/src/components/dashboard/MetricCard.tsx` — add loading state

### New components
- `RecentActivityFeed.tsx` — audit log feed widget
- `QuickActionsCard.tsx` — permission-gated action links
- `UserRoleChart.tsx` — role distribution doughnut chart

### Components to remove
- `TrafficByWebsiteChart.tsx` — not relevant to NexaCore
- `TrafficByDeviceChart.tsx` — replaced by QuickActionsCard
- `TrafficByLocationChart.tsx` — replaced by UserRoleChart
- `MarketingSeoChart.tsx` — not relevant to NexaCore

### Files referenced (verified from live code)
| File | Current State |
|------|--------------|
| `page.tsx` | 4 metric cards (hardcoded), 5 chart components, RightPanel |
| `MetricCard.tsx` | Static props: label, value, trend, colorVariant. No loading state |
| `ChartCard.tsx` | Reusable wrapper with title + action slot — will be reused |
| `TotalUsersChart.tsx` | Line chart with chart.js, hardcoded data — will be kept and adapted |
| `TrafficByLocationChart.tsx` | Doughnut chart — pattern will be reused for UserRoleChart |
| `RightPanel.tsx` | Static notifications/activities/contacts — keep as-is |
| `types.ts` | Has `SafeUser`, `AuditLog`, `PaginatedResponse`, `AuditLogUser` types |
| `api.ts` | ApiClient with get/post/put/delete, bearer token, CSRF handling |

### Existing API endpoints (from api-spec.yml)
| Endpoint | Returns | Permission Required |
|----------|---------|-------------------|
| `GET /users?limit=1` | `PaginatedResponse<SafeUser>` with `meta.total` | `users:read` |
| `GET /users?isActive=true&limit=1` | Same with active filter | `users:read` |
| `GET /audit-logs?limit=5` | `{ data: AuditLog[], total, page, totalPages }` | `audit-logs:read` |

## 3. Implementation Steps

### Step 0: Create Feature Branch
- **Action**: Create `feat/scrum-278-dashboard-overview`
- **Implementation Steps**:
  1. `cd em-ecosystem-code && git checkout main && git pull origin main`
  2. `git checkout -b feat/scrum-278-dashboard-overview`

### Step 1: Add loading state to MetricCard
- **File**: `nexacore-dashboard/src/components/dashboard/MetricCard.tsx`
- **Action**: Add optional `loading` prop with skeleton placeholder
- **Implementation Steps**:
  1. Add `loading?: boolean` to `MetricCardProps`
  2. When `loading=true`, render a pulse skeleton instead of value/trend
  3. Keep existing appearance for `loading=false` (default)
- **Implementation Notes**: Use Tailwind `animate-pulse bg-surface-subtle` for skeleton

### Step 2: Create RecentActivityFeed component
- **File**: `nexacore-dashboard/src/components/dashboard/RecentActivityFeed.tsx` (NEW)
- **Action**: Create audit log feed widget that fetches latest 5 entries
- **Implementation Steps**:
  1. Import `apiClient`, `AuditLog` type, `ChartCard` wrapper
  2. `useEffect` to fetch `GET /audit-logs?limit=5&page=1`
  3. Display each entry: action icon, formatted action name, user email, relative timestamp
  4. Loading state: skeleton rows
  5. Empty state: "No recent activity"
  6. Error state: "Could not load activity"
- **Implementation Notes**: Use timeline-style layout similar to RightPanel activities section. Format audit action enums to human-readable (e.g., `LOGIN_SUCCESS` → "Logged in").

### Step 3: Create QuickActionsCard component
- **File**: `nexacore-dashboard/src/components/dashboard/QuickActionsCard.tsx` (NEW)
- **Action**: Create permission-gated quick action links
- **Implementation Steps**:
  1. Import `usePermissions`, `Link`, lucide icons
  2. Define action items with permission requirements:
     ```
     { href: "/admin", label: "Manage Users", icon: Users, permission: "users:read" }
     { href: "/admin/audit-logs", label: "View Audit Logs", icon: ScrollText, permission: "audit-logs:read" }
     { href: "/admin/permissions", label: "Manage Permissions", icon: Key, permission: "permissions:read" }
     { href: "/profile", label: "My Profile", icon: User }
     ```
  3. Filter actions by `hasPermission()` — show only permitted actions
  4. Wrap in ChartCard with title "Quick Actions"
  5. Each action: icon + label as a clickable row with hover state

### Step 4: Create UserRoleChart component
- **File**: `nexacore-dashboard/src/components/dashboard/UserRoleChart.tsx` (NEW)
- **Action**: Doughnut chart showing user distribution by role
- **Implementation Steps**:
  1. Import chart.js Doughnut, ChartCard, apiClient
  2. Fetch user counts per role:
     - `GET /users?role=USER&limit=1` → meta.total for USER count
     - `GET /users?role=ADMIN&limit=1` → meta.total for ADMIN count
     - `GET /users?role=SUPERADMIN&limit=1` → meta.total for SUPERADMIN count
  3. Render doughnut chart using same pattern as TrafficByLocationChart (colors, legend)
  4. Colors: USER → `#a0bce8`, ADMIN → `#6be6d3`, SUPERADMIN → `#000000`
  5. Loading state: skeleton circle
- **Implementation Notes**: Reuse chart.js ArcElement config from TrafficByLocationChart

### Step 5: Update dashboard page layout
- **File**: `nexacore-dashboard/src/app/dashboard/page.tsx`
- **Action**: Replace placeholder charts with new NexaCore widgets, connect metrics to API
- **Implementation Steps**:
  1. Remove imports: TrafficByWebsiteChart, TrafficByDeviceChart, TrafficByLocationChart, MarketingSeoChart
  2. Add imports: RecentActivityFeed, QuickActionsCard, UserRoleChart, usePermissions, apiClient
  3. Replace static `metrics` array with `useState` + `useEffect` fetching real counts:
     - Total Users: `GET /users?limit=1` → `meta.total`
     - Active Users: `GET /users?isActive=true&limit=1` → `meta.total`
     - Recent Activity: `GET /audit-logs?limit=1` → `total`
     - System Status: static "Operational" (no API)
  4. Gate user/activity metrics by permissions: only show cards user has access to
  5. Update layout grid:
     ```
     Row 1: Metric cards (1-4 depending on permissions)
     Row 2: TotalUsersChart (keep, gated by users:read) + RecentActivityFeed (gated by audit-logs:read)
     Row 3: UserRoleChart (gated by users:read) + QuickActionsCard (always visible)
     ```
  6. Keep RightPanel as-is
- **Implementation Notes**: USER role sees only System Status metric + Quick Actions (with Profile only). ADMIN/SUPERADMIN sees full dashboard.

### Step 6: Remove unused chart components
- **Action**: Delete files no longer used
- **Files to delete**:
  - `TrafficByWebsiteChart.tsx`
  - `TrafficByDeviceChart.tsx`
  - `TrafficByLocationChart.tsx`
  - `MarketingSeoChart.tsx`
- **Implementation Notes**: Verify no other file imports them before deleting

### Step 7: Build verification
- **Action**: Run `npx next build` to verify no errors
- **Implementation Steps**:
  1. Run build from `nexacore-dashboard/`
  2. Fix any TypeScript errors
  3. Verify all pages compile

### Step 8: Update Technical Documentation
- **Action**: Review and update if needed
- **Implementation Steps**:
  1. No new API endpoints (using existing)
  2. No new dependencies (chart.js already installed)
  3. Frontend-standards.mdc may note the dashboard widget pattern
  4. Likely no doc updates needed

## 4. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add loading state to MetricCard
3. Step 2: Create RecentActivityFeed component
4. Step 3: Create QuickActionsCard component
5. Step 4: Create UserRoleChart component
6. Step 5: Update dashboard page layout
7. Step 6: Remove unused chart components
8. Step 7: Build verification
9. Step 8: Update documentation (if needed)

## 5. Testing Checklist

- [ ] Build passes (`npx next build`) with no errors
- [ ] SUPERADMIN sees: Total Users, Active Users, Activity Count, System Status metrics + TotalUsersChart + RecentActivityFeed + UserRoleChart + QuickActionsCard
- [ ] ADMIN sees same as SUPERADMIN (has users:read + audit-logs:read)
- [ ] USER sees only: System Status metric + QuickActionsCard (Profile link only)
- [ ] Metric cards show loading skeletons before API responds
- [ ] Activity feed displays real audit log entries with formatted timestamps
- [ ] Role chart shows correct user distribution
- [ ] Quick actions only show permitted links
- [ ] Removed chart files don't break imports
- [ ] RightPanel unchanged

## 6. Error Handling Patterns

- API fetch failures: show "—" for metric values, "Could not load" for feed/chart
- Loading states: skeleton pulse animations
- Empty states: descriptive messages ("No recent activity", "No users found")
- Permission denied: widgets hidden entirely (not error state)

## 7. UI/UX Considerations

- Maintain existing spacing, border-radius, and card styles from SCRUM-277 polish
- MetricCard loading skeleton matches card dimensions to prevent layout shift
- Activity feed uses timeline-style layout consistent with RightPanel activities
- Quick actions use same hover/active patterns as sidebar nav items
- Responsive: metric cards stack 1-col on mobile, 2-col on tablet, 4-col on desktop

## 8. Dependencies

- No new dependencies — uses existing chart.js, lucide-react, ApiClient
- Existing API endpoints: `GET /users`, `GET /audit-logs`

## 9. Notes

- TotalUsersChart is kept but will eventually need real data (line chart needs time-series — out of scope for this ticket)
- RightPanel kept with static data (Figma design matches current structure)
- The 4 deleted chart components are fully replaced — no information loss
- If the /users or /audit-logs endpoints fail, the dashboard gracefully degrades to showing only System Status

## 10. Next Steps After Implementation

- SCRUM-279: Settings Page
- Future: connect TotalUsersChart to real time-series data (requires new backend endpoint)

## 11. Implementation Verification

- [ ] **Code Quality**: No hardcoded mock data in active dashboard widgets
- [ ] **Functionality**: All roles see appropriate permission-gated content
- [ ] **Testing**: Build passes, loading/error/empty states work
- [ ] **Integration**: API calls use existing endpoints, types match
- [ ] **Documentation**: Updated if needed
