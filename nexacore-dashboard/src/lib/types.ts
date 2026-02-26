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
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
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

export type RateLimitInfo = {
  isRateLimited: boolean;
  retryAfter: number | null;
  message: string | null;
};

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

export type AdminUpdateUserDto = {
  role?: UserRole;
  isActive?: boolean;
};
