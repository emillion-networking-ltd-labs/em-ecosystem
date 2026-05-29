# SCRUM-149: SUPERADMIN Bypass Mechanism Exposed in Error Messages — Backend Plan

- **Ticket**: SCRUM-149
- **Scope**: backend
- **Sprint**: 5 — Security Hardening
- **Priority**: HIGH (H-03)
- **Security references**: CWE-200, CWE-209

---

### 1. Codebase State Snapshot

- **Date**: 2026-03-08
- **Last completed ticket**: SCRUM-148 (Permission guard reveals required permission keys — closed as Done, resolved by SCRUM-140)
- **Integration state verified**: Yes
- **Branch**: main (clean)

**Files verified**:

| File | Key observations |
|------|-----------------|
| `permissions.service.ts:1-27` | Constructor: `PermissionsService(prisma: PrismaService, cache: PermissionsCache)`. Imports: `BadRequestException`, `ForbiddenException`. No `ErrorMessages` import currently. |
| `permissions.service.ts:105-110` | `getPermissionsForRole()`: Hardcoded `'SUPERADMIN bypasses all permissions — no explicit assignments'` at line 108. |
| `permissions.service.ts:129-133` | `setPermissionsForRole()`: Hardcoded `'Cannot modify SUPERADMIN permissions — SUPERADMIN bypasses all checks'` at line 131. |
| `permissions.service.ts:136-140` | `setPermissionsForRole()`: Hardcoded `'ADMIN cannot modify permissions for the ADMIN role — requires SUPERADMIN'` at line 138. |
| `permissions.service.ts:150-153` | `setPermissionsForRole()`: Hardcoded `Invalid permission keys: ${invalidKeys.join(', ')}` at line 152. Admin-only — out of scope for this ticket (noted in SCRUM-148). |
| `users.service.ts:392-405` | `adminUpdateUser()`: Line 394 already uses `ErrorMessages.user.OPERATION_NOT_PERMITTED` (generic). Line 403 hardcoded: `'Only SUPERADMIN can assign ADMIN or SUPERADMIN roles'`. |
| `permissions.controller.ts:58` | `@ApiResponse({ status: 400, description: 'Invalid role or SUPERADMIN' })` — Swagger docs expose "SUPERADMIN". |
| `permissions.controller.ts:70-71` | `@ApiResponse({ status: 400, description: 'Invalid role, SUPERADMIN, or invalid permission keys' })` — Swagger docs expose "SUPERADMIN". |
| `error-messages.ts:29-33` | `permission` section has: `ACCESS_DENIED`, `INSUFFICIENT_PERMISSIONS`, `INSUFFICIENT_ROLE`. No `INVALID_ROLE_OPERATION` constant yet. |
| `error-messages.ts:23-28` | `user` section has: `NOT_FOUND`, `INVALID_PASSWORD`, `PASSWORD_REQUIRED`, `OPERATION_NOT_PERMITTED`. |
| `permissions.service.spec.ts:89-93` | Test: "should throw for SUPERADMIN" (getPermissionsForRole) — asserts `BadRequestException` only, no message check. |
| `permissions.service.spec.ts:123-127` | Test: "should throw for SUPERADMIN" (setPermissionsForRole) — asserts `BadRequestException` only, no message check. |
| `permissions.controller.spec.ts:98-106` | Test: "should propagate BadRequestException for SUPERADMIN" — mock uses `'SUPERADMIN bypasses all permissions'`. |
| `users.service.spec.ts:787-801` | Tests for non-SUPERADMIN assigning ADMIN/SUPERADMIN role — assert `ForbiddenException` only, no message check. |

**Constructor signatures verified**:
- `PermissionsService(prisma: PrismaService, cache: PermissionsCache)` — no changes needed
- No constructor modifications in this ticket

**Methods verified to exist**:
- `getPermissionsForRole(role: Role)` — line 105 of permissions.service.ts
- `setPermissionsForRole(role, keys, actingUserRole?)` — line 124 of permissions.service.ts
- `adminUpdateUser(targetId, dto, actingUser)` — line 378 of users.service.ts

**Guard dependency chain verified**: No guard changes.

**Discrepancies with integration-state.md**: None.

### 2. Overview

Four hardcoded error messages and two Swagger @ApiResponse descriptions explicitly mention "SUPERADMIN", revealing the existence and behavior of the SUPERADMIN bypass mechanism. This is CWE-200 (Information Exposure Through an Error Message). All offending code is behind ADMIN-level guards, but a compromised admin account could map the privilege escalation model.

**Fix**: Replace 4 hardcoded strings with `ErrorMessages` constants (1 new + 1 existing) and sanitize 2 Swagger descriptions. All SUPERADMIN protection logic (Role.SUPERADMIN comparisons) remains unchanged.

### 3. Architecture Context

- **Modules involved**: PermissionsModule, UsersModule (no module config changes)
- **Affected services**: PermissionsService (3 messages), UsersService (1 message)
- **Affected controller**: PermissionsController (2 Swagger descriptions)
- **Affected constants**: ErrorMessages (1 new constant)
- **No new modules/guards/DI changes**

### 4. Implementation Steps

#### Step 1: Add INVALID_ROLE_OPERATION constant to ErrorMessages

**File**: `nexacore-api/src/common/constants/error-messages.ts`

```typescript
// BEFORE (line 29-33)
permission: {
  ACCESS_DENIED: 'Access denied',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  INSUFFICIENT_ROLE: 'Insufficient role',
},

// AFTER
permission: {
  ACCESS_DENIED: 'Access denied',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  INSUFFICIENT_ROLE: 'Insufficient role',
  INVALID_ROLE_OPERATION: 'Invalid role for this operation',
},
```

#### Step 2: Add ErrorMessages import to PermissionsService

**File**: `nexacore-api/src/permissions/permissions.service.ts`

Add import:
```typescript
import { ErrorMessages } from '../common/constants/error-messages';
```

#### Step 3: Replace getPermissionsForRole SUPERADMIN message (line 107-109)

**File**: `nexacore-api/src/permissions/permissions.service.ts`

```typescript
// BEFORE (line 107-109)
throw new BadRequestException(
  'SUPERADMIN bypasses all permissions — no explicit assignments',
);

// AFTER
throw new BadRequestException(
  ErrorMessages.permission.INVALID_ROLE_OPERATION,
);
```

#### Step 4: Replace setPermissionsForRole SUPERADMIN message (line 130-132)

**File**: `nexacore-api/src/permissions/permissions.service.ts`

```typescript
// BEFORE (line 130-132)
throw new BadRequestException(
  'Cannot modify SUPERADMIN permissions — SUPERADMIN bypasses all checks',
);

// AFTER
throw new BadRequestException(
  ErrorMessages.permission.INVALID_ROLE_OPERATION,
);
```

#### Step 5: Replace setPermissionsForRole ADMIN escalation message (line 137-139)

**File**: `nexacore-api/src/permissions/permissions.service.ts`

```typescript
// BEFORE (line 137-139)
throw new ForbiddenException(
  'ADMIN cannot modify permissions for the ADMIN role — requires SUPERADMIN',
);

// AFTER
throw new ForbiddenException(
  ErrorMessages.user.OPERATION_NOT_PERMITTED,
);
```

Note: Uses existing `OPERATION_NOT_PERMITTED` constant. The import for `ErrorMessages` was added in Step 2.

#### Step 6: Replace adminUpdateUser role assignment message (line 403-405)

**File**: `nexacore-api/src/users/users.service.ts`

```typescript
// BEFORE (line 403-405)
throw new ForbiddenException(
  'Only SUPERADMIN can assign ADMIN or SUPERADMIN roles',
);

// AFTER
throw new ForbiddenException(
  ErrorMessages.user.OPERATION_NOT_PERMITTED,
);
```

`ErrorMessages` is already imported in `users.service.ts`.

#### Step 7: Update Swagger @ApiResponse descriptions

**File**: `nexacore-api/src/permissions/permissions.controller.ts`

```typescript
// BEFORE (line 58)
@ApiResponse({ status: 400, description: 'Invalid role or SUPERADMIN' })

// AFTER
@ApiResponse({ status: 400, description: 'Invalid role' })

// BEFORE (line 70-71)
@ApiResponse({
  status: 400,
  description: 'Invalid role, SUPERADMIN, or invalid permission keys',
})

// AFTER
@ApiResponse({
  status: 400,
  description: 'Invalid role or invalid permission keys',
})
```

#### Step 8: Update tests

**File**: `nexacore-api/src/permissions/tests/permissions.controller.spec.ts`

```typescript
// BEFORE (line 99-100)
service.getPermissionsForRole.mockRejectedValue(
  new BadRequestException('SUPERADMIN bypasses all permissions'),
);

// AFTER
service.getPermissionsForRole.mockRejectedValue(
  new BadRequestException('Invalid role for this operation'),
);
```

**File**: `nexacore-api/src/permissions/tests/permissions.service.spec.ts`

No changes needed — existing tests at lines 89-93 and 123-127 only assert the exception type (`BadRequestException`), not the message string. They will pass with the new messages.

**File**: `nexacore-api/src/users/tests/users.service.spec.ts`

No changes needed — existing tests at lines 787-801 only assert the exception type (`ForbiddenException`), not the message string.

### 5. Testing Checklist

#### Tests to UPDATE (1):
| # | Test | File | Change |
|---|------|------|--------|
| 1 | "should propagate BadRequestException for SUPERADMIN" | permissions.controller.spec.ts:98 | Update mock message string |

#### Tests UNCHANGED:
| Test | File | Reason |
|------|------|--------|
| "should throw for SUPERADMIN" (getPermissionsForRole) | permissions.service.spec.ts:89 | Only asserts exception type |
| "should throw for SUPERADMIN" (setPermissionsForRole) | permissions.service.spec.ts:123 | Only asserts exception type |
| "should throw ForbiddenException when non-SUPERADMIN assigns ADMIN role" | users.service.spec.ts:787 | Only asserts exception type |
| "should throw ForbiddenException when non-SUPERADMIN assigns SUPERADMIN role" | users.service.spec.ts:795 | Only asserts exception type |

### 6. Implementation Order

1. Step 1: Add `INVALID_ROLE_OPERATION` constant to `error-messages.ts`
2. Step 2: Add `ErrorMessages` import to `permissions.service.ts`
3. Steps 3-5: Replace 3 hardcoded messages in `permissions.service.ts`
4. Step 6: Replace 1 hardcoded message in `users.service.ts`
5. Step 7: Update 2 Swagger descriptions in `permissions.controller.ts`
6. Step 8: Update 1 test mock string in `permissions.controller.spec.ts`
7. Run `nest build` — must compile clean
8. Run `jest --maxWorkers=1 --forceExit` — all tests must pass

### 7. Error Response Format

After fix, all SUPERADMIN-related error responses:

| Scenario | Before | After |
|----------|--------|-------|
| GET /permissions/roles/SUPERADMIN | 400 `"SUPERADMIN bypasses all permissions — no explicit assignments"` | 400 `"Invalid role for this operation"` |
| PUT /permissions/roles/SUPERADMIN | 400 `"Cannot modify SUPERADMIN permissions — SUPERADMIN bypasses all checks"` | 400 `"Invalid role for this operation"` |
| PUT /permissions/roles/admin (by ADMIN) | 403 `"ADMIN cannot modify permissions for the ADMIN role — requires SUPERADMIN"` | 403 `"Operation not permitted"` |
| PATCH /users/:id (assign ADMIN/SUPERADMIN by non-SUPERADMIN) | 403 `"Only SUPERADMIN can assign ADMIN or SUPERADMIN roles"` | 403 `"Operation not permitted"` |

### 8. Dependencies

- `ErrorMessages` — already exists, needs 1 new constant
- No new dependencies

### 9. Notes

- **PermissionsService has no ErrorMessages import currently**: Must add it in Step 2.
- **parseRole() in controller (line 38)**: Throws `Invalid role: ${role}. Valid roles: SUPERADMIN, ADMIN, USER` — this lists role names, but it's behind `@Roles(Role.ADMIN)` and is a different finding pattern (role enumeration, not SUPERADMIN bypass disclosure). Out of scope for H-03.
- **invalidKeys message (line 152)**: Exposes user-supplied permission key names that don't exist — admin-only endpoint, already noted in SCRUM-148 as acceptable. Out of scope.
- **Three instances already generic**: `users.service.ts` lines 394, 468, 642 already use `ErrorMessages.user.OPERATION_NOT_PERMITTED`. No changes needed.
- **Comment cleanup**: Code comments referencing SUPERADMIN (e.g., line 397: `// Only SUPERADMIN can assign...`) are internal and not exposed to users. They should remain for developer context.

### 10. Next Steps

After implementation:
1. Run `nest build` — must compile clean
2. Run `jest --maxWorkers=1 --forceExit` — all tests must pass
3. Proceed to `/commit`

### 11. Implementation Verification

- [ ] `ErrorMessages.permission.INVALID_ROLE_OPERATION` constant added
- [ ] `permissions.service.ts` imports `ErrorMessages`
- [ ] `getPermissionsForRole`: uses `ErrorMessages.permission.INVALID_ROLE_OPERATION` (not hardcoded)
- [ ] `setPermissionsForRole` SUPERADMIN check: uses `ErrorMessages.permission.INVALID_ROLE_OPERATION` (not hardcoded)
- [ ] `setPermissionsForRole` ADMIN escalation check: uses `ErrorMessages.user.OPERATION_NOT_PERMITTED` (not hardcoded)
- [ ] `adminUpdateUser` role assignment check: uses `ErrorMessages.user.OPERATION_NOT_PERMITTED` (not hardcoded)
- [ ] Swagger `getForRole`: description says "Invalid role" (no SUPERADMIN mention)
- [ ] Swagger `setForRole`: description says "Invalid role or invalid permission keys" (no SUPERADMIN mention)
- [ ] Zero occurrences of "SUPERADMIN" in any exception message or Swagger description
- [ ] Controller spec mock updated to new message
- [ ] `nest build` compiles clean
- [ ] All tests pass

### 12. Module-Level Planning

No module changes. No new providers, imports, or exports.

### 13. Satellite App Planning

No satellite app impact.

### 14. Cross-Ticket Dependency Checklist

| Ticket | Relationship | Status |
|--------|-------------|--------|
| SCRUM-140 | Parent — error message audit & remediation | Done |
| SCRUM-148 | Sibling — permission guard key disclosure (already fixed by SCRUM-140) | Done |
| SCRUM-147 | Sibling — user not found on self-service endpoints | Done |

### 15. Guard Dependency Chain Verification

No guard changes. All affected endpoints use existing `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)` chain on `PermissionsController` and `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)` on `UsersController`.
