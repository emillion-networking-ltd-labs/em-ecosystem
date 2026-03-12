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

export interface AuthResult {
  accessToken: string;
  user: SafeUser;
  cookie: CookieConfig;
  oauthAction?: 'login' | 'created' | 'linked';
}

export interface RegisterResult {
  message: string;
}

export interface MfaChallengeResult {
  mfaRequired: true;
  mfaToken: string;
}

export interface MfaSetupRequiredResult {
  mfaSetupRequired: true;
  message: string;
}
