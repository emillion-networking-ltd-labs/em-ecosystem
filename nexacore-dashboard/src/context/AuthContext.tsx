'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { apiClient } from '@/lib/api';
import type { SafeUser, AuthResponse } from '@/lib/types';

/* ===== State ===== */

type AuthState = {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
};

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: SafeUser; accessToken: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

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
      };
    case 'AUTH_ERROR':
      return { ...state, isLoading: false, isInitialized: true, error: action.payload };
    case 'LOGOUT':
      return { user: null, accessToken: null, isLoading: false, isInitialized: true, error: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

/* ===== Context ===== */

type AuthContextType = AuthState & {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  handleOAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

/* ===== Helpers ===== */

type ApiError = { error?: { message?: string; details?: string[] } };

function extractErrorMessage(err: unknown, fallback: string): string {
  const errObj = err as ApiError;
  const details = errObj?.error?.details;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return errObj?.error?.message ?? fallback;
}

/* ===== Provider ===== */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,
    error: null,
  });

  const refreshSession = useCallback(async () => {
    dispatch({ type: 'AUTH_START' });
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
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
      const data = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      await fetch('/api/auth/set-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: data.refreshToken }),
      });
      apiClient.setAccessToken(data.accessToken);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, accessToken: data.accessToken },
      });
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'Login failed. Please try again.'),
      });
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await apiClient.post<AuthResponse>('/auth/register', { email, password });
      await fetch('/api/auth/set-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: data.refreshToken }),
      });
      apiClient.setAccessToken(data.accessToken);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, accessToken: data.accessToken },
      });
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'Registration failed. Please try again.'),
      });
    }
  }, []);

  const handleOAuthCallback = useCallback(
    async (accessToken: string, refreshToken: string) => {
      dispatch({ type: 'AUTH_START' });
      try {
        await fetch('/api/auth/set-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        apiClient.setAccessToken(accessToken);
        const user = await apiClient.get<SafeUser>('/auth/me');
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, accessToken } });
      } catch (err: unknown) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: extractErrorMessage(err, 'OAuth authentication failed.'),
        });
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      apiClient.clearAccessToken();
      dispatch({ type: 'LOGOUT' });
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
        register,
        handleOAuthCallback,
        logout,
        refreshSession,
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
