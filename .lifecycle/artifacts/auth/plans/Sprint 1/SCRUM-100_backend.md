# Backend Implementation Plan: SCRUM-100 Revoke Sessions on User Deactivation

## Codebase State Snapshot
- **Date**: 2026-03-02
- **Last completed ticket**: SCRUM-99 (per integration-state.md)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/users/users.service.ts` (adminUpdateUser lines 314–379, softDelete lines 381–410)
  - `nexacore-api/src/users/tests/users.service.spec.ts` (971 lines, sessionsService mock at line 74, adminUpdateUser tests lines 694–843, softDelete tests lines 845–902)
  - `nexacore-api/src/sessions/sessions.service.ts` (revokeAllUserSessions at lines 127–132)
  - `ai-specs/ai-specs/specs/integration-state.md` (last update SCRUM-99)
- **Constructor signatures verified**: UsersService(PrismaService, AuditService, SessionsService, MailService, PasswordBreachService) — SessionsService already injected
- **Guard dependency chain verified**: No guard changes — PATCH /:id already uses JwtAuthGuard + RolesGuard + PermissionsGuard

## Overview

Close a security gap where `adminUpdateUser()` and `softDelete()` set `isActive: false` but do not revoke active sessions. While JWT strategy checks `isActive` on every request (defense-in-depth), active refresh tokens remain valid, allowing a deactivated user to potentially obtain new access tokens until the session expires naturally. The fix is a 2-line addition — `SessionsService.revokeAllUserSessions()` already exists and is already injected.

## Architecture Context

- **Module**: UsersModule (existing — no structural changes)
- **Components affected**: UsersService only (2 methods)
- **Dependencies**: SessionsService (already injected), no new imports needed
- **No new modules, guards, DTOs, controllers, or DI changes**

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-100-backend`
- **Steps**:
  1. `git checkout feature/SCRUM-99-backend` (latest branch with all changes)
  2. `git checkout -b feature/SCRUM-100-backend`
  3. `git branch` to verify

### Step 1: Add Session Revocation to adminUpdateUser()

- **File**: `nexacore-api/src/users/users.service.ts`
- **Action**: After the deactivation audit log block (line ~376), add session revocation when `isActive` transitions to `false`
- **Implementation**:
  1. After the audit log block for activation/deactivation (lines 364–376), add:
     ```typescript
     // Revoke all sessions on deactivation (immediate lockout)
     if (dto.isActive === false && dto.isActive !== target.isActive) {
       await this.sessionsService.revokeAllUserSessions(targetId);
     }
     ```
  2. The condition `dto.isActive === false && dto.isActive !== target.isActive` ensures:
     - Only fires on actual deactivation (false), NOT on reactivation (true)
     - Only fires when state actually changes (skip if user is already deactivated)
  3. Uses `await` (not fire-and-forget) — session revocation must be atomic with deactivation
- **Notes**: Placed after audit log so the deactivation event is recorded even if revocation fails

### Step 2: Add Session Revocation to softDelete()

- **File**: `nexacore-api/src/users/users.service.ts`
- **Action**: After the Prisma update that sets `isActive: false` (line ~398), add session revocation
- **Implementation**:
  1. After `await this.prisma.user.update(...)` (line 398) and before the audit log block, add:
     ```typescript
     // Revoke all sessions on soft delete (immediate lockout)
     await this.sessionsService.revokeAllUserSessions(targetId);
     ```
  2. Uses `await` — must complete before returning
- **Notes**: softDelete always deactivates, so no conditional needed (unlike adminUpdateUser)

### Step 3: Add Unit Tests

- **File**: `nexacore-api/src/users/tests/users.service.spec.ts`
- **Action**: Add 4 new tests to verify session revocation behavior
- **Implementation**:

  **In `describe('adminUpdateUser')` block (after existing deactivation test ~line 809):**

  1. Test: "should revoke all sessions when deactivating a user"
     ```typescript
     it('should revoke all sessions when deactivating a user', async () => {
       prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: true });
       prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

       await usersService.adminUpdateUser(
         'uuid-123',
         { isActive: false },
         actingSuperadmin,
       );

       expect(sessionsService.revokeAllUserSessions).toHaveBeenCalledWith('uuid-123');
     });
     ```

  2. Test: "should NOT revoke sessions when activating a user"
     ```typescript
     it('should NOT revoke sessions when activating a user', async () => {
       prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });
       prisma.user.update.mockResolvedValue({ ...mockUser, isActive: true });

       await usersService.adminUpdateUser(
         'uuid-123',
         { isActive: true },
         actingSuperadmin,
       );

       expect(sessionsService.revokeAllUserSessions).not.toHaveBeenCalled();
     });
     ```

  3. Test: "should NOT revoke sessions on role-only change"
     ```typescript
     it('should NOT revoke sessions on role-only change', async () => {
       prisma.user.findUnique.mockResolvedValue(mockUser);
       prisma.user.update.mockResolvedValue({ ...mockUser, role: Role.ADMIN });

       await usersService.adminUpdateUser(
         'uuid-123',
         { role: Role.ADMIN },
         actingSuperadmin,
       );

       expect(sessionsService.revokeAllUserSessions).not.toHaveBeenCalled();
     });
     ```

  **In `describe('softDelete')` block (after existing success test ~line 888):**

  4. Test: "should revoke all sessions on soft delete"
     ```typescript
     it('should revoke all sessions on soft delete', async () => {
       prisma.user.findUnique.mockResolvedValue(mockUser);
       prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

       await usersService.softDelete('uuid-123', 'admin-1');

       expect(sessionsService.revokeAllUserSessions).toHaveBeenCalledWith('uuid-123');
     });
     ```

- **Notes**: `sessionsService.revokeAllUserSessions` is already mocked in beforeEach (line 74) as `jest.fn().mockResolvedValue(undefined)`. No additional mock setup needed.

### Step 4: Update integration-state.md

- **File**: `ai-specs/ai-specs/specs/integration-state.md`
- **Action**: Update changelog with SCRUM-100 entry
- **Implementation**:
  1. Update header: "Last update: SCRUM-100 (2026-03-02)"
  2. Add changelog entry:
     ```
     | 2026-03-02 | SCRUM-100 | adminUpdateUser() and softDelete() now call sessionsService.revokeAllUserSessions(targetId) when deactivating a user. Immediate session revocation closes the 15-min refresh token window. 4 new tests added. No DI or module changes. |
     ```
- **Notes**: No changes to Module Registry, Guard Dependency Map, Controller Guard Chains, or Service Dependency Chains — the dependency already existed.

### Step 5: Verify Implementation

- **Action**: Build, test, and start the application
- **Steps**:
  1. `cd nexacore-api && npx nest build` — must compile clean
  2. `npx jest --maxWorkers=1 --forceExit` — all tests must pass
  3. Verify test count increased by 4 (from 462 to 466)

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add session revocation to adminUpdateUser()
3. Step 2: Add session revocation to softDelete()
4. Step 3: Add 4 unit tests
5. Step 4: Update integration-state.md
6. Step 5: Verify (build + test)

## Testing Checklist

- [ ] `adminUpdateUser({ isActive: false })` calls `revokeAllUserSessions(targetId)`
- [ ] `adminUpdateUser({ isActive: true })` does NOT call `revokeAllUserSessions`
- [ ] `adminUpdateUser({ role: ADMIN })` (no isActive) does NOT call `revokeAllUserSessions`
- [ ] `softDelete()` calls `revokeAllUserSessions(targetId)`
- [ ] All existing 462 tests still pass
- [ ] 4 new tests pass (total 466)
- [ ] `nest build` compiles clean

## Error Response Format

No new error responses. Existing 404 (user not found), 403 (SUPERADMIN protection), and 401 (unauthorized) remain unchanged. If session revocation fails, the Prisma error propagates naturally as a 500 Internal Server Error.

## Dependencies

- No new packages needed
- `SessionsService` already injected in `UsersService`
- `SessionsModule` already imported in `UsersModule`

## Notes

- **Minimal change**: 2 lines of production code + 4 tests. No DI, no module, no DTO, no controller changes.
- **Atomic vs fire-and-forget**: Session revocation uses `await` (unlike audit logs which use `.catch(() => {})`). This ensures deactivation is atomic — if revocation fails, the admin sees the error.
- **Defense-in-depth**: JWT strategy already rejects deactivated users on every request. Session revocation is the second layer that also invalidates refresh tokens.
- **softDelete unconditional**: `softDelete()` always sets `isActive: false`, so no conditional check needed (unlike `adminUpdateUser` which may or may not change `isActive`).

## Implementation Verification

- [ ] **Code Quality**: `await` used (not fire-and-forget), condition guards against activation/role-only changes
- [ ] **Functionality**: Deactivation immediately revokes all sessions
- [ ] **Testing**: 4 new tests pass, all existing tests still pass
- [ ] **Integration**: `nest build` + `nest start` clean
- [ ] **Documentation**: integration-state.md changelog updated
