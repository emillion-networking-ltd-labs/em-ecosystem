# Frontend Implementation Plan: SCRUM-204 Add accessibility: aria-live regions and modal focus traps

## Overview

Add WCAG 2.1 AA accessibility improvements: aria-live regions on inline error containers for screen reader announcements, and focus traps + dialog semantics on modal components.

## Architecture Context

- **Error containers**: 6 forms use the same `AlertTriangle + error span` pattern without `role="alert"` or `aria-live`. RateLimitBanner also lacks these attributes.
- **Modals**: ConfirmModal.tsx (reusable) and DeleteAccount.tsx (inline modal) lack `role="dialog"`, `aria-modal`, focus trap, and focus restoration.
- **Good foundations**: Toast already has `aria-live="assertive"`, Input has `aria-invalid` + `role="alert"`, ErrorAlert has `role="alert"`.

## Implementation Steps

### Step 0: Create Feature Branch

- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-204-frontend`

### Step 1: Add aria-live to RateLimitBanner

- **File**: `components/ui/RateLimitBanner.tsx`
- Add `role="alert"` and `aria-live="assertive"` to the root div (rate limit is an important, time-sensitive alert)

### Step 2: Add aria-live to inline error containers in auth forms

- **Files**: LoginForm.tsx (3 error containers), RegisterForm.tsx, ResetPasswordForm.tsx, MfaTotpStep.tsx (2), ForgotPasswordForm.tsx
- Add `role="alert"` and `aria-live="polite"` to the error container divs (the ones with `min-h-6 / h-6` pattern)

### Step 3: Add focus trap + dialog semantics to ConfirmModal

- **File**: `components/ui/ConfirmModal.tsx`
- Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` to modal panel
- Add focus trap: on open, focus first focusable element; trap Tab/Shift+Tab within modal; on close, restore focus to trigger
- Use a ref to track the previously focused element

### Step 4: Add focus trap + dialog semantics to DeleteAccount modal

- **File**: `components/profile/DeleteAccount.tsx`
- Same pattern as ConfirmModal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap

### Step 5: Build verification and documentation

- `next build` must compile clean
- Run `/update-docs SCRUM-204`

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: RateLimitBanner aria-live
3. Step 2: Inline error containers aria-live (6 files)
4. Step 3: ConfirmModal focus trap + dialog semantics
5. Step 4: DeleteAccount focus trap + dialog semantics
6. Step 5: Build verification + documentation

## Testing Checklist

- [ ] Screen reader announces error messages when they appear
- [ ] Screen reader announces rate limit banners
- [ ] ConfirmModal: focus trapped, Tab cycles within modal
- [ ] ConfirmModal: focus returns to trigger on close
- [ ] DeleteAccount modal: same focus trap behavior
- [ ] next build compiles clean
- [ ] No visual regressions

## Notes

- Use `role="alert"` which implies `aria-live="assertive"` — no need for both on most containers
- For error containers that use the `showError` conditional pattern, `aria-live="polite"` on the container div ensures the content is announced when it appears
- Focus trap implementation: pure JS/React, no external library needed
