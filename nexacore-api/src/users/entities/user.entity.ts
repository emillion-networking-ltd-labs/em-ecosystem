import { Role } from '../enums/role.enum';
import { Provider } from '../enums/provider.enum';

export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: Role;
  provider: Provider;
  providerId: string | null;
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
  'passwordHash' | 'pendingEmail' | 'mfaSecret' | 'mfaRecoveryCodes' | 'failedAttempts' | 'lockedUntil' | 'lockoutCount'
> & {
  hasPassword: boolean;
};

export type SafeUserWithPermissions = SafeUser & {
  permissions: string[];
};

export function toSafeUser(user: User): SafeUser {
  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    provider: user.provider,
    providerId: user.providerId,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    mfaEnabled: user.mfaEnabled,
    hasPassword: !!user.passwordHash,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  return safeUser;
}
