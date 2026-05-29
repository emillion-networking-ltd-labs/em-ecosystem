# Frontend Implementation Plan: SCRUM-321 ConfirmModal UX Improvements

## Overview

Fix 6 UX issues in ConfirmModal: overlay click, close button visibility, button sizes, mobile responsiveness, autofocus policy, Enter key submit.

## Architecture Context

- **File**: `src/components/ui/ConfirmModal.tsx`
- **Standards**: W3C WAI ARIA APG Dialog Modal Pattern, IC Design System
- **Used by**: 15+ places across the dashboard (admin, profile, MFA, passkeys)

## Implementation Steps

### Step 0: Create Feature Branch
- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-321-frontend`

### Step 1: Remove overlay click close
Remove `onClick` handler from overlay div (line 136-138). Only Escape + X button close.

### Step 2: X close button always visible
Remove `opacity-0 group-hover:opacity-100` from close button (line 152). Always visible.

### Step 3: Button sizes sm
Change `size="md"` to `size="sm"` for both Cancel and Confirm buttons (lines 174, 183).

### Step 4: Mobile responsive
Add `max-h-[90vh] overflow-y-auto` to panel. Adjust padding for mobile.

### Step 5: Smart autofocus
Replace current `focusable[0].focus()` (line 89) with:
```
1. Find first input/textarea in panel → focus it
2. Else if variant === "danger" → focus Cancel button
3. Else → focus Confirm button
```
Add `data-confirm-cancel` and `data-confirm-action` attributes to buttons for targeting.

### Step 6: Enter key submit
Add Enter key handler in `handleKeyDown`: if Enter pressed and not on a textarea, call `onConfirm()`.

### Step 7: Update specs
Update `confirmModalSpecs` to reflect new behavior.

## Testing Checklist
- [ ] Click overlay → modal stays open
- [ ] X button visible without hover
- [ ] Buttons are size sm
- [ ] Modal scrollable on small screens
- [ ] Modal with input → input focused
- [ ] Danger modal without input → Cancel focused
- [ ] Primary modal without input → Confirm focused
- [ ] Enter key triggers confirm
- [ ] Escape still closes
- [ ] All existing modals work (admin, profile, MFA, passkeys)
