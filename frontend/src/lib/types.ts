export type Role = 'ADMIN' | 'USER';
export type Provider = 'LOCAL' | 'GOOGLE' | 'GITHUB';

export interface SafeUser {
  id: string;
  email: string;
  role: Role;
  provider: Provider;
  providerId: string | null;
  emailVerified: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: string[];
  };
}
