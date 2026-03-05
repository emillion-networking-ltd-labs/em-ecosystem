export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'USER';

export type SafeUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  provider: 'LOCAL' | 'GOOGLE' | 'GITHUB';
  providerId: string | null;
  emailVerified: boolean;
  isActive: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
  lockoutCount: number;
  mfaEnabled: boolean;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: SafeUser;
  accessToken: string;
};

export type LoginResponse =
  | AuthResponse
  | { mfaRequired: true; mfaToken: string };

export type MfaSetupResponse = {
  secret: string;
  qrCodeDataUrl: string;
  recoveryCodes: string[];
};

export type MfaStatusResponse = {
  mfaEnabled: boolean;
  recoveryCodesRemaining: number;
};

export type SessionResponse = {
  id: string;
  deviceInfo: string | null;
  ipAddress: string;
  userAgent: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

export type ErrorResponse = {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: string[];
    retryAfter?: number;
    lockoutLevel?: number;
  };
};

export type RateLimitKind = 'throttle' | 'lockout';

export type RateLimitInfo = {
  isRateLimited: boolean;
  retryAfter: number | null;
  message: string | null;
  kind: RateLimitKind | null;
};

export class RateLimitError extends Error {
  retryAfter: number;
  kind: RateLimitKind;

  constructor(retryAfter: number, message: string, kind: RateLimitKind = 'throttle') {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.kind = kind;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type UpdateProfileDto = {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};

export type ForgotPasswordDto = {
  email: string;
};

export type ResetPasswordDto = {
  token: string;
  newPassword: string;
};

export type MessageResponse = {
  message: string;
};

export type AdminUpdateUserDto = {
  role?: UserRole;
  isActive?: boolean;
};

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'REGISTER'
  | 'TOKEN_REFRESH'
  | 'OAUTH_LOGIN'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'PASSWORD_CHANGE'
  | 'PROFILE_UPDATE'
  | 'USER_ROLE_CHANGE'
  | 'USER_DEACTIVATED'
  | 'USER_ACTIVATED'
  | 'USER_DELETED'
  | 'SUPERADMIN_BYPASS';

export type AuditLogUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
};

// Permission types (SCRUM-30)
export type Permission = {
  id: string;
  key: string;
  description: string;
  resource: string;
  action: string;
};

export type RolePermissionsResponse = {
  role: UserRole;
  permissions: Permission[];
};

export type SetRolePermissionsDto = {
  permissionKeys: string[];
};

export type AuditLog = {
  id: string;
  action: AuditAction;
  userId: string | null;
  targetUserId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: AuditLogUser | null;
  targetUser: AuditLogUser | null;
};

export type SecurityEvent = {
  id: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type ChangeEmailDto = {
  newEmail: string;
  password: string;
};

export type PasskeyResponse = {
  id: string;
  name: string | null;
  deviceType: string;
  backedUp: boolean;
  transports: string[];
  lastUsedAt: string | null;
  createdAt: string;
};

export type PasskeyLoginOptionsResponse = {
  options: Record<string, unknown>;
  challengeId: string;
};

export type PasskeyRegisterResult = {
  id: string;
  name: string;
};

export type TrustedDeviceResponse = {
  id: string;
  deviceName: string;
  ipAddress: string;
  lastVerifiedAt: string;
  expiresAt: string;
  createdAt: string;
};

export type TrustDeviceResult = {
  id: string;
  deviceName: string;
  expiresAt: string;
};

export type RevokeAllDevicesResponse = {
  message: string;
  count: number;
};

export type DeleteAccountDto = {
  password?: string;
};

export type UnlinkOAuthDto = {
  password: string;
};
