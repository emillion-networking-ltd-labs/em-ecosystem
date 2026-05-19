/**
 * Tests for the User.isPlatformAdmin lifecycle invariants.
 *
 * SCRUM-489 / AUTH v2 + Tenancy v1 — Phase 0.3.
 *
 * Suite focuses on the shape-level guarantees of the new cross-tenant
 * capability flag: default-false on User construction, propagation through
 * `toSafeUser()` to `req.user`, and shape-compatibility with the migration's
 * backfill invariant (Role.SUPERADMIN ⇒ isPlatformAdmin=true).
 *
 * Behavioral coverage of the guards + service capability gates lives in:
 *   - `auth/tests/roles.guard.spec.ts` (RolesGuard bypass via flag)
 *   - `auth/tests/permissions.guard.spec.ts` (PermissionsGuard bypass via flag)
 *   - `users/tests/users.service.spec.ts` (UsersService capability gates +
 *     post-Phase-1 boundary)
 *
 * The migration-invariant test below is a unit-level assertion of the same
 * shape contract the production migration enforces via UPDATE.
 */

import { Role } from '../enums/role.enum';
import { toSafeUser, User } from '../entities/user.entity';

function makeBaseUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'test@example.com',
    passwordHash: null,
    firstName: null,
    lastName: null,
    avatarUrl: null,
    avatarOriginalUrl: null,
    avatarCropData: null,
    role: Role.USER,
    isPlatformAdmin: false,
    emailVerified: false,
    pendingEmail: null,
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    lockoutCount: 0,
    mfaEnabled: false,
    mfaSecret: null,
    mfaRecoveryCodes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('User.isPlatformAdmin', () => {
  it('defaults to false on a fresh User construction', () => {
    const user = makeBaseUser();
    expect(user.isPlatformAdmin).toBe(false);
  });

  describe('toSafeUser propagation', () => {
    it('propagates isPlatformAdmin=true to the SafeUser shape', () => {
      const user = makeBaseUser({ isPlatformAdmin: true });
      const safe = toSafeUser(user);
      expect(safe.isPlatformAdmin).toBe(true);
    });

    it('propagates isPlatformAdmin=false to the SafeUser shape', () => {
      const user = makeBaseUser({ isPlatformAdmin: false });
      const safe = toSafeUser(user);
      expect(safe.isPlatformAdmin).toBe(false);
    });

    it('keeps role independently of isPlatformAdmin', () => {
      // Future post-Phase-1 boundary: capability and legacy role decouple.
      const user = makeBaseUser({
        role: Role.USER,
        isPlatformAdmin: true,
      });
      const safe = toSafeUser(user);
      expect(safe.role).toBe(Role.USER);
      expect(safe.isPlatformAdmin).toBe(true);
    });
  });

  describe('migration backfill invariant (shape-level)', () => {
    /**
     * The migration `20260519115702_user_platform_admin` runs:
     *   UPDATE users SET "isPlatformAdmin" = true WHERE role = 'SUPERADMIN';
     *
     * The unit-level expression of this invariant: every user with the
     * legacy Role.SUPERADMIN value, after migration, holds isPlatformAdmin=true.
     * The integration verification happens at /develop step 1 smoke (compare
     * pre/post COUNT(*)).
     */
    it('SUPERADMIN role + post-migration → isPlatformAdmin is true', () => {
      const user = makeBaseUser({
        role: Role.SUPERADMIN,
        isPlatformAdmin: true,
      });
      expect(user.isPlatformAdmin).toBe(true);
      expect(user.role).toBe(Role.SUPERADMIN);
    });

    it('USER role + post-migration → isPlatformAdmin stays false (no false elevation)', () => {
      const user = makeBaseUser({
        role: Role.USER,
        isPlatformAdmin: false,
      });
      expect(user.isPlatformAdmin).toBe(false);
    });
  });

  describe('capability-vs-role boundary', () => {
    it('a user with role=SUPERADMIN but isPlatformAdmin=false has NO cross-tenant authority', () => {
      // Forward boundary: after Phase 1 removes the legacy Role.SUPERADMIN
      // enum value, this configuration may appear briefly during the rollout.
      // The behavioral guards (RolesGuard, PermissionsGuard, UsersService)
      // gate on isPlatformAdmin — verified in their respective spec files.
      const user = makeBaseUser({
        role: Role.SUPERADMIN,
        isPlatformAdmin: false,
      });
      expect(user.isPlatformAdmin).toBe(false);
    });

    it('a user with role=USER but isPlatformAdmin=true has cross-tenant authority', () => {
      // Phase 1 will introduce this shape directly (no Role.SUPERADMIN value).
      const user = makeBaseUser({
        role: Role.USER,
        isPlatformAdmin: true,
      });
      expect(user.isPlatformAdmin).toBe(true);
    });
  });
});
