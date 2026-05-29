# Frontend Implementation Plan: SCRUM-88 Auth Security Hardening — Compliance Remediation

## Codebase State Snapshot

- **Date**: 2026-02-27
- **Last completed ticket**: Security Compliance Audit (backend fixes in commit `eaf0bff`)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/components/auth/RegisterForm.tsx:13-19` — PASSWORD_REQUIREMENTS array with 5 items including `special: /[^a-zA-Z0-9]/`
  - `src/components/auth/ResetPasswordForm.tsx:11-17` — Same PASSWORD_REQUIREMENTS array
  - `src/components/profile/ChangePasswordForm.tsx:16-25` — Password strength meter with `if (/[^A-Za-z0-9]/.test(newPassword)) score++`
  - `src/lib/csrf.ts` — Token fetched via `GET /auth/csrf-token`, cached in memory, sent as `X-CSRF-Token` header
  - `src/lib/api.ts` — CSRF methods: POST, PUT, PATCH, DELETE. Does NOT read `__csrf` cookie

## Overview

Frontend companion to SCRUM-88 backend plan. Only 1 item requires frontend changes:

- **F-09**: The backend removes the special character password requirement (`@Matches(/(?=.*[@$!%*?&])/)`). The frontend must remove the "special character" indicator from password validation UI to avoid showing a requirement the backend no longer enforces.

**W-02 (CSRF cookie)**: No frontend change required. The dashboard reads the CSRF token from `GET /auth/csrf-token` JSON response, not from the `__csrf` cookie. Changing `httpOnly` on the cookie has zero impact on the current flow.

## Architecture Context

### Current state

The dashboard displays password requirements as visual indicators (icons + text) in 3 components. Each has a `PASSWORD_REQUIREMENTS` array or inline strength logic that checks for special characters.

The special character regex used is `/[^a-zA-Z0-9]/` — this is already permissive (accepts ALL non-alphanumeric characters, not just `@$!%*?&`). So no passwords are being incorrectly rejected on the client side. The issue is purely **UX alignment**: after the backend removes the requirement, the frontend should stop showing it as mandatory.

### Files affected (3 files)

| File | Change |
|------|--------|
| `src/components/auth/RegisterForm.tsx` | Remove `special` entry from PASSWORD_REQUIREMENTS |
| `src/components/auth/ResetPasswordForm.tsx` | Remove `special` entry from PASSWORD_REQUIREMENTS |
| `src/components/profile/ChangePasswordForm.tsx` | Remove special char check from strength meter |

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a feature branch
- **Branch name**: `feature/SCRUM-88-frontend`
- **Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-88-frontend`

---

### Step 1: Remove special character requirement from RegisterForm

- **File**: `src/components/auth/RegisterForm.tsx`
- **Action**: Remove the `special` entry from the `PASSWORD_REQUIREMENTS` array
- **Current code** (lines 13-19):
  ```typescript
  const PASSWORD_REQUIREMENTS = [
    { key: 'long',    Icon: RulerDimensionLine, test: (p: string) => p.length >= 8 },
    { key: 'number',  Icon: Hash,               test: (p: string) => /\d/.test(p) },
    { key: 'special', Icon: Asterisk,           test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
    { key: 'upper',   Icon: CaseUpper,          test: (p: string) => /[A-Z]/.test(p) },
    { key: 'lower',   Icon: CaseLower,          test: (p: string) => /[a-z]/.test(p) },
  ] as const;
  ```
- **New code**: Remove the `{ key: 'special', ... }` line entirely.
- **Also**: Remove the `Asterisk` icon import if it's no longer used elsewhere in the file.
- **Also**: Check if there are i18n/translation keys for `'special'` that should be cleaned up.

---

### Step 2: Remove special character requirement from ResetPasswordForm

- **File**: `src/components/auth/ResetPasswordForm.tsx`
- **Action**: Same change as Step 1 — remove the `special` entry from PASSWORD_REQUIREMENTS
- **Current code** (lines 11-17): Same structure as RegisterForm
- **New code**: Remove the `{ key: 'special', ... }` line. Remove unused `Asterisk` import.

---

### Step 3: Remove special character from ChangePasswordForm strength meter

- **File**: `src/components/profile/ChangePasswordForm.tsx`
- **Action**: Remove the special character score increment from the strength calculation
- **Current code** (lines 16-25):
  ```typescript
  const passwordStrength = (() => {
    if (!newPassword) return { level: 0, label: '' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return { level: score, label: labels[score] };
  })();
  ```
- **New code**: Remove `if (/[^A-Za-z0-9]/.test(newPassword)) score++;`
- **Update labels array**: With only 3 criteria (length, uppercase, digit), max score is 3. Update:
  ```typescript
  const labels = ['', 'Weak', 'Fair', 'Strong'];
  ```
- **Note**: The strength meter becomes a 3-level indicator instead of 4-level. This is acceptable since special characters are no longer required.

---

### Step 4: Verify and test

- **Action**: Verify the forms render correctly and validation works as expected
- **Tests**:
  1. RegisterForm: only 4 requirement indicators shown (length, number, uppercase, lowercase)
  2. ResetPasswordForm: same 4 indicators
  3. ChangePasswordForm: strength meter shows 3 levels (Weak/Fair/Strong)
  4. Password `Test1234` (no special char) is accepted in all 3 forms
  5. Password `Test1234!` (with special char) still accepted (no regression)
  6. No unused imports or dead code left behind

---

### Step 5: Update Technical Documentation

- **File**: `ai-specs/ai-specs/changes/records/SCRUM-88_record.md` (append frontend section to the backend record)
- Document the 3 component changes and the rationale (alignment with backend F-09)

## Implementation Order

1. Step 0: Create branch `feature/SCRUM-88-frontend`
2. Step 1: RegisterForm
3. Step 2: ResetPasswordForm
4. Step 3: ChangePasswordForm
5. Step 4: Test all 3 forms
6. Step 5: Documentation

## Testing Checklist

- [ ] RegisterForm displays 4 password requirements (no "special character")
- [ ] ResetPasswordForm displays 4 password requirements
- [ ] ChangePasswordForm strength meter shows 3 levels
- [ ] Password without special characters accepted in all forms
- [ ] Password with special characters still accepted (no regression)
- [ ] No console errors or warnings
- [ ] No unused imports
- [ ] `npm run build` completes without errors

## Dependencies

- None. No new libraries required.
- This plan depends on the backend F-09 change being deployed first (or simultaneously).

## Notes

- **Low risk**: These are cosmetic/UX changes only. The client-side already accepts all special characters via `/[^a-zA-Z0-9]/`. Removing the indicator simply aligns the UI with the backend's relaxed requirement.
- **W-02 (CSRF cookie)**: Intentionally excluded. The current `GET /auth/csrf-token` flow works correctly and is unaffected by the backend's `httpOnly: false` change. A future optimization to read from the cookie can be planned separately if desired.
- **No form submission logic changes**: The forms submit to the same backend endpoints. Only the visual validation indicators change.
