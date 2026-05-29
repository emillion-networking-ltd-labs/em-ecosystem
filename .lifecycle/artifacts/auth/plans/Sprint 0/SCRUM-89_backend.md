# Backend Implementation Plan: SCRUM-89 NIST SP 800-63B Full Compliance — Remove Password Composition Requirements

## Codebase State Snapshot

- **Date**: 2026-02-27
- **Last completed ticket**: SCRUM-88 fullstack (frontend + tsconfig bugfix on `feature/SCRUM-88-frontend`)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/dto/register.dto.ts:17-28` — has `@MinLength(8)` + 3x `@Matches` (lowercase, uppercase, digit) on `password`
  - `src/auth/dto/reset-password.dto.ts:19-29` — has `@MinLength(8)` + 3x `@Matches` on `newPassword`
  - `src/users/dto/change-password.dto.ts:8-18` — has `@MinLength(8)` + 3x `@Matches` on `newPassword`
  - `src/auth/tests/auth.service.spec.ts` — uses `'StrongPass1!'` (still valid with only `@MinLength(8)`)
  - `src/auth/tests/auth.controller.spec.ts` — uses `'StrongPass1!'` (same)
- **Constructor signatures verified**: No new services/guards involved — only DTO decorator changes
- **Guard dependency chain verified**: N/A — no guard changes in this ticket

## Overview

NIST SP 800-63B §5.1.1 and ASVS v4.0 req 2.1.1 recommend against enforcing password composition rules. SCRUM-88 removed the special character `@Matches` validator. This ticket completes compliance by removing the 3 remaining `@Matches` validators (lowercase, uppercase, digit) from all password DTOs.

After this ticket, the only password validation rule is `@MinLength(8)`.

## Architecture Context

### Modules involved
- **AuthModule** — owns `RegisterDto`, `ResetPasswordDto`
- **UsersModule** — owns `ChangePasswordDto`

### Components affected
- 3 DTO files (decorator removal only)
- 0 services, 0 controllers, 0 guards, 0 modules

### Files referenced
| File | Change |
|------|--------|
| `src/auth/dto/register.dto.ts` | Remove 3x `@Matches`, remove `Matches` import, update `@ApiProperty` description |
| `src/auth/dto/reset-password.dto.ts` | Remove 3x `@Matches`, remove `Matches` import, update `@ApiProperty` description |
| `src/users/dto/change-password.dto.ts` | Remove 3x `@Matches`, remove `Matches` import |

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch
- **Branch name**: `feature/SCRUM-89-backend`
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-88-frontend` (base branch with all prior auth work)
  2. `git checkout -b feature/SCRUM-89-backend`
  3. Verify: `git branch`

---

### Step 1: Remove composition validators from RegisterDto

- **File**: `src/auth/dto/register.dto.ts`
- **Action**: Remove all 3 `@Matches` decorators from `password` field
- **Implementation Steps**:
  1. Remove line: `@Matches(/(?=.*[a-z])/, { message: 'Password must contain at least one lowercase letter' })`
  2. Remove line: `@Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' })`
  3. Remove line: `@Matches(/(?=.*\d)/, { message: 'Password must contain at least one number' })`
  4. Update import: `import { IsEmail, IsString, MinLength } from 'class-validator'` (remove `Matches`)
  5. Update `@ApiProperty` description to: `'Password — minimum 8 characters'`
  6. Update `@ApiProperty` example to: `'mypassword1'`
- **Resulting field**:
  ```typescript
  @ApiProperty({
    description: 'Password — minimum 8 characters',
    example: 'mypassword1',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
  ```

---

### Step 2: Remove composition validators from ResetPasswordDto

- **File**: `src/auth/dto/reset-password.dto.ts`
- **Action**: Same changes as Step 1, applied to `newPassword` field
- **Implementation Steps**:
  1. Remove 3x `@Matches` decorators from `newPassword`
  2. Update import: remove `Matches` (keep `IsString, MinLength, IsNotEmpty`)
  3. Update `@ApiProperty` description to: `'New password — minimum 8 characters'`
  4. Update example to: `'mynewpassword1'`

---

### Step 3: Remove composition validators from ChangePasswordDto

- **File**: `src/users/dto/change-password.dto.ts`
- **Action**: Same changes as Step 1, applied to `newPassword` field
- **Implementation Steps**:
  1. Remove 3x `@Matches` decorators from `newPassword`
  2. Update import: remove `Matches` (keep `IsString, MinLength`)
- **Note**: This DTO has no `@ApiProperty` — no description to update.

---

### Step 4: Verify tests pass

- **Action**: Run the full test suite
- **Command**: `npx jest --passWithNoTests`
- **Expected**: All 395 tests pass. No test specifically validates composition rules.
- **Note**: Test passwords like `'StrongPass1!'` already satisfy `@MinLength(8)` — no test changes needed.

---

### Step 5: Verify build

- **Action**: Clean build
- **Command**: `rm -rf dist && npx nest build`
- **Expected**: Build succeeds with 0 errors.

---

### Step 6: Update Technical Documentation

- **Action**: Update api-spec.yml and create implementation record
- **Implementation Steps**:
  1. Update `ai-specs/specs/api-spec.yml`:
     - `RegisterDto` schema: update `password.description` to `'Minimum 8 characters. No composition requirements enforced.'`
     - `ResetPasswordDto` schema: update `newPassword.description` to same
  2. Create `ai-specs/ai-specs/changes/records/SCRUM-89_fullstack.md` with implementation details
- **Notes**: No `integration-state.md` changes needed (no module/guard/service changes).

## Implementation Order

1. Step 0: Create branch `feature/SCRUM-89-backend`
2. Step 1: RegisterDto
3. Step 2: ResetPasswordDto
4. Step 3: ChangePasswordDto
5. Step 4: Run tests
6. Step 5: Verify build
7. Step 6: Documentation

## Testing Checklist

- [ ] All 395 existing tests pass
- [ ] `nest build` succeeds
- [ ] Password `'alllowercase'` (8+ chars, no uppercase/digit) passes validation in RegisterDto
- [ ] Password `'ALLUPPERCASE'` (8+ chars, no lowercase/digit) passes validation
- [ ] Password `'12345678'` (8+ chars, digits only) passes validation
- [ ] Password `'short'` (< 8 chars) still rejected
- [ ] Password `'StrongPass1!'` still accepted (no regression)

## Error Response Format

Unchanged. The only remaining validation error is:
```json
{
  "statusCode": 400,
  "message": ["Password must be at least 8 characters"],
  "error": "Bad Request"
}
```

## Dependencies

- None. No new libraries required. Only removing decorators.

## Notes

- **Low risk**: Removing validators is purely subtractive — no new code paths, no new dependencies.
- **No migration needed**: No database schema changes. Existing passwords in the database are unaffected.
- **HIBP integration**: Checking passwords against breach databases (NIST recommendation) is out of scope for this ticket and can be a future enhancement.

## Implementation Verification

- [ ] `Matches` import removed from all 3 DTO files
- [ ] No `@Matches` decorators remain in any DTO
- [ ] `@MinLength(8)` preserved in all 3 DTOs
- [ ] `@ApiProperty` descriptions updated in RegisterDto and ResetPasswordDto
- [ ] All 395 tests pass
- [ ] `nest build` clean
- [ ] api-spec.yml password descriptions updated
