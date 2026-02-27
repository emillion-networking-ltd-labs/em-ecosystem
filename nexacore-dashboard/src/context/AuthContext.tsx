'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { apiClient, API_BASE_URL } from '@/lib/api';
import { getCsrfToken, clearCsrfToken } from '@/lib/csrf';
import type { SafeUser, AuthResponse, LoginResponse, RateLimitInfo, MessageResponse } from '@/lib/types';

/* ===== State ===== */

type AuthState = {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  rateLimitInfo: RateLimitInfo;
  mfaRequired: boolean;
  mfaToken: string | null;
};

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: SafeUser; accessToken: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'RATE_LIMITED'; payload: { retryAfter: number; message: string } }
  | { type: 'MFA_REQUIRED'; payload: { mfaToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const DEFAULT_RATE_LIMIT: RateLimitInfo = {
  isRateLimited: false,
  retryAfter: null,
  message: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isLoading: false,
        isInitialized: true,
        error: null,
        rateLimitInfo: DEFAULT_RATE_LIMIT,
        mfaRequired: false,
        mfaToken: null,
      };
    case 'AUTH_ERROR':
      return { ...state, isLoading: false, isInitialized: true, error: action.payload, mfaRequired: false, mfaToken: null };
    case 'RATE_LIMITED':
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        error: action.payload.message,
        rateLimitInfo: {
          isRateLimited: true,
          retryAfter: action.payload.retryAfter,
          message: action.payload.message,
        },
      };
    case 'MFA_REQUIRED':
      return {
        ...state,
        isLoading: false,
        error: null,
        mfaRequired: true,
        mfaToken: action.payload.mfaToken,
      };
    case 'LOGOUT':
      return { user: null, accessToken: null, isLoading: false, isInitialized: true, error: null, rateLimitInfo: DEFAULT_RATE_LIMIT, mfaRequired: false, mfaToken: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null, rateLimitInfo: DEFAULT_RATE_LIMIT };
    default:
      return state;
  }
}

/* ===== Context ===== */

type AuthContextType = AuthState & {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyMfaLogin: (code: string, isRecoveryCode?: boolean) => Promise<void>;
  cancelMfa: () => void;
  register: (email: string, password: string) => Promise<boolean>;
  handleOAuthCallback: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

/* ===== Helpers ===== */

type ApiError = { error?: { message?: string; details?: string[]; retryAfter?: number; code?: string; statusCode?: number } };

function extractErrorMessage(err: unknown, fallback: string): string {
  const errObj = err as ApiError;
  const details = errObj?.error?.details;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return errObj?.error?.message ?? fallback;
}

/* ===== Provider ===== */

function isMfaResponse(
  data: LoginResponse,
): data is { mfaRequired: true; mfaToken: string } {
  return 'mfaRequired' in data && data.mfaRequired === true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,
    error: null,
    rateLimitInfo: DEFAULT_RATE_LIMIT,
    mfaRequired: false,
    mfaToken: null,
  });

  const refreshSession = useCallback(async () => {
    dispatch({ type: 'AUTH_START' });
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      });
      if (!res.ok) {
        dispatch({ type: 'LOGOUT' });
        return;
      }
      const { accessToken } = (await res.json()) as { accessToken: string };
      apiClient.setAccessToken(accessToken);
      const user = await apiClient.get<SafeUser>('/auth/me');
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, accessToken } });
    } catch {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Attempt silent refresh on mount to restore session from httpOnly cookie
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await apiClient.post<LoginResponse>('/auth/login', { email, password });

      if (isMfaResponse(data)) {
        dispatch({ type: 'MFA_REQUIRED', payload: { mfaToken: data.mfaToken } });
        return;
      }

      apiClient.setAccessToken(data.accessToken);
      const user = await apiClient.get<SafeUser>('/auth/me');
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, accessToken: data.accessToken },
      });
    } catch (err: unknown) {
      const errObj = err as ApiError;
      if (errObj?.error?.retryAfter) {
        dispatch({
          type: 'RATE_LIMITED',
          payload: {
            retryAfter: errObj.error.retryAfter,
            message: errObj.error.message ?? 'Too many requests. Please try again later.',
          },
        });
      } else {
        dispatch({
          type: 'AUTH_ERROR',
          payload: extractErrorMessage(err, 'Login failed. Please try again.'),
        });
      }
    }
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await apiClient.post<AuthResponse>('/auth/register', { email, password });
      apiClient.setAccessToken(data.accessToken);
      const user = await apiClient.get<SafeUser>('/auth/me');
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, accessToken: data.accessToken },
      });
      return true;
    } catch (err: unknown) {
      const errObj = err as ApiError;
      if (errObj?.error?.retryAfter) {
        dispatch({
          type: 'RATE_LIMITED',
          payload: {
            retryAfter: errObj.error.retryAfter,
            message: errObj.error.message ?? 'Too many requests. Please try again later.',
          },
        });
      } else {
        dispatch({
          type: 'AUTH_ERROR',
          payload: extractErrorMessage(err, 'Registration failed. Please try again.'),
        });
      }
      return false;
    }
  }, []);

  const handleOAuthCallback = useCallback(async (code: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await apiClient.post<AuthResponse>('/auth/oauth/exchange', {
        code,
      });
      apiClient.setAccessToken(data.accessToken);
      const user = await apiClient.get<SafeUser>('/auth/me');
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, accessToken: data.accessToken },
      });
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'OAuth authentication failed.'),
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const csrfToken = await getCsrfToken();
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      });
    } finally {
      apiClient.clearAccessToken();
      clearCsrfToken();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const verifyMfaLogin = useCallback(async (code: string, isRecoveryCode = false) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const body: Record<string, string> = { mfaToken: state.mfaToken! };
      if (isRecoveryCode) {
        body.recoveryCode = code;
      } else {
        body.code = code;
      }
      const data = await apiClient.post<AuthResponse>('/auth/mfa/verify-login', body);
      apiClient.setAccessToken(data.accessToken);
      const user = await apiClient.get<SafeUser>('/auth/me');
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, accessToken: data.accessToken },
      });
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'MFA verification failed. Please try again.'),
      });
    }
  }, [state.mfaToken]);

  const cancelMfa = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    try {
      await apiClient.post<MessageResponse>('/auth/forgot-password', { email });
      return true;
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'Failed to send reset email. Please try again.'),
      });
      return false;
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    try {
      await apiClient.post<MessageResponse>('/auth/reset-password', { token, newPassword });
      return true;
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'Password reset failed. Please try again.'),
      });
      return false;
    }
  }, []);

  const resendVerification = useCallback(async (): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    try {
      await apiClient.post<MessageResponse>('/auth/resend-verification', {});
      return true;
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'Failed to resend verification email.'),
      });
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated: !!state.user && !!state.accessToken,
        login,
        verifyMfaLogin,
        cancelMfa,
        register,
        handleOAuthCallback,
        logout,
        refreshSession,
        forgotPassword,
        resetPassword,
        resendVerification,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ===== Hook ===== */

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
