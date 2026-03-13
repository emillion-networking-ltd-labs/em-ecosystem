"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { apiClient, API_BASE_URL } from "@/lib/api";
import { getCsrfToken, clearCsrfToken } from "@/lib/csrf";
import { passkeyLoginVerify } from "@/lib/passkey-api";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/context/ToastContext";
import { RateLimitError } from "@/lib/types";
import type {
  SafeUser,
  AuthResponse,
  LoginResponse,
  MessageResponse,
  RateLimitKind,
} from "@/lib/types";
import { ERROR_CODE } from "@/lib/error-constants";
import { extractErrorMessage } from "@/lib/error-utils";

/* ===== State ===== */

type AuthState = {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  mfaRequired: boolean;
  mfaToken: string | null;
};

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: SafeUser; accessToken: string } }
  | { type: "AUTH_ERROR"; payload: string }
  | { type: "AUTH_STOP" }
  | { type: "MFA_REQUIRED"; payload: { mfaToken: string } }
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
        isInitialized: true,
        error: null,
        mfaRequired: false,
        mfaToken: null,
      };
    case "AUTH_ERROR":
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        error: action.payload,
        mfaRequired: false,
        mfaToken: null,
      };
    case "AUTH_STOP":
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        mfaRequired: false,
        mfaToken: null,
      };
    case "MFA_REQUIRED":
      return {
        ...state,
        isLoading: false,
        error: null,
        mfaRequired: true,
        mfaToken: action.payload.mfaToken,
      };
    case "LOGOUT":
      return {
        user: null,
        accessToken: null,
        isLoading: false,
        isInitialized: true,
        error: null,
        mfaRequired: false,
        mfaToken: null,
      };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

/* ===== Context ===== */

type AuthContextType = AuthState & {
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    turnstileToken?: string,
  ) => Promise<void>;
  verifyMfaLogin: (
    code: string,
    isRecoveryCode?: boolean,
    trustDevice?: boolean,
  ) => Promise<void>;
  cancelMfa: () => void;
  register: (
    email: string,
    password: string,
    turnstileToken?: string,
  ) => Promise<boolean>;
  handleOAuthCallback: (code: string) => Promise<void>;
  passkeyLogin: (
    challengeId: string,
    credential: Record<string, unknown>,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  forgotPassword: (email: string, turnstileToken?: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  validateResetToken: (token: string) => Promise<boolean>;
  resendVerificationPublic: (
    email: string,
    turnstileToken?: string,
  ) => Promise<boolean>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

/* ===== Helpers ===== */

type ApiError = {
  error?: {
    message?: string;
    details?: string[];
    retryAfter?: number;
    code?: string;
    statusCode?: number;
    lockoutLevel?: number;
  };
};

function detectRateLimitKind(errObj: ApiError): RateLimitKind {
  return errObj?.error?.code === ERROR_CODE.FORBIDDEN ? "lockout" : "throttle";
}

/* ===== Provider ===== */

function isMfaResponse(
  data: LoginResponse,
): data is { mfaRequired: true; mfaToken: string } {
  return "mfaRequired" in data && data.mfaRequired === true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { addToast } = useToast();
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,
    error: null,
    mfaRequired: false,
    mfaToken: null,
  });

  const refreshSession = useCallback(async () => {
    dispatch({ type: "AUTH_START" });
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
      });
      if (!res.ok) {
        dispatch({ type: "LOGOUT" });
        return;
      }
      const { accessToken } = (await res.json()) as { accessToken: string };
      apiClient.setAccessToken(accessToken);
      const user = await apiClient.get<SafeUser>("/auth/me");
      dispatch({ type: "AUTH_SUCCESS", payload: { user, accessToken } });
    } catch {
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  // Generate fingerprint then attempt silent refresh on mount (ref guard prevents StrictMode double-fire)
  // Skip refresh on /auth/callback — the OAuth exchange handler will authenticate;
  // running both causes a race condition where refresh's LOGOUT overwrites exchange's AUTH_SUCCESS.
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    (async () => {
      const fp = await getFingerprint();
      if (fp) apiClient.setDeviceFingerprint(fp);
      if (window.location.pathname === "/auth/callback") {
        dispatch({ type: "AUTH_STOP" });
        return;
      }
      await refreshSession();
    })();
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string, turnstileToken?: string) => {
      dispatch({ type: "AUTH_START" });
      try {
        const data = await apiClient.post<LoginResponse>("/auth/login", {
          email,
          password,
          turnstileToken,
        });

        if (isMfaResponse(data)) {
          dispatch({
            type: "MFA_REQUIRED",
            payload: { mfaToken: data.mfaToken },
          });
          return;
        }

        apiClient.setAccessToken(data.accessToken);
        const user = await apiClient.get<SafeUser>("/auth/me");
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user, accessToken: data.accessToken },
        });
      } catch (err: unknown) {
        apiClient.clearAccessToken();
        const errObj = err as ApiError;
        if (errObj?.error?.retryAfter) {
          dispatch({ type: "AUTH_STOP" });
          const kind = detectRateLimitKind(errObj);
          throw new RateLimitError(
            errObj.error.retryAfter,
            errObj.error.message ?? "Too many requests.",
            kind,
          );
        }
        const message = extractErrorMessage(err);
        addToast({
          variant: "error",
          title: "Sign in failed",
          description: message,
        });
        dispatch({ type: "AUTH_STOP" });
      }
    },
    [addToast],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      turnstileToken?: string,
    ): Promise<boolean> => {
      dispatch({ type: "AUTH_START" });
      try {
        await apiClient.post<{ message: string }>("/auth/register", {
          email,
          password,
          turnstileToken,
        });
        dispatch({ type: "AUTH_STOP" });
        return true;
      } catch (err: unknown) {
        const errObj = err as ApiError;
        if (errObj?.error?.retryAfter) {
          dispatch({ type: "AUTH_STOP" });
          const kind = detectRateLimitKind(errObj);
          throw new RateLimitError(
            errObj.error.retryAfter,
            errObj.error.message ?? "Too many requests.",
            kind,
          );
        }
        addToast({
          variant: "error",
          title: "Registration failed",
          description: extractErrorMessage(err),
        });
        dispatch({ type: "AUTH_STOP" });
        return false;
      }
    },
    [addToast],
  );

  const handleOAuthCallback = useCallback(
    async (code: string) => {
      dispatch({ type: "AUTH_START" });
      try {
        const data = await apiClient.post<AuthResponse>(
          "/auth/oauth/exchange",
          {
            code,
          },
        );
        apiClient.setAccessToken(data.accessToken);
        const user = await apiClient.get<SafeUser>("/auth/me");
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user, accessToken: data.accessToken },
        });
        if (data.oauthAction === "created") {
          addToast({
            variant: "success",
            title: "Account created",
            description: "Your account has been created successfully.",
          });
        } else if (data.oauthAction === "linked") {
          const lastProvider =
            user.oauthProviders[user.oauthProviders.length - 1];
          const providerName =
            lastProvider === "GOOGLE"
              ? "Google"
              : lastProvider === "GITHUB"
                ? "GitHub"
                : lastProvider;
          addToast({
            variant: "success",
            title: "Account linked",
            description: `Your account has been linked to ${providerName}.`,
          });
        }
      } catch (err: unknown) {
        apiClient.clearAccessToken();
        addToast({
          variant: "error",
          title: "Authentication failed",
          description: extractErrorMessage(err),
        });
        dispatch({ type: "AUTH_STOP" });
      }
    },
    [addToast],
  );

  const passkeyLogin = useCallback(
    async (challengeId: string, credential: Record<string, unknown>) => {
      dispatch({ type: "AUTH_START" });
      try {
        const data = await passkeyLoginVerify(challengeId, credential);
        apiClient.setAccessToken(data.accessToken);
        const user = await apiClient.get<SafeUser>("/auth/me");
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user, accessToken: data.accessToken },
        });
      } catch (err: unknown) {
        apiClient.clearAccessToken();
        addToast({
          variant: "error",
          title: "Passkey login failed",
          description:
            extractErrorMessage(err) || "Passkey authentication failed.",
        });
        dispatch({ type: "AUTH_STOP" });
        throw err;
      }
    },
    [addToast],
  );

  const logout = useCallback(async () => {
    try {
      const csrfToken = await getCsrfToken();
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
      });
    } finally {
      apiClient.clearAccessToken();
      clearCsrfToken();
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  const verifyMfaLogin = useCallback(
    async (code: string, isRecoveryCode = false, trustDevice = false) => {
      dispatch({ type: "AUTH_START" });
      try {
        const body: Record<string, string | boolean> = {
          mfaToken: state.mfaToken!,
        };
        if (isRecoveryCode) {
          body.recoveryCode = code;
        } else {
          body.code = code;
        }
        if (trustDevice) {
          body.trustDevice = true;
        }
        const data = await apiClient.post<AuthResponse>(
          "/auth/mfa/verify-login",
          body,
        );
        apiClient.setAccessToken(data.accessToken);
        const user = await apiClient.get<SafeUser>("/auth/me");
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user, accessToken: data.accessToken },
        });
      } catch (err: unknown) {
        apiClient.clearAccessToken();
        const errObj = err as ApiError;
        if (errObj?.error?.retryAfter) {
          dispatch({ type: "AUTH_STOP" });
          const kind = detectRateLimitKind(errObj);
          throw new RateLimitError(
            errObj.error.retryAfter,
            errObj.error.message ?? "Too many requests.",
            kind,
          );
        }
        addToast({
          variant: "error",
          title: "Verification failed",
          description: extractErrorMessage(err),
        });
        dispatch({ type: "AUTH_STOP" });
      }
    },
    [state.mfaToken, addToast],
  );

  const cancelMfa = useCallback(() => {
    dispatch({ type: "LOGOUT" });
  }, []);

  const forgotPassword = useCallback(
    async (email: string, turnstileToken?: string): Promise<boolean> => {
      dispatch({ type: "AUTH_START" });
      try {
        await apiClient.post<MessageResponse>("/auth/forgot-password", {
          email,
          turnstileToken,
        });
        dispatch({ type: "AUTH_STOP" });
        return true;
      } catch (err: unknown) {
        const errObj = err as ApiError;
        if (errObj?.error?.retryAfter) {
          dispatch({ type: "AUTH_STOP" });
          const kind = detectRateLimitKind(errObj);
          throw new RateLimitError(
            errObj.error.retryAfter,
            errObj.error.message ?? "Too many requests.",
            kind,
          );
        }
        addToast({
          variant: "error",
          title: "Recovery failed",
          description: extractErrorMessage(err),
        });
        dispatch({ type: "AUTH_STOP" });
        return false;
      }
    },
    [addToast],
  );

  const resetPassword = useCallback(
    async (token: string, newPassword: string): Promise<boolean> => {
      dispatch({ type: "AUTH_START" });
      try {
        await apiClient.post<MessageResponse>("/auth/reset-password", {
          token,
          newPassword,
        });
        dispatch({ type: "AUTH_STOP" });
        return true;
      } catch (err: unknown) {
        const errObj = err as ApiError;
        if (errObj?.error?.retryAfter) {
          dispatch({ type: "AUTH_STOP" });
          const kind = detectRateLimitKind(errObj);
          throw new RateLimitError(
            errObj.error.retryAfter,
            errObj.error.message ?? "Too many requests.",
            kind,
          );
        }
        addToast({
          variant: "error",
          title: "Password reset failed",
          description: extractErrorMessage(err),
        });
        dispatch({ type: "AUTH_STOP" });
        return false;
      }
    },
    [addToast],
  );

  const resendVerification = useCallback(async (): Promise<boolean> => {
    dispatch({ type: "AUTH_START" });
    try {
      await apiClient.post<MessageResponse>("/auth/resend-verification", {});
      dispatch({ type: "AUTH_STOP" });
      return true;
    } catch (err: unknown) {
      const errObj = err as ApiError;
      if (errObj?.error?.retryAfter) {
        dispatch({ type: "AUTH_STOP" });
        const kind = detectRateLimitKind(errObj);
        throw new RateLimitError(
          errObj.error.retryAfter,
          errObj.error.message ?? "Too many requests.",
          kind,
        );
      }
      addToast({
        variant: "error",
        title: "Verification email failed",
        description: extractErrorMessage(err),
      });
      dispatch({ type: "AUTH_STOP" });
      return false;
    }
  }, [addToast]);

  const validateResetToken = useCallback(
    async (token: string): Promise<boolean> => {
      try {
        const data = await apiClient.post<{ valid: boolean }>(
          "/auth/validate-reset-token",
          { token },
        );
        return data.valid;
      } catch {
        return false;
      }
    },
    [],
  );

  const resendVerificationPublic = useCallback(
    async (email: string, turnstileToken?: string): Promise<boolean> => {
      try {
        await apiClient.post<MessageResponse>(
          "/auth/resend-verification-public",
          { email, turnstileToken },
        );
        return true;
      } catch {
        return false;
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
        ...state,
        isAuthenticated: !!state.user && !!state.accessToken,
        login,
        verifyMfaLogin,
        cancelMfa,
        register,
        handleOAuthCallback,
        passkeyLogin,
        logout,
        refreshSession,
        forgotPassword,
        resetPassword,
        resendVerification,
        validateResetToken,
        resendVerificationPublic,
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
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
