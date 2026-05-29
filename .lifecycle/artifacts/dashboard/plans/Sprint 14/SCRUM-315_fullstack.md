# Fullstack Implementation Plan: SCRUM-315 Enforce Single SUPERADMIN

## Overview

Block SUPERADMIN role assignment from both API and UI. Only the root SUPERADMIN (created in seed) should exist.

## Architecture Context

- **Backend**: `users.service.ts` — adminUpdateUser guard
- **Frontend**: `admin/page.tsx` — Change Role Select options
- **Tests**: `users.service.spec.ts` — role assignment tests

## Implementation Steps

### Step 0: Create Feature Branch
- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-315-fullstack`

### Step 1: Backend — Block SUPERADMIN Assignment
**File**: `src/users/users.service.ts` (line 791)

Add before the existing ADMIN check:
```ts
if (dto.role === Role.SUPERADMIN) {
  throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
}
```

Simplify the remaining check (no longer needs SUPERADMIN in the condition):
```ts
if (dto.role && dto.role === Role.ADMIN && actingUser.role !== Role.SUPERADMIN) {
  throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
}
```

### Step 2: Frontend — Remove SUPERADMIN Option
**File**: `src/app/admin/page.tsx`

Remove SUPERADMIN from Select options (lines 360-362) and SUPERADMIN AlertBox (lines 374-379).

### Step 3: Update Tests
**File**: `src/users/tests/users.service.spec.ts`

Update "should throw ForbiddenException when non-SUPERADMIN assigns SUPERADMIN role" → "should reject SUPERADMIN role assignment even from SUPERADMIN".

### Step 4: Documentation
- `ai-specs/specs/integration-state.md` — changelog

## Testing Checklist
- [ ] API: PATCH /users/:id with role=SUPERADMIN → 403
- [ ] UI: Change Role Select shows only USER and ADMIN
- [ ] Existing SUPERADMIN can still log in and manage users
- [ ] Build + tests pass
