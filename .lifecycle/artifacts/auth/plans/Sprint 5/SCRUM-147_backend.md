# SCRUM-147: User Not Found on Self-Service Endpoints — Backend Plan

- **Ticket**: SCRUM-147
- **Scope**: backend
- **Sprint**: 5 — Security Hardening
- **Priority**: HIGH (H-01)
- **Security references**: CWE-200

---

### 1. Codebase State Snapshot

- **Date**: 2026-03-08
- **Last completed ticket**: SCRUM-146 (Forgot-Password Timing Anti-Enumeration — Sprint 5)
- **Integration state verified**: Yes
- **Branch**: main (clean)

**Files verified**:

| File | Key observations |
|------|------------------|
| `users.service.ts:1-11` | Imports: NotFoundException (line 7), UnauthorizedException (line 8) — both imported. |
| `users.service.ts:319-327` | `changePassword(userId)`: `NotFoundException(ErrorMessages.user.NOT_FOUND)` at line 326. Self-service — `userId` from JWT via controller (line 63). |
| `users.service.ts:537-545` | `requestEmailChange(userId)`: `NotFoundException(ErrorMessages.user.NOT_FOUND)` at line 544. Self-service — `userId` from JWT via controller (line 79). |
| `users.service.ts:628-636` | `selfDeleteAccount(userId)`: `NotFoundException(ErrorMessages.user.NOT_FOUND)` at line 635. Self-service — `userId` from JWT via controller (line 93). |
| `users.service.ts:718-725` | `unlinkOAuth(userId)`: `NotFoundException(ErrorMessages.user.NOT_FOUND)` at line 724. Self-service — `userId` from JWT via controller (line 108). |
| `users.service.ts:380-389` | `adminUpdateUser(targetId)`: `NotFoundException(ErrorMessages.user.NOT_FOUND)` at line 388. **Admin-facing** — `targetId` from route param. KEEP as-is. |
| `users.service.ts:456-464` | `softDelete(targetId)`: `NotFoundException(ErrorMessages.user.NOT_FOUND)` at line 463. **Admin-facing** — `targetId` from route param. KEEP as-is. |
| `users.controller.ts:55-66` | `changePassword()`: `@UseGuards(JwtAuthGuard)`, calls `usersService.changePassword(req.user.id, ...)` |
| `users.controller.ts:71-82` | `requestEmailChange()`: `@UseGuards(JwtAuthGuard)`, calls `usersService.requestEmailChange(req.user.id, ...)` |
| `users.controller.ts:86-96` | `selfDeleteAccount()`: `@UseGuards(JwtAuthGuard)`, calls `usersService.selfDeleteAccount(req.user.id, ...)` |
| `users.controller.ts:100-111` | `unlinkOAuth()`: `@UseGuards(JwtAuthGuard)`, calls `usersService.unlinkOAuth(req.user.id, ...)` |
| `error-messages.ts:23` | `ErrorMessages.user.NOT_FOUND = 'User not found'` |
| `error-messages.ts:4` | `ErrorMessages.auth.AUTHENTICATION_FAILED = 'Authentication failed'` |
| `users.service.spec.ts:660` | Test: "should throw NotFoundException when user not found" (changePassword) |
| `users.service.spec.ts:1094` | Test: "should throw NotFoundException when user not found" (requestEmailChange) |
| `users.service.spec.ts:1238` | Test: "should throw NotFoundException when user not found" (selfDeleteAccount) |
| `users.service.spec.ts:1513` | Test: "should throw NotFoundException if user not found" (unlinkOAuth) |

**Discrepancies with ticket**: The ticket lists the methods as being in `auth.service.ts` but they are actually in `users.service.ts`. The ticket mentions 3 methods (changePassword, deleteAccount, unlinkOAuth) but `requestEmailChange` (line 544) has the same pattern and should also be fixed.

### 2. Overview

Four self-service endpoints in `users.service.ts` throw `NotFoundException('User not found')` when `userId` (from JWT) does not resolve. Since these are authenticated endpoints where `userId` comes from the JWT payload, if the JWT is valid but the user was deleted, returning 404 "User not found" confirms account deletion — CWE-200 information disclosure.

**Fix**: Change the 4 self-service methods to throw `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)` instead of `NotFoundException(ErrorMessages.user.NOT_FOUND)`. This matches the pattern already used by `jwt.strategy.ts` (line 35) for the same scenario.

**Admin-facing methods are NOT changed**: `adminUpdateUser` and `softDelete` use a `targetId` from route params (not JWT), and 404 is the correct HTTP semantics for "resource not found" in admin contexts.

### 3. Architecture Context

- **Module**: UsersModule
- **Affected service**: UsersService — 4 self-service methods
- **No new modules/guards/DI changes**
- **No controller changes** — exception type change is transparent to the controller
- **NotFoundException import stays** — still used by `adminUpdateUser` and `softDelete`

### 4. Implementation Steps

#### Step 1: Change changePassword user-not-found (line 326)

**File**: `nexacore-api/src/users/users.service.ts`

```typescript
// BEFORE (line 326)
throw new NotFoundException(ErrorMessages.user.NOT_FOUND);

// AFTER
throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
```

Need to add `ErrorMessages` import for `auth` namespace if not already imported. Check current import.

#### Step 2: Change requestEmailChange user-not-found (line 544)

```typescript
// BEFORE (line 544)
throw new NotFoundException(ErrorMessages.user.NOT_FOUND);

// AFTER
throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
```

#### Step 3: Change selfDeleteAccount user-not-found (line 635)

```typescript
// BEFORE (line 635)
throw new NotFoundException(ErrorMessages.user.NOT_FOUND);

// AFTER
throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
```

#### Step 4: Change unlinkOAuth user-not-found (line 724)

```typescript
// BEFORE (line 724)
throw new NotFoundException(ErrorMessages.user.NOT_FOUND);

// AFTER
throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
```

#### Step 5: Verify ErrorMessages import

Check if `users.service.ts` already imports `ErrorMessages` and whether it accesses `ErrorMessages.auth`. If not, the import already covers the full object — just need to use `ErrorMessages.auth.AUTHENTICATION_FAILED`.

#### Step 6: Update tests

**File**: `nexacore-api/src/users/tests/users.service.spec.ts`

4 tests to update:

| Line | Test name | Change |
|------|-----------|--------|
| ~660 | "should throw NotFoundException when user not found" (changePassword) | `rejects.toThrow(NotFoundException)` → `rejects.toThrow(UnauthorizedException)` |
| ~1094 | "should throw NotFoundException when user not found" (requestEmailChange) | Same |
| ~1238 | "should throw NotFoundException when user not found" (selfDeleteAccount) | Same |
| ~1513 | "should throw NotFoundException if user not found" (unlinkOAuth) | Same |

Also update test descriptions from "NotFoundException" to "UnauthorizedException".

Ensure `UnauthorizedException` is imported in the test file. Check if `NotFoundException` is still needed (for admin tests like `adminUpdateUser` and `softDelete`).

### 5. Testing Checklist

#### Tests to UPDATE (4):

| # | Test | Change |
|---|------|--------|
| 1 | changePassword: "should throw NotFoundException when user not found" | → `UnauthorizedException` |
| 2 | requestEmailChange: "should throw NotFoundException when user not found" | → `UnauthorizedException` |
| 3 | selfDeleteAccount: "should throw NotFoundException when user not found" | → `UnauthorizedException` |
| 4 | unlinkOAuth: "should throw NotFoundException if user not found" | → `UnauthorizedException` |

#### Tests UNCHANGED:

| Test | Reason |
|------|--------|
| adminUpdateUser: "should throw NotFoundException when target user not found" (line ~768) | Admin-facing — 404 is correct |
| softDelete: "should throw NotFoundException when target not found" (line ~956) | Admin-facing — 404 is correct |

### 6. Error Response Format

After fix, self-service user-not-found responses:

| Scenario | Before | After |
|----------|--------|-------|
| JWT valid, user deleted | 404 `{ message: 'User not found', code: 'NOT_FOUND' }` | 401 `{ message: 'Authentication failed', code: 'UNAUTHORIZED' }` |

### 7. Dependencies

- `UnauthorizedException` — already imported in users.service.ts (line 8)
- `ErrorMessages.auth.AUTHENTICATION_FAILED` — already available via ErrorMessages import
- No new dependencies

### 8. Notes

- **NotFoundException import stays**: Still used by `adminUpdateUser` (line 388) and `softDelete` (line 463) — admin-facing endpoints where 404 is correct HTTP semantics.
- **Ticket discrepancy**: Ticket says `auth.service.ts` but the methods are in `users.service.ts`. Ticket lists 3 methods but `requestEmailChange` (4th) has the same pattern. All 4 should be fixed.
- **jwt.strategy.ts already fixed**: The `validate()` method was already changed to `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)` by SCRUM-140. This plan aligns the remaining 4 methods to the same pattern.

### 9. Next Steps

After implementation:
1. Run `nest build` — must compile clean
2. Run `jest --maxWorkers=1 --forceExit` — all tests must pass
3. Proceed to `/commit`

### 10. Implementation Verification

- [ ] changePassword: throws `UnauthorizedException` (not `NotFoundException`) for user-not-found
- [ ] requestEmailChange: throws `UnauthorizedException` for user-not-found
- [ ] selfDeleteAccount: throws `UnauthorizedException` for user-not-found
- [ ] unlinkOAuth: throws `UnauthorizedException` for user-not-found
- [ ] adminUpdateUser: still throws `NotFoundException` (unchanged)
- [ ] softDelete: still throws `NotFoundException` (unchanged)
- [ ] All 4 test assertions updated and passing
- [ ] `nest build` compiles clean

### 11. Module-Level Planning

No module changes. No new providers, imports, or exports.

### 12. Satellite App Planning

No satellite app impact.

### 13. Cross-Ticket Dependency Checklist

| Ticket | Relationship | Status |
|--------|-------------|--------|
| SCRUM-140 | Parent — fixed 7/10 occurrences (mfa.service, passkey.service, jwt.strategy) | Done |
| SCRUM-141 | Registration anti-enumeration | Done |
| SCRUM-145 | Login lockout anti-enumeration | Done |
| SCRUM-146 | Forgot-password timing anti-enumeration | Done |

### 14. Guard Dependency Chain Verification

No guard changes. All 4 self-service endpoints use `@UseGuards(JwtAuthGuard)` only.

### 15. Implementation Order

1. Steps 1-4: Change 4 NotFoundException → UnauthorizedException in users.service.ts
2. Step 5: Verify ErrorMessages import
3. Step 6: Update 4 tests in users.service.spec.ts
4. Run `nest build` + `jest --maxWorkers=1 --forceExit`
