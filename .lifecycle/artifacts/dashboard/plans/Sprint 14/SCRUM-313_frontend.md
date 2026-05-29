# Frontend Implementation Plan: SCRUM-313 Add Tooltips to Icon-Only Buttons

## Overview

Add `tooltip={true}` to all icon-only IconButtons that lack it. IconButton already supports `tooltip` prop (SCRUM-306) which uses `aria-label` as tooltip text. Also fix Pagination accessibility (missing aria-label) and CopyField (plain button needs Tooltip wrap).

## Architecture Context

- **Component**: `src/components/ui/IconButton.tsx` — `tooltip` prop already implemented, uses Tooltip component with auto-positioning
- **Pattern**: `tooltip={true}` uses existing `aria-label` as text. No new components needed.
- **No backend changes**

## Implementation Steps

### Step 0: Create Feature Branch

- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-313-frontend`

### Step 1: Add tooltip={true} to 12 IconButtons

Each is a one-line addition of `tooltip` prop:

| # | File | Line | Button | aria-label |
|---|------|------|--------|-----------|
| 1 | NavBar.tsx | ~69 | PanelLeftOpen (sidebar toggle) | "Toggle sidebar" |
| 2 | NavBar.tsx | ~99 | Search (mobile) | "Search" |
| 3 | Sidebar.tsx | ~172 | PanelLeftOpen/Close | "Expand/Collapse sidebar" |
| 4 | ActiveSessions.tsx | ~179 | Trash2 (revoke session) | "Revoke session" |
| 5 | TrustedDevices.tsx | ~184 | Trash2 (revoke trust) | "Revoke trust for {device}" |
| 6 | PasskeyManager.tsx | ~93 | Pencil (rename) | "Rename {name}" |
| 7 | PasskeyManager.tsx | ~100 | Trash2 (delete) | "Delete {name}" |
| 8 | MfaSetupStep.tsx | ~204 | Copy (copy secret) | "Copy secret key" |
| 9 | ProfileForm.tsx | ~289 | Pencil (change banner) | "Change banner" |
| 10 | ProfileForm.tsx | ~364 | Pencil (edit name) | "Edit name" |
| 11 | ActionDropdown.tsx | ~65 | MoreHorizontal (actions) | "Actions" |
| 12 | CopyField.tsx | ~50 | Copy (plain button — wrap with Tooltip or convert to IconButton) |

### Step 2: Fix Pagination Accessibility

**File**: `src/components/ui/Pagination.tsx`

Add `aria-label="Previous page"` and `aria-label="Next page"` to the prev/next buttons.

### Step 3: Update Documentation

- `ai-specs/specs/integration-state.md` — changelog entry

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add tooltip to 12 buttons (10 files)
3. Step 2: Pagination aria-label
4. Step 3: Documentation

## Testing Checklist

- [ ] All 12 buttons show tooltip on hover
- [ ] Pagination prev/next have aria-label
- [ ] No tooltip on close/X, password toggle, hamburger, or mobile-only buttons
- [ ] Build: npm run build clean
- [ ] TypeScript: tsc --noEmit 0 errors

## Dependencies

- No new dependencies

## Notes

- CopyField.tsx uses a plain `<button>`, not IconButton. Either convert to IconButton or wrap with `<Tooltip>` directly.
- Sidebar tooltip on collapse button should use `tooltipPosition="right"` since it's on the left edge
- ActionDropdown tooltip on "Actions" should use `tooltipPosition="bottom"` to avoid conflict with the dropdown itself
