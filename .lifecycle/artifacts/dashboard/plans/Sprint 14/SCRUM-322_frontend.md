# Frontend Implementation Plan: SCRUM-322 Unify Loading and Empty State UI

## Overview

Standardize loading indicators and empty states across the dashboard using existing Design System components. Visual/UI only — no auth, token, or data fetching logic changes.

## Scope Clarification

This ticket covers ONLY visual consistency:
- Which loader component to use where (DataTable skeleton vs Spinner)
- EmptyState component where text-only fallback exists
- useDelayedLoading hook application (already created)

This ticket does NOT cover:
- AbortController (already done in Phase 1 — merged PR #223)
- Error states for silent failures (already done in Phase 2 — merged PR #223)
- Token/session race conditions (SCRUM-326)
- "F5 and blank screen" (SCRUM-326 — root cause is token unavailable on mount)

## Existing Components (use only these)

| Component | Usage | Location |
|-----------|-------|----------|
| DataTable `loading` prop | Table skeleton rows (animate-pulse) | `ui/DataTable.tsx` |
| EmptyState | Icon + title + description + action | `ui/EmptyState.tsx` |
| Spinner sm/md/lg | Non-table section loading | `ui/Spinner.tsx` |
| MetricCard `loading` prop | Metric skeleton (animate-pulse) | `dashboard/MetricCard.tsx` |
| useDelayedLoading | 200ms delay, 300ms min display | `hooks/useDelayedLoading.ts` |

## Audit: Current State vs Target

| Component | Current Loading | Target Loading | Current Empty | Target Empty |
|-----------|----------------|----------------|---------------|--------------|
| admin/page.tsx (users) | Spinner h-64 | DataTable skeleton (already uses DataTable) | "No users found" text | EmptyState with Users icon |
| audit-logs/page.tsx | Spinner h-64 | DataTable skeleton (already uses DataTable) | "No audit logs found" text | EmptyState with FileText icon |
| ActiveSessions | Custom inline spinner | Spinner md | "No active sessions" text | EmptyState with Monitor icon |
| SecurityActivity | Custom inline spinner | Spinner md | "No security events" text | EmptyState with Shield icon |
| TrustedDevices | Spinner md | OK (keep) | Text + helper | OK (keep — already descriptive) |
| PasskeyManager | Spinner md | OK (keep) | Text + helper | OK (keep — already descriptive) |
| UserRoleChart | Skeleton pulse | OK (keep) | N/A | N/A |
| RecentActivityFeed | 5 skeleton items | OK (keep) | "No recent activity" | OK (keep) |
| MetricCard | Pulse skeleton | OK (keep) | "—" | OK (keep) |

## Changes Required (6 specific edits)

### 1. admin/page.tsx — Replace Spinner with DataTable loading
Currently shows `<Spinner size="md" />` in a `h-64` container. But `UsersTable` already uses DataTable which has built-in skeleton. Pass `loading` prop to UsersTable instead.

### 2. audit-logs/page.tsx — Same as above
Replace Spinner with DataTable loading prop.

### 3. admin/page.tsx — EmptyState for no users
Replace `"No users found."` text with `<EmptyState icon={<Users />} title="No users found" description="Try adjusting your search or filters." />`

### 4. audit-logs/page.tsx — EmptyState for no logs
Replace `"No audit logs found."` text with `<EmptyState icon={<FileText />} title="No audit logs" description="Activity will appear here as actions are performed." />`

### 5. ActiveSessions — Replace custom spinner
Replace inline `<div className="h-6 w-6 animate-spin...">` with `<Spinner size="md" />`

### 6. SecurityActivity — Replace custom spinner
Same — replace inline spinner div with `<Spinner size="md" />`

## Implementation Order

1. Edits 5-6: Replace custom spinners (2 files, 1-line each)
2. Edits 1-2: Pass loading prop to DataTable (2 files)
3. Edits 3-4: EmptyState component (2 files)

## Rules (per Section 10 of workflow-standards.mdc)

- Edit ONLY the specific lines listed — no other changes
- Do NOT modify visual styles, layout, or padding
- Do NOT add AbortController, error handling, or auth logic
- `git diff` before commit to verify no unintended changes
- Ask user to test before pushing

## Testing Checklist

- [ ] admin/page.tsx: skeleton rows shown while loading (not spinner)
- [ ] admin/page.tsx: EmptyState shown when no users match search
- [ ] audit-logs: skeleton rows + EmptyState
- [ ] ActiveSessions: Spinner md (not custom div)
- [ ] SecurityActivity: Spinner md (not custom div)
- [ ] No visual regressions in any section
