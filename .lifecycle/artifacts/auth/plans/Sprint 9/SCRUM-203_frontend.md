# Frontend Implementation Plan: SCRUM-203 Sync frontend password validation with backend rules

## Overview

Add client-side password validation to all 3 password forms in the dashboard to match backend DTO rules exactly: minimum 8 characters, maximum 128 characters. Currently RegisterForm and ResetPasswordForm have no length validation, and ChangePasswordForm shows visual feedback but doesn't block submission.

## Architecture Context

- Components affected: `RegisterForm.tsx`, `ResetPasswordForm.tsx`, `ChangePasswordForm.tsx`
- No new components, no API changes, no routing changes
- Validation rules: `@MinLength(8)` + `@MaxLength(128)` from backend DTOs (register.dto.ts, reset-password.dto.ts)
- No composition requirements (no uppercase/lowercase/digit/special char)

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-203-frontend` from latest `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-203-frontend`

### Step 1: Create shared password validation constants

- **File**: `nexacore-dashboard/src/lib/validation.ts`
- **Action**: Create a minimal shared validation module with password rules matching backend DTOs
- **Implementation Steps**:
  1. Create file with:
     ```typescript
     export const PASSWORD_MIN_LENGTH = 8;
     export const PASSWORD_MAX_LENGTH = 128;

     export function validatePassword(password: string): string | null {
       if (!password) return 'Enter your password';
       if (password.length < PASSWORD_MIN_LENGTH)
         return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
       if (password.length > PASSWORD_MAX_LENGTH)
         return `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`;
       return null;
     }
     ```
- **Implementation Notes**: Constants match backend `@MinLength(8)` and `@MaxLength(128)`. Error messages match backend DTO messages for consistency.

### Step 2: Update RegisterForm.tsx

- **File**: `nexacore-dashboard/src/components/auth/RegisterForm.tsx`
- **Action**: Replace empty-check with `validatePassword()` call
- **Implementation Steps**:
  1. Add import: `import { validatePassword } from '@/lib/validation';`
  2. In `handleRegister`, replace lines 54-56:
     ```typescript
     // Before:
     if (!formData.password) {
       setPasswordError("Enter your password");
       return;
     }
     // After:
     const pwError = validatePassword(formData.password);
     if (pwError) {
       setPasswordError(pwError);
       return;
     }
     ```
- **Implementation Notes**: No visual changes — error still shows in the existing System Message slot via `passwordError` state.

### Step 3: Update ResetPasswordForm.tsx

- **File**: `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx`
- **Action**: Add password length validation before the match check
- **Implementation Steps**:
  1. Add import: `import { validatePassword } from '@/lib/validation';`
  2. In `handleSubmit`, after the `if (!password)` check (line 59-61), add password validation:
     ```typescript
     // After the existing empty check, replace it with:
     const pwError = validatePassword(password);
     if (pwError) {
       setLocalError(pwError);
       return;
     }
     ```
  3. Remove the now-redundant `if (!password)` check since `validatePassword` handles it.
- **Implementation Notes**: The empty + match checks still apply. The new validation sits between empty and match checks.

### Step 4: Update ChangePasswordForm.tsx

- **File**: `nexacore-dashboard/src/components/profile/ChangePasswordForm.tsx`
- **Action**: Block form submission when password validation fails (currently only shows visual feedback)
- **Implementation Steps**:
  1. Add import: `import { validatePassword } from '@/lib/validation';`
  2. Import constants: `import { PASSWORD_MIN_LENGTH } from '@/lib/validation';`
  3. In `handleSubmit`, add password validation before the match check (line 27):
     ```typescript
     const pwError = validatePassword(newPassword);
     if (pwError) {
       setLocalError(pwError);
       return;
     }
     ```
  4. Update the visual feedback (lines 84-88) to use the shared constant:
     ```typescript
     {newPassword && (
       <p className={`mt-1 text-xs ${newPassword.length >= PASSWORD_MIN_LENGTH ? 'text-success' : 'text-error'}`}>
         {newPassword.length >= PASSWORD_MIN_LENGTH ? 'Minimum length met' : `Minimum ${PASSWORD_MIN_LENGTH} characters required`}
       </p>
     )}
     ```
- **Implementation Notes**: Keeps the existing visual feedback but also blocks submission. Uses shared constant instead of hardcoded `8`.

### Step 5: Update Technical Documentation

- **Action**: Run `/update-docs SCRUM-203` after implementation

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create `lib/validation.ts` with shared password rules
3. Step 2: Update RegisterForm.tsx
4. Step 3: Update ResetPasswordForm.tsx
5. Step 4: Update ChangePasswordForm.tsx
6. Step 5: Update documentation

## Testing Checklist

- [ ] RegisterForm: password < 8 chars shows error, blocks submission
- [ ] RegisterForm: password > 128 chars shows error, blocks submission
- [ ] RegisterForm: password 8-128 chars allows submission
- [ ] ResetPasswordForm: password < 8 chars shows error, blocks submission
- [ ] ResetPasswordForm: password mismatch still shows error
- [ ] ChangePasswordForm: password < 8 chars shows error AND blocks submission
- [ ] ChangePasswordForm: visual feedback still works (green/red text)
- [ ] No regressions: valid passwords submit successfully on all forms

## Error Handling Patterns

- All errors displayed in existing UI slots (System Message area or inline text)
- Error messages match backend DTO messages exactly
- Errors clear on input change (existing behavior preserved)

## Dependencies

No new dependencies.

## Notes

- **Backend rules are source of truth**: `@MinLength(8)`, `@MaxLength(128)`, no composition requirements
- **No composition checks added**: The design system shows 5-icon password strength indicator, but that's a separate feature — backend doesn't enforce composition rules
- **Shared utility is minimal**: Only password validation for now, can be extended later if needed

## Next Steps After Implementation

1. Run `/update-docs SCRUM-203`
2. Create PR, merge to main
3. Transition SCRUM-203 to Done
4. Proceed with SCRUM-204

## Implementation Verification

- [ ] All 3 forms validate password length (8-128) before submission
- [ ] Error messages match backend DTO messages
- [ ] Shared validation utility used consistently
- [ ] No UI regressions
- [ ] Documentation updated
