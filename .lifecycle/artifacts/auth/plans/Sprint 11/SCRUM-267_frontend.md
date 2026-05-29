# Frontend Implementation Plan: SCRUM-267 Frontend Error Boundaries + A11y

## 1. Overview

Add a route-specific error boundary for the `/profile` route and fix accessibility gaps (WCAG 2.1 Level A) in 4 profile components. This addresses audit findings FE-24 (error boundaries) and FE-26 (a11y: aria-live, focus trap).

**Detected scope: frontend**

## 2. Architecture Context

- **Route**: `src/app/profile/` — single `page.tsx`, no existing `error.tsx`
- **Global error boundary**: `src/app/error.tsx` — exists, catches all unhandled errors
- **Components to modify**:
  - `src/components/profile/ConnectedAccounts.tsx` — disconnect modal missing focus trap
  - `src/components/profile/ChangePasswordForm.tsx:127` — inline error missing `aria-live` + `role="alert"`
  - `src/components/profile/ActiveSessions.tsx:121` — error text missing `aria-live` + `role="alert"`
  - `src/components/profile/MfaSetup.tsx:369` — error text missing `aria-live` + `role="alert"`

## 3. Implementation Steps

### Step 0: Create Feature Branch

- **Branch**: `feature/SCRUM-267-frontend`
- **From**: latest `main`
- **Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-267-frontend`

### Step 1: Create Profile Route Error Boundary

- **File**: `src/app/profile/error.tsx` (NEW)
- **Action**: Create a route-specific error boundary for the profile route
- **Implementation Steps**:
  1. Create `error.tsx` as a `"use client"` component (Next.js requirement)
  2. Accept `{ error, reset }` props (Next.js Error Boundary signature)
  3. Render a profile-contextualized error message inside a card layout consistent with other profile components (rounded-2xl, border, shadow-card)
  4. Include "Try again" button calling `reset()` and "Go to dashboard" link
  5. Log error in `useEffect` for dev observability
  6. In production, show generic message; in development, show `error.message`
- **Implementation Notes**:
  - Follow the same pattern as `src/app/error.tsx` but with profile-specific messaging and simpler layout (no full-screen, just a card)
  - Use existing `Button` component from `@/components/ui/Button`

### Step 2: Add Focus Trap to ConnectedAccounts Disconnect Modal

- **File**: `src/components/profile/ConnectedAccounts.tsx`
- **Action**: Add keyboard focus trap when disconnect modal is open
- **Implementation Steps**:
  1. Add a `useEffect` that runs when `disconnectingProvider` is truthy:
     - On open: save `document.activeElement` as `previousFocus`, query all focusable elements inside the dialog (`button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`), focus the first one
     - On Tab: cycle focus within the dialog (wrap last→first, Shift+Tab first→last)
     - On close (cleanup): restore focus to `previousFocus`
  2. The existing `Escape` keydown handler already calls `handleClose()` — no change needed there
- **Implementation Notes**:
  - The dialog already has `role="dialog"`, `aria-modal="true"`, `aria-labelledby="disconnect-title"` — those are correct
  - Focus trap must handle both Tab and Shift+Tab
  - Use a ref to the dialog `<div>` (the inner one with `role="dialog"`) to scope `querySelectorAll`

### Step 3: Add aria-live to ChangePasswordForm Error

- **File**: `src/components/profile/ChangePasswordForm.tsx`
- **Action**: Add `aria-live="polite"` and `role="alert"` to the error `<p>` at line 127
- **Current code** (line 127):
  ```tsx
  {localError && <p className="text-caption text-error">{localError}</p>}
  ```
- **New code**:
  ```tsx
  {localError && <p className="text-caption text-error" role="alert" aria-live="polite">{localError}</p>}
  ```
- **Implementation Notes**: Single-line change. `role="alert"` implies `aria-live="assertive"` but we add `aria-live="polite"` explicitly for screen readers that need it — non-critical form errors should be polite, not assertive.

### Step 4: Add aria-live to ActiveSessions Error

- **File**: `src/components/profile/ActiveSessions.tsx`
- **Action**: Add `aria-live="polite"` and `role="alert"` to the error `<p>` at line 121
- **Current code** (line 121):
  ```tsx
  <p className="py-4 text-center text-body-sm text-error">
    Failed to load sessions.
  </p>
  ```
- **New code**:
  ```tsx
  <p className="py-4 text-center text-body-sm text-error" role="alert" aria-live="polite">
    Failed to load sessions.
  </p>
  ```

### Step 5: Add aria-live to MfaSetup Error

- **File**: `src/components/profile/MfaSetup.tsx`
- **Action**: Add `aria-live="polite"` and `role="alert"` to the error `<p>` at line 369
- **Current code** (line 369):
  ```tsx
  {error && <p className="text-caption text-error">{error}</p>}
  ```
- **New code**:
  ```tsx
  {error && <p className="text-caption text-error" role="alert" aria-live="polite">{error}</p>}
  ```

### Step 6: Update Technical Documentation

- **Action**: Review and document changes
- **Implementation Steps**:
  1. No api-spec.yml changes (no API changes)
  2. No frontend-standards.mdc changes needed (a11y patterns already documented)
  3. Changes are purely presentational/a11y — no state management or routing changes

## 4. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create `src/app/profile/error.tsx`
3. Step 2: Add focus trap to ConnectedAccounts modal
4. Step 3: Add aria-live to ChangePasswordForm
5. Step 4: Add aria-live to ActiveSessions
6. Step 5: Add aria-live to MfaSetup
7. Step 6: Documentation review

## 5. Testing Checklist

- [ ] `npm run build` compiles clean (no TypeScript errors)
- [ ] Profile page loads normally — no regressions
- [ ] Error boundary: Verify `error.tsx` renders by temporarily throwing in a profile component (dev only)
- [ ] Focus trap: Open disconnect modal → Tab cycles within modal → Escape closes → focus returns to trigger button
- [ ] Screen reader: Error messages in ChangePasswordForm, ActiveSessions, MfaSetup are announced when they appear

## 6. Error Handling Patterns

- **Profile error boundary**: Shows user-friendly card with "Try again" + "Go to dashboard" actions
- **Error messages**: All inline error `<p>` elements now use `role="alert" aria-live="polite"` for screen reader announcement

## 7. UI/UX Considerations

- **Accessibility (WCAG 2.1 Level A)**:
  - Focus trap in modal dialogs (Success Criterion 2.4.3 Focus Order)
  - `aria-live` regions for dynamic error messages (Success Criterion 4.1.3 Status Messages)
  - `role="alert"` for error state changes
- **No visual changes**: All modifications are purely semantic/behavioral

## 8. Dependencies

- No new dependencies required
- Uses existing `Button` component, standard React hooks

## 9. Notes

- The global `error.tsx` already exists as a catch-all. The profile-specific one provides a better UX for profile-scoped errors (stays within dashboard layout context)
- `aria-live="polite"` chosen over `"assertive"` — form validation errors should not interrupt current screen reader output
- Focus trap implementation should be inline (no new utility) since it's the only modal that needs it. If more modals need focus traps in future, extract to a shared hook

## 10. Next Steps After Implementation

- Run `/verify` to validate plan compliance and a11y correctness
- Run `/commit` to merge

## 11. Implementation Verification

- [ ] **Code Quality**: No TypeScript errors, consistent with existing component patterns
- [ ] **Functionality**: Error boundary catches profile errors, focus trap works, aria-live announced
- [ ] **Testing**: Build passes, manual a11y verification
- [ ] **Integration**: Profile page renders all components correctly, no regressions
- [ ] **Documentation**: Record created, integration-state updated if needed
