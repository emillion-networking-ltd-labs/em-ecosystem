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
import { useRouter } from "next/navigation";
import { apiClient, API_BASE_URL } from "@/lib/api";
import { getCsrfToken, clearCsrfToken } from "@/lib/csrf";
import { passkeyLoginVerify } from "@/lib/passkey-api";
import { getFingerprint } from "@/lib/fingerprint";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { useCrossTabAuth } from "@/hooks/useCrossTabAuth";
import IdleWarningModal from "@/components/ui/IdleWarningModal";
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
  mfaSetupRequired: boolean;
  mfaSetupToken: string | null;
};

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: SafeUser; accessToken: string } }
  | { type: "AUTH_ERROR"; payload: string }
  | { type: "AUTH_STOP" }
  | { type: "MFA_REQUIRED"; payload: { mfaToken: string } }
  | { type: "MFA_SETUP_REQUIRED"; payload: { setupToken: string } }
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
        mfaSetupRequired: false,
        mfaSetupToken: null,
      };
    case "AUTH_ERROR":
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        error: action.payload,
        mfaRequired: false,
        mfaToken: null,
        mfaSetupRequired: false,
        mfaSetupToken: null,
      };
    case "AUTH_STOP":
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        mfaRequired: false,
        mfaToken: null,
        mfaSetupRequired: false,
        mfaSetupToken: null,
      };
    case "MFA_REQUIRED":
      return {
        ...state,
        isLoading: false,
        error: null,
        mfaRequired: true,
        mfaToken: action.payload.mfaToken,
      };
    case "MFA_SETUP_REQUIRED":
      return {
        ...state,
        isLoading: false,
        error: null,
        mfaSetupRequired: true,
        mfaSetupToken: action.payload.setupToken,
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
        mfaSetupRequired: false,
        mfaSetupToken: null,
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
  setupMfa: () => Promise<{
    secret: string;
    qrCodeDataUrl: string;
    recoveryCodes: string[];
  }>;
  verifyMfaSetup: (code: string) => Promise<void>;
  cancelMfa: () => void;
  register: (
    email: string,
    password: string,
    turnstileToken?: string,
  ) => Promise<boolean>;
  handleOAuthCallback: () => Promise<string | undefined>;
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
): data is { status: "mfa_required"; mfaToken: string } {
  return data.status === "mfa_required";
}

function isMfaSetupResponse(data: LoginResponse): data is {
  status: "mfa_setup_required";
  setupToken: string;
  message: string;
} {
  return data.status === "mfa_setup_required";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { addToast } = useToast();
  const router = useRouter();
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,
    error: null,
    mfaRequired: false,
    mfaToken: null,
    mfaSetupRequired: false,
    mfaSetupToken: null,
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

  // Register auth failure callback — when ApiClient's silentRefresh fails,
  // we MUST guarantee three things regardless of which page is mounted:
  //   1. Toast informs the user (warning, "Session expired").
  //   2. Local React state is cleaned (LOGOUT dispatch).
  //   3. Browser is sent to /login NOW — do not rely on ProtectedRoute's
  //      effect alone. There are pages without ProtectedRoute, and there
  //      are race conditions during navigation where the effect may not
  //      observe the state change in time. Calling router.replace here
  //      makes the redirect deterministic.
  // SCRUM-349 sub-task 2: cross-tab auth sync via BroadcastChannel.
  // Receiving a LOGOUT event from another tab dispatches LOGOUT locally and
  // redirects to /login without waiting for a 401 cascade. AUTH_SUCCESS is
  // emitted but currently a no-op listener (each tab owns its own state).
  const handleCrossTabEvent = useCallback(
    (event: "LOGOUT" | "AUTH_SUCCESS") => {
      if (event === "LOGOUT") {
        dispatch({ type: "LOGOUT" });
        router.replace("/login");
      }
    },
    [router],
  );
  const { broadcast: broadcastAuthEvent } =
    useCrossTabAuth(handleCrossTabEvent);

  // SCRUM-347: dedupe "Session expired" toasts. Two sources can fire near-
  // simultaneously when a long-idle tab is brought back to foreground:
  //   1) handleAuthFailure (apiClient 401 cascade from a focus-triggered
  //      refetch hitting a backend that already lazy-revoked the session)
  //   2) the useIdleTimeout callback (frontend setTimeout finally fires
  //      after browser un-throttles background tabs)
  // Either can fire first depending on timing. Without dedupe the user sees
  // two "Session expired" toasts stacked. We use a timestamp ref so whoever
  // wins the race shows the canonical toast; the laggard skips.
  const lastSessionExpiredAt = useRef<number>(0);
  const showSessionExpiredToast = useCallback(
    (description: string) => {
      const now = Date.now();
      if (now - lastSessionExpiredAt.current < 3000) return;
      lastSessionExpiredAt.current = now;
      addToast({ variant: "warning", title: "Session expired", description });
    },
    [addToast],
  );

  const handleAuthFailure = useCallback(() => {
    showSessionExpiredToast("Please sign in again.");
    broadcastAuthEvent("LOGOUT");
    dispatch({ type: "LOGOUT" });
    router.replace("/login");
  }, [showSessionExpiredToast, broadcastAuthEvent, router]);

  // Generate fingerprint then attempt silent refresh on mount (ref guard prevents StrictMode double-fire)
  // Skip refresh on /auth/callback — the OAuth exchange handler will authenticate;
  // running both causes a race condition where refresh's LOGOUT overwrites exchange's AUTH_SUCCESS.
  // Register the auth-failure callback in its OWN effect, separate from the
  // mount-once initialization. This is critical: in React StrictMode (dev),
  // the previous combined effect ran body→cleanup→body, and the second body
  // run was skipped by mountedRef, leaving onAuthFailure permanently null.
  // Result: cascade-401s in other tabs never fired the toast/LOGOUT/redirect.
  // Splitting the effects makes the callback registration safely re-runnable
  // and idempotent without depending on the mount-once guard.
  useEffect(() => {
    apiClient.setOnAuthFailure(handleAuthFailure);
    return () => {
      apiClient.setOnAuthFailure(null);
    };
  }, [handleAuthFailure]);

  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // SCRUM-380 — Visual Regression Testing bypass.
    // When NEXT_PUBLIC_VRT_BYPASS_AUTH=1 is set at BUILD time (only in CI
    // VRT runs), short-circuit the auth flow with a deterministic mock
    // user. Lets Playwright snapshot post-auth pages without a backend.
    // Never enabled in production builds.
    if (process.env.NEXT_PUBLIC_VRT_BYPASS_AUTH === "1") {
      dispatch({
        type: "AUTH_SUCCESS",
        payload: {
          user: {
            id: "00000000-0000-0000-0000-000000000000",
            email: "vrt@example.com",
            firstName: "VRT",
            lastName: "User",
            role: "SUPERADMIN",
            avatarUrl: null,
            mfaEnabled: false,
            hasPassword: true,
            oauthProviders: [],
            emailVerified: true,
          } as unknown as SafeUser,
          accessToken: "vrt-mock-token",
        },
      });
      return;
    }

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

        if (isMfaSetupResponse(data)) {
          dispatch({
            type: "MFA_SETUP_REQUIRED",
            payload: { setupToken: data.setupToken },
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
        addToast({
          variant: "error",
          title: "Sign in failed",
          description: extractErrorMessage(err),
        });
        dispatch({ type: "AUTH_STOP" });
        throw err;
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

  const handleOAuthCallback = useCallback(async (): Promise<
    string | undefined
  > => {
    dispatch({ type: "AUTH_START" });
    try {
      const data = await apiClient.post<AuthResponse>(
        "/auth/oauth/exchange",
        {},
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
      } else if (data.oauthAction === "auto-verified") {
        const lastProvider =
          user.oauthProviders[user.oauthProviders.length - 1];
        const providerName =
          lastProvider === "GOOGLE"
            ? "Google"
            : lastProvider === "GITHUB"
              ? "GitHub"
              : lastProvider;
        addToast({
          variant: "warning",
          title: "Account verified",
          description: `Verified via ${providerName}. Set a password in your profile for alternative access.`,
          duration: 10000,
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
      return data.oauthAction;
    } catch (err: unknown) {
      apiClient.clearAccessToken();
      addToast({
        variant: "error",
        title: "Authentication failed",
        description: extractErrorMessage(err),
      });
      dispatch({ type: "AUTH_STOP" });
      return undefined;
    }
  }, [addToast]);

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
      // SCRUM-349 sub-task 2: notify other tabs BEFORE local dispatch so
      // they can redirect in parallel.
      broadcastAuthEvent("LOGOUT");
      dispatch({ type: "LOGOUT" });
    }
  }, [broadcastAuthEvent]);

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

  const setupMfa = useCallback(async () => {
    const tokenHeader = state.mfaSetupToken
      ? { headers: { Authorization: `Bearer ${state.mfaSetupToken}` } }
      : undefined;
    const data = await apiClient.post<{
      secret: string;
      qrCodeDataUrl: string;
      recoveryCodes: string[];
    }>("/auth/mfa/setup", {}, tokenHeader);
    return data;
  }, [state.mfaSetupToken]);

  const verifyMfaSetup = useCallback(
    async (code: string) => {
      const tokenHeader = state.mfaSetupToken
        ? { headers: { Authorization: `Bearer ${state.mfaSetupToken}` } }
        : undefined;
      await apiClient.post<{ message: string }>(
        "/auth/mfa/verify-setup",
        { token: code },
        tokenHeader,
      );
      // MFA is now enabled — user must re-login to get a full session
      addToast({
        variant: "success",
        title: "MFA enabled",
        description:
          "Two-factor authentication is now active. Please sign in again.",
      });
      dispatch({ type: "LOGOUT" });
    },
    [state.mfaSetupToken, addToast],
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

  // Idle timeout: logout after 30 min of user inactivity (OWASP ASVS V3.3.2)
  // Warning modal appears 2 min before logout.
  //
  // SCRUM-347 fix: on idle fire we MUST call the full `logout()` flow — not
  // just `dispatch({ type: "LOGOUT" })`. The full flow:
  //   1. POST /auth/logout — backend marks the session as revoked + denyList
  //      (otherwise it sits in DB with isRevoked=false; on a re-login within
  //      30 min the stale session still passes the lastUsedAt filter and
  //      shows up as a "ghost" entry alongside the new one in the active
  //      sessions list).
  //   2. Broadcast LOGOUT cross-tab (SCRUM-349).
  //   3. Local LOGOUT dispatch.
  // OWASP Session Management Cheat Sheet §5.3: "Sessions should be
  // invalidated on the server side as soon as they are no longer needed,
  // regardless of how the user ends them."
  const isAuthenticated = !!state.user && !!state.accessToken;
  const { showWarning, secondsLeft, keepAlive } = useIdleTimeout(
    28 * 60 * 1000, // 28 min — 2 min buffer before backend revokes at 30 min (OWASP ASVS V3.3.2)
    () => {
      // Toast deduped via showSessionExpiredToast — handleAuthFailure may
      // fire near-simultaneously from a 401 cascade; whoever wins the race
      // shows the canonical toast. See SCRUM-347 dedupe note above.
      showSessionExpiredToast("You were signed out due to inactivity.");
      // Fire-and-forget — UI already redirects via dispatch inside logout().
      void logout();
    },
    isAuthenticated,
    2 * 60 * 1000, // 2 min warning before logout
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated: !!state.user && !!state.accessToken,
        login,
        verifyMfaLogin,
        setupMfa,
        verifyMfaSetup,
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
      {showWarning && (
        <IdleWarningModal secondsLeft={secondsLeft} onKeepAlive={keepAlive} />
      )}
    </AuthContext.Provider>
  );
}

/* ===== Hook ===== */

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
