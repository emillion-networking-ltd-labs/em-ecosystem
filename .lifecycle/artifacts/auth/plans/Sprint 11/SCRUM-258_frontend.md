# Frontend Implementation Plan: SCRUM-258 Frontend A11y Batch C (FE-26)

## Overview

Fix 5 a11y attribute gaps across 2 React components to achieve WCAG 2.1 Level A compliance (1.3.1 Info and Relationships, 4.1.2 Name/Role/Value). All changes are HTML attribute additions — no visual, behavioral, or structural changes.

## Architecture Context

- **Components affected**: `MfaTotpStep.tsx` (4 fixes), `ConnectedAccounts.tsx` (1 fix)
- **Files referenced**:
  - `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx` — MFA TOTP verification step
  - `nexacore-dashboard/src/components/profile/ConnectedAccounts.tsx` — OAuth provider management
- **Routing**: No changes
- **State management**: No changes

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create feature branch from latest main
- **Branch Naming**: `feature/SCRUM-258-frontend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-258-frontend`
  3. `git branch` — verify

### Step 1: Add role="group" to TOTP Digit Container

- **File**: `src/components/auth/MfaTotpStep.tsx`
- **Action**: Add `role="group"` and `aria-label` to the 6-digit code input container
- **Implementation Steps**:
  1. Line 248: Change `<div className="flex gap-2" onPaste={handlePaste}>` to:
     ```tsx
     <div className="flex gap-2" role="group" aria-label="Verification code digits" onPaste={handlePaste}>
     ```
  2. This groups the 6 individual digit inputs semantically for screen readers

### Step 2: Add Explicit htmlFor/id to TOTP Trust Checkbox

- **File**: `src/components/auth/MfaTotpStep.tsx`
- **Action**: Add explicit `htmlFor`/`id` binding to the TOTP view trust checkbox
- **Implementation Steps**:
  1. Line 291-301: Change the implicit label wrapping to explicit binding:
     ```tsx
     <label htmlFor="trust-totp" className="flex cursor-pointer items-center gap-2">
       <input
         id="trust-totp"
         type="checkbox"
         ...
       />
     ```

### Step 3: Add Explicit htmlFor/id to Recovery Trust Checkbox

- **File**: `src/components/auth/MfaTotpStep.tsx`
- **Action**: Same fix as Step 2 but for the recovery code view
- **Implementation Steps**:
  1. Line 168-178: Change to explicit binding:
     ```tsx
     <label htmlFor="trust-recovery" className="flex cursor-pointer items-center gap-2">
       <input
         id="trust-recovery"
         type="checkbox"
         ...
       />
     ```

### Step 4: Add htmlFor/id to Recovery Code Label+Input

- **File**: `src/components/auth/MfaTotpStep.tsx`
- **Action**: Bind the "Recovery Code" label to its input
- **Implementation Steps**:
  1. Line 124: Add `htmlFor="recovery-code"`:
     ```tsx
     <label htmlFor="recovery-code" className="text-[15px] font-semibold leading-[22px] text-content-primary">
     ```
  2. Line 128-138: Add `id="recovery-code"` to the input:
     ```tsx
     <input
       id="recovery-code"
       type="text"
       value={recoveryCode}
       ...
     ```

### Step 5: Add Dialog ARIA Attributes to Disconnect Modal

- **File**: `src/components/profile/ConnectedAccounts.tsx`
- **Action**: Add `role="dialog"`, `aria-modal`, and `aria-labelledby` to the disconnect confirmation modal
- **Implementation Steps**:
  1. Line 216: Add `id="disconnect-title"` to the modal heading:
     ```tsx
     <h2 id="disconnect-title" className="text-heading-md text-content-primary">
     ```
  2. Line 213: Add dialog attributes to the modal container:
     ```tsx
     <div
       role="dialog"
       aria-modal="true"
       aria-labelledby="disconnect-title"
       className="w-[427px] overflow-hidden rounded-3xl border border-border-default bg-surface-secondary shadow-card"
     >
     ```

### Step 6: Verify Tests and Build

- **Action**: Run existing frontend tests
- **Implementation Steps**:
  1. `cd nexacore-dashboard && npx jest --maxWorkers=1 --forceExit` — all tests must pass
  2. `npx next build` — build must succeed
  3. No test file changes expected — existing tests use `getByRole('checkbox')` which remains valid

### Step 7: Update Technical Documentation

- **Action**: No documentation changes needed
- **Notes**: Attribute-only changes — no API, routing, state, or component structure changes. `integration-state.md` unaffected (frontend-only, no module/guard/DI changes).

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: TOTP digit container `role="group"`
3. Step 2: TOTP trust checkbox `htmlFor`/`id`
4. Step 3: Recovery trust checkbox `htmlFor`/`id`
5. Step 4: Recovery code label `htmlFor`/`id`
6. Step 5: Disconnect modal `role="dialog"`
7. Step 6: Verify tests and build
8. Step 7: Documentation review (no changes needed)

## Testing Checklist

- [ ] `MfaTotpStep.test.tsx` — all existing tests pass (checkbox queries unaffected)
- [ ] `ConnectedAccounts.test.tsx` — all existing tests pass (modal queries unaffected)
- [ ] `next build` compiles clean
- [ ] Manual: TOTP digit group announced as group by screen reader
- [ ] Manual: Trust checkboxes have accessible names
- [ ] Manual: Recovery code input focusable via label click
- [ ] Manual: Disconnect modal announced as dialog

## Error Handling Patterns

No changes — attribute-only additions.

## UI/UX Considerations

- **Visual impact**: Zero — all changes are invisible ARIA attributes
- **Accessibility**: WCAG 2.1 Level A compliance for:
  - 1.3.1 Info and Relationships (role="group", role="dialog", htmlFor/id)
  - 4.1.2 Name/Role/Value (aria-label, aria-modal, aria-labelledby)
- **Responsive**: No impact
- **Loading states**: No impact

## Dependencies

No new dependencies required.

## Notes

- All 5 fixes are additive (new attributes only) — zero risk of visual or behavioral regression
- `htmlFor` + `id` pattern supplements the existing implicit `<label>` wrapping — both approaches work, but explicit binding is recommended per WCAG
- The disconnect modal in `ConnectedAccounts.tsx` already has Escape key handling (line 106-111) and click-outside-to-close (line 209-211) — only missing ARIA semantics

## Next Steps After Implementation

1. Run `/verify SCRUM-258` to validate completeness
2. Run `/commit SCRUM-258` to merge
3. Run `/update-docs SCRUM-258` to record implementation

## Implementation Verification

- [ ] **Code Quality**: All 5 a11y gaps addressed with correct ARIA attributes
- [ ] **Functionality**: No visual or behavioral changes
- [ ] **Testing**: All existing tests pass without modification
- [ ] **Integration**: No API, state, or routing changes
- [ ] **Accessibility**: WCAG 2.1 Level A: 1.3.1 + 4.1.2 satisfied
