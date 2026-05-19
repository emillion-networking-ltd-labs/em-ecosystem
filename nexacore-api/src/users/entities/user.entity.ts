import { Role } from '../enums/role.enum';

export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  avatarOriginalUrl: string | null;
  avatarCropData: Record<string, number> | null;
  role: Role;
  /**
   * Cross-tenant capability flag (SCRUM-489 / AUTH v2 Phase 0.3).
   * Replaces the conflated Role.SUPERADMIN concept. Carries the
   * "this user can bypass tenant boundaries" semantics. User.role
   * is kept transitional for tenant-scoped Role-enum machinery
   * until Phase 1 (JWT v2) retires it.
   */
  isPlatformAdmin: boolean;
  emailVerified: boolean;
  pendingEmail: string | null;
  isActive: boolean;
  failedAttempts: number;
  lockedUntil: Date | null;
  lockoutCount: number;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaRecoveryCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<
  User,
  | 'passwordHash'
  | 'pendingEmail'
  | 'mfaSecret'
  | 'mfaRecoveryCodes'
  | 'failedAttempts'
  | 'lockedUntil'
  | 'lockoutCount'
> & {
  hasPassword: boolean;
  oauthProviders: string[];
};

export type SafeUserWithPermissions = SafeUser & {
  permissions: string[];
};

export function toSafeUser(
  user: User & { oauthAccounts?: { provider: string }[] },
): SafeUser {
  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    avatarOriginalUrl: user.avatarOriginalUrl,
    avatarCropData: user.avatarCropData,
    role: user.role,
    isPlatformAdmin: user.isPlatformAdmin,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    mfaEnabled: user.mfaEnabled,
    hasPassword: !!user.passwordHash,
    oauthProviders: (user.oauthAccounts ?? []).map((a) => a.provider),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  return safeUser;
}
