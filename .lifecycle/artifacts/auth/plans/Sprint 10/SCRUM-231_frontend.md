# Frontend Implementation Plan: SCRUM-231 — Fix MFA Form A11y Gaps (FE-26)

## 1. Overview

Two minor accessibility gaps in auth frontend components flagged by audit check FE-26 (WCAG 2.1 AA). The overall a11y foundation is good — these are the only 2 missing attributes across all auth forms.

## 2. Architecture Context

- **MfaTotpStep.tsx**: MFA TOTP verification step component with recovery code fallback
- **Input.tsx**: Shared UI input component used across all auth forms
- Files verified against live code:
  - `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx` — line 148: recovery view error div has `role="alert"` + `aria-live="polite"` ✓; line 274: TOTP view error div missing both ✗
  - `nexacore-dashboard/src/components/ui/Input.tsx` — line 76: password toggle `tabIndex={-1}` ✗

## 3. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-231-frontend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-231-frontend`

### Step 1: Add aria attributes to TOTP error container

- **File**: `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx`
- **Action**: Add `role="alert"` and `aria-live="polite"` to the TOTP view error div at line 274
- **Implementation Steps**:
  1. Line 274: Change `<div className={...}>` to `<div role="alert" aria-live="polite" className={...}>`
- **Notes**: This matches the recovery view error container at line 148 which already has both attributes

### Step 2: Remove tabIndex={-1} from password toggle

- **File**: `nexacore-dashboard/src/components/ui/Input.tsx`
- **Action**: Remove `tabIndex={-1}` from the password toggle button at line 76
- **Implementation Steps**:
  1. Line 76: Delete `tabIndex={-1}`
- **Notes**: Buttons are keyboard-accessible by default (tabIndex=0). Removing the override enables keyboard-only users to toggle password visibility. The button already has `aria-label` for screen readers.

### Step 3: Verify Frontend Build

- **Action**: Run frontend build to ensure no issues
- **Implementation Steps**:
  1. Run `npm run build` in nexacore-dashboard — must pass

### Step 4: Update Technical Documentation

- **Action**: No documentation changes needed beyond integration-state changelog
- **Notes**: No API, data model, or architecture changes

## 4. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add aria attributes to TOTP error container
3. Step 2: Remove tabIndex from password toggle
4. Step 3: Verify frontend build
5. Step 4: Update documentation

## 5. Testing Checklist

- [ ] TOTP view error container has `role="alert"` and `aria-live="polite"`
- [ ] Recovery view error container still has both attributes (no regression)
- [ ] Password toggle button is keyboard-accessible (no tabIndex={-1})
- [ ] Password toggle still has `aria-label`
- [ ] Frontend build passes

## 6. Error Handling Patterns

N/A — no error handling changes.

## 7. UI/UX Considerations

- TOTP error messages will now be announced by screen readers (matching recovery view behavior)
- Password toggle becomes reachable via Tab key — keyboard-only users can now show/hide passwords
- No visual changes

## 8. Dependencies

- No new dependencies

## 9. Notes

- These are 2 attribute-level fixes — minimal risk, no logic changes
- The audit confirmed all other auth form a11y patterns are correct (labels, aria-invalid, aria-describedby, aria-live, role="alert", focus traps)

## 10. Next Steps After Implementation

- Run `/verify` to confirm plan compliance
- Run `/commit` to create commit
- Run `/update-docs` to create implementation record

## 11. Implementation Verification

- [ ] 2 aria attributes added to MfaTotpStep.tsx TOTP error div
- [ ] 1 tabIndex removed from Input.tsx toggle button
- [ ] Frontend build passes
- [ ] No visual regression
