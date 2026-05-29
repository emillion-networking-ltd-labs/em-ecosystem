# Frontend Implementation Plan: SCRUM-89 NIST SP 800-63B Full Compliance — Remove Password Composition UI

## Codebase State Snapshot

- **Date**: 2026-02-27
- **Last completed ticket**: SCRUM-88 frontend (removed special char indicator from 3 components)
- **Files verified against live code**:
  - `src/components/auth/RegisterForm.tsx:12-18` — PASSWORD_REQUIREMENTS: 4 items (long, number, upper, lower)
  - `src/components/auth/ResetPasswordForm.tsx:11-16` — PASSWORD_REQUIREMENTS: 4 items (same)
  - `src/components/profile/ChangePasswordForm.tsx:16-24` — strength meter: 3 criteria (length, uppercase, digit), 3 bars, labels `['', 'Weak', 'Fair', 'Strong']`

## Overview

Frontend companion to SCRUM-89 backend. After the backend removes all `@Matches` validators (keeping only `@MinLength(8)`), the frontend must reduce its password validation UI to show only the length requirement. Passwords of any composition will be accepted as long as they are 8+ characters.

## Architecture Context

### Components affected

| File | Current State | Target State |
|------|--------------|--------------|
| `src/components/auth/RegisterForm.tsx` | 4 icon indicators (length, number, upper, lower) | 1 icon indicator (length only) |
| `src/components/auth/ResetPasswordForm.tsx` | 4 icon indicators (same) | 1 icon indicator (length only) |
| `src/components/profile/ChangePasswordForm.tsx` | 3-bar strength meter (length, upper, digit) | Simple pass/fail text hint |

### Routing
- No routing changes. All 3 components are already rendered on existing pages.

### State management
- No state changes. Password `useState` and form submission logic are unchanged.

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch
- **Branch name**: `feature/SCRUM-89-frontend`
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-89-backend` (base branch — must have backend changes first)
  2. `git checkout -b feature/SCRUM-89-frontend`
  3. Verify: `git branch`
- **Note**: This branch depends on the backend branch. The backend must remove `@Matches` validators before the frontend removes the corresponding UI indicators.

---

### Step 1: Reduce RegisterForm to length-only indicator

- **File**: `src/components/auth/RegisterForm.tsx`
- **Action**: Remove number, upper, lower entries from PASSWORD_REQUIREMENTS
- **Implementation Steps**:
  1. Update import: remove `Hash`, `CaseUpper`, `CaseLower` from lucide-react. Keep `RulerDimensionLine`, `Check`, `AlertTriangle`.
  2. Replace PASSWORD_REQUIREMENTS array:
     ```typescript
     /* Password requirement — minimum 8 characters */
     const PASSWORD_REQUIREMENTS = [
       { key: 'long', Icon: RulerDimensionLine, test: (p: string) => p.length >= 8 },
     ] as const;
     ```
  3. Update comment from "4 criteria icons" to "1 criterion icon".
- **Implementation Notes**: The icon rendering loop (`PASSWORD_REQUIREMENTS.map(...)`) works with any array length — no changes needed to the JSX.

---

### Step 2: Reduce ResetPasswordForm to length-only indicator

- **File**: `src/components/auth/ResetPasswordForm.tsx`
- **Action**: Same changes as Step 1
- **Implementation Steps**:
  1. Update import: remove `Hash`, `CaseUpper`, `CaseLower` from lucide-react
  2. Replace PASSWORD_REQUIREMENTS to single length entry
- **Note**: Identical structure to RegisterForm.

---

### Step 3: Replace ChangePasswordForm strength meter with pass/fail hint

- **File**: `src/components/profile/ChangePasswordForm.tsx`
- **Action**: Remove the 3-criteria strength meter entirely. Replace with a simple pass/fail length hint.
- **Implementation Steps**:
  1. Remove the `passwordStrength` IIFE (lines 16-24):
     ```typescript
     // DELETE THIS BLOCK:
     const passwordStrength = (() => {
       if (!newPassword) return { level: 0, label: '' };
       let score = 0;
       if (newPassword.length >= 8) score++;
       if (/[A-Z]/.test(newPassword)) score++;
       if (/[0-9]/.test(newPassword)) score++;
       const labels = ['', 'Weak', 'Fair', 'Strong'];
       return { level: score, label: labels[score] };
     })();
     ```
  2. Replace the strength meter JSX block (the `{newPassword && (...)}` section with bars) with:
     ```tsx
     {newPassword && (
       <p className={`mt-1 text-xs ${newPassword.length >= 8 ? 'text-success' : 'text-error'}`}>
         {newPassword.length >= 8 ? 'Minimum length met' : 'Minimum 8 characters required'}
       </p>
     )}
     ```
  3. Remove the `passwordStrength.label` span (no longer exists).
- **Implementation Notes**: With a single criterion (length >= 8), a multi-bar strength meter conveys no useful information. A simple text hint is clearer and more honest about what the backend actually validates.

---

### Step 4: Verify build

- **Action**: Run Next.js production build
- **Command**: `npm run build`
- **Expected**: Build succeeds with 0 errors, 17 static pages generated.
- **Verify**: No unused import warnings for removed lucide-react icons.

---

### Step 5: Update Technical Documentation

- **Action**: Update SCRUM-89 implementation record with frontend section
- **Implementation Steps**:
  1. Append frontend section to `ai-specs/ai-specs/changes/records/SCRUM-89_fullstack.md`
  2. Document the 3 component changes and rationale
- **Notes**: No `frontend-standards.mdc` changes needed — no new patterns introduced.

## Implementation Order

1. Step 0: Create branch `feature/SCRUM-89-frontend` (from `feature/SCRUM-89-backend`)
2. Step 1: RegisterForm — reduce to length-only
3. Step 2: ResetPasswordForm — reduce to length-only
4. Step 3: ChangePasswordForm — replace strength meter with pass/fail hint
5. Step 4: Verify build
6. Step 5: Documentation

## Testing Checklist

- [ ] RegisterForm displays exactly 1 password requirement indicator (length >= 8)
- [ ] ResetPasswordForm displays exactly 1 password requirement indicator
- [ ] ChangePasswordForm shows "Minimum 8 characters required" when password < 8 chars
- [ ] ChangePasswordForm shows "Minimum length met" (green) when password >= 8 chars
- [ ] No strength meter bars visible in ChangePasswordForm
- [ ] Password without uppercase/digits accepted in all forms (no client-side rejection)
- [ ] Password with uppercase/digits still accepted (no regression)
- [ ] No console errors or warnings
- [ ] No unused imports (Hash, CaseUpper, CaseLower removed)
- [ ] `npm run build` completes without errors

## UI/UX Considerations

- **RegisterForm / ResetPasswordForm**: Single icon (RulerDimensionLine) with check overlay when length >= 8. Clean, minimal UI.
- **ChangePasswordForm**: Text-based hint is less visually complex than bars but more informative. Green/red color follows existing design system tokens (`text-success`, `text-error`).
- **Responsive**: No responsive changes needed — all components are already responsive.
- **Accessibility**: Text hint is screen-reader friendly (no semantic change needed).

## Dependencies

- None. No new libraries required. Only removing existing lucide-react icon imports.

## Notes

- **Low risk**: Purely subtractive UI changes — removing indicators and simplifying.
- **No form submission logic changes**: The forms submit to the same backend endpoints. Only visual indicators change.
- **Backend dependency**: The backend must remove `@Matches` validators first. If frontend deploys before backend, passwords meeting only the length requirement would be rejected by the API.

## Implementation Verification

- [ ] Only `RulerDimensionLine` icon remains in RegisterForm and ResetPasswordForm imports
- [ ] `Hash`, `CaseUpper`, `CaseLower` removed from all imports
- [ ] `passwordStrength` IIFE removed from ChangePasswordForm
- [ ] Strength meter bars (`[1, 2, 3].map(...)`) removed from ChangePasswordForm
- [ ] Pass/fail text hint renders correctly
- [ ] `next build` clean (17 pages, 0 errors)
- [ ] Implementation record updated
