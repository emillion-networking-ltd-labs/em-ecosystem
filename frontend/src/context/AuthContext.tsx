"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useReducer,
} from "react";
import { apiClient } from "@/lib/api";
import type { SafeUser, AuthResponse, ApiError } from "@/lib/types";

interface AuthState {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: SafeUser; accessToken: string } }
  | { type: "AUTH_ERROR"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, isLoading: true, error: null };
    case "AUTH_SUCCESS":
      return {
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isLoading: false,
        error: null,
      };
    case "AUTH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "LOGOUT":
      return { user: null, accessToken: null, isLoading: false, error: null };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

export interface AuthContextValue {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  handleOAuthCallback: (
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: true,
  error: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Silent refresh on mount
  useEffect(() => {
    (async () => {
      const token = await apiClient.silentRefresh();
      if (token) {
        try {
          const user = await apiClient.request<SafeUser>("/auth/me");
          dispatch({ type: "AUTH_SUCCESS", payload: { user, accessToken: token } });
        } catch {
          dispatch({ type: "LOGOUT" });
        }
      } else {
        dispatch({ type: "LOGOUT" });
      }
    })();
  }, []);

  const processAuthResponse = useCallback(async (data: AuthResponse) => {
    apiClient.setAccessToken(data.accessToken);
    await fetch("/api/auth/set-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: data.refreshToken }),
    });
    dispatch({
      type: "AUTH_SUCCESS",
      payload: { user: data.user, accessToken: data.accessToken },
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const data = await apiClient.request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await processAuthResponse(data);
    } catch (err) {
      const apiErr = err as ApiError;
      const message =
        apiErr?.error?.statusCode === 403
          ? "Account locked. Too many failed attempts. Try again in 15 minutes."
          : apiErr?.error?.message || "Invalid email or password";
      dispatch({ type: "AUTH_ERROR", payload: message });
    }
  }, [processAuthResponse]);

  const register = useCallback(async (email: string, password: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const data = await apiClient.request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await processAuthResponse(data);
    } catch (err) {
      const apiErr = err as ApiError;
      const message =
        apiErr?.error?.statusCode === 409
          ? "This email is already registered."
          : apiErr?.error?.details?.join(". ") ||
            apiErr?.error?.message ||
            "Registration failed";
      dispatch({ type: "AUTH_ERROR", payload: message });
    }
  }, [processAuthResponse]);

  const logout = useCallback(async () => {
    try {
      const token = apiClient.getAccessToken();
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Ignore logout errors
    }
    apiClient.setAccessToken(null);
    dispatch({ type: "LOGOUT" });
  }, []);

  const handleOAuthCallback = useCallback(
    async (accessToken: string, refreshToken: string) => {
      dispatch({ type: "AUTH_START" });
      try {
        apiClient.setAccessToken(accessToken);
        await fetch("/api/auth/set-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        const user = await apiClient.request<SafeUser>("/auth/me");
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user, accessToken },
        });
      } catch (err) {
        const apiErr = err as ApiError;
        dispatch({
          type: "AUTH_ERROR",
          payload: apiErr?.error?.message || "OAuth login failed",
        });
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        accessToken: state.accessToken,
        isLoading: state.isLoading,
        error: state.error,
        login,
        register,
        logout,
        handleOAuthCallback,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
