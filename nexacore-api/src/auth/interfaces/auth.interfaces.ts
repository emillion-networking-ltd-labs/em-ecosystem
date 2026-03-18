import { SafeUser } from '../../users/entities/user.entity';

export interface CookieConfig {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path: string;
    maxAge: number;
  };
}

export type LoginStatus = 'success' | 'mfa_required' | 'mfa_setup_required';

export interface AuthResult {
  status: 'success';
  accessToken: string;
  user: SafeUser;
  cookie: CookieConfig;
  oauthAction?: 'login' | 'created' | 'linked';
}

export interface RegisterResult {
  message: string;
}

export interface MfaChallengeResult {
  status: 'mfa_required';
  mfaToken: string;
}

export interface MfaSetupRequiredResult {
  status: 'mfa_setup_required';
  setupToken: string;
  message: string;
}
