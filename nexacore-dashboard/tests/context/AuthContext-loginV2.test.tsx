/**
 * SCRUM-499 / AUTH v2 Phase 2.3 — AuthContext loginV2 + advance methods tests.
 *
 * Validates that the v2 reducer cases (`AUTH_INTENT_MFA_REQUIRED`,
 * `AUTH_INTENT_TENANT_PICK_REQUIRED`) populate the right state slots and that
 * the API calls go to the correct endpoints with the discriminated input.
 */

import { act, render, waitFor } from "@testing-library/react";
import { useEffect } from "react";

// ── Mocks ──────────────────────────────────────────────────────────────

const mockApiClientPost = jest.fn();
const mockApiClientGet = jest.fn();
const mockSetAccessToken = jest.fn();
const mockClearAccessToken = jest.fn();
const mockSetOnAuthFailure = jest.fn();
const mockSetDeviceFingerprint = jest.fn();

jest.mock("@/lib/api", () => ({
  apiClient: {
    post: (...args: unknown[]) => mockApiClientPost(...args),
    get: (...args: unknown[]) => mockApiClientGet(...args),
    setAccessToken: (...args: unknown[]) => mockSetAccessToken(...args),
    clearAccessToken: () => mockClearAccessToken(),
    setOnAuthFailure: (...args: unknown[]) => mockSetOnAuthFailure(...args),
    setDeviceFingerprint: (...args: unknown[]) =>
      mockSetDeviceFingerprint(...args),
  },
  API_BASE_URL: "http://localhost:3000",
  SessionExpiredError: class SessionExpiredError extends Error {},
}));

jest.mock("@/lib/csrf", () => ({
  getCsrfToken: jest.fn().mockResolvedValue("csrf"),
  clearCsrfToken: jest.fn(),
}));

jest.mock("@/lib/passkey-api", () => ({
  passkeyLoginVerify: jest.fn(),
}));

jest.mock("@/lib/fingerprint", () => ({
  getFingerprint: jest.fn().mockResolvedValue("fp"),
}));

jest.mock("@/hooks/useIdleTimeout", () => ({
  useIdleTimeout: () => ({
    secondsLeft: 0,
    showWarning: false,
    keepAlive: jest.fn(),
  }),
}));

jest.mock("@/hooks/useCrossTabAuth", () => ({
  useCrossTabAuth: () => ({ broadcast: jest.fn() }),
}));

jest.mock("@/components/ui/IdleWarningModal", () => ({
  __esModule: true,
  default: () => null,
}));

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
}));

const mockAddToast = jest.fn();
jest.mock("@/context/ToastContext", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  useToast: () => ({
    addToast: mockAddToast,
    removeToast: jest.fn(),
    clearToasts: jest.fn(),
  }),
}));

import { AuthProvider, useAuth } from "@/context/AuthContext";

// Helper component to expose the context value to assertions
function ContextProbe({ onState }: { onState: (state: unknown) => void }) {
  const auth = useAuth();
  useEffect(() => {
    onState(auth);
  }, [auth, onState]);
  return null;
}

describe("AuthContext — loginV2 (Phase 2.3)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loginV2 calls createAuthIntent then advanceAuthIntent with credentials", async () => {
    // createAuthIntent → { id, status: 'requires_credentials', ... }
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-1",
      status: "requires_credentials",
      nextStep: "credentials",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    });
    // advanceAuthIntent → succeeded
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-1",
      status: "succeeded",
      nextStep: null,
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
      accessToken: "access-token-xyz",
      user: {
        id: "user-1",
        tenantId: "tenant-1",
        tenantRole: "MEMBER",
        isPlatformAdmin: false,
      },
    });
    mockApiClientGet.mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
    });

    let auth: ReturnType<typeof useAuth> | undefined;
    render(
      <AuthProvider>
        <ContextProbe onState={(a) => (auth = a as ReturnType<typeof useAuth>)} />
      </AuthProvider>,
    );

    await act(async () => {
      await auth!.loginV2("alice@example.com", "correct-horse-battery");
    });

    // createAuthIntent
    expect(mockApiClientPost).toHaveBeenCalledWith("/auth/v2/intents", {});
    // advanceAuthIntent with credentials
    expect(mockApiClientPost).toHaveBeenCalledWith(
      "/auth/v2/intents/intent-1/advance",
      {
        kind: "credentials",
        email: "alice@example.com",
        password: "correct-horse-battery",
      },
    );
    // Access token set + /auth/me fetched
    expect(mockSetAccessToken).toHaveBeenCalledWith("access-token-xyz");
    expect(mockApiClientGet).toHaveBeenCalledWith("/auth/me");
  });

  it("dispatches AUTH_INTENT_MFA_REQUIRED when advance returns requires_mfa", async () => {
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-1",
      status: "requires_credentials",
      nextStep: "credentials",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    });
    const expiresAt = new Date(Date.now() + 900_000);
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-1",
      status: "requires_mfa",
      nextStep: "mfa",
      expiresAt: expiresAt.toISOString(),
    });

    let auth: ReturnType<typeof useAuth> | undefined;
    const states: unknown[] = [];
    render(
      <AuthProvider>
        <ContextProbe
          onState={(a) => {
            auth = a as ReturnType<typeof useAuth>;
            states.push(a);
          }}
        />
      </AuthProvider>,
    );

    await act(async () => {
      await auth!.loginV2("alice@example.com", "pw12345678");
    });

    await waitFor(() => {
      expect(auth!.authIntentStatus).toBe("requires_mfa");
      expect(auth!.authIntentId).toBe("intent-1");
    });
  });

  it("dispatches AUTH_INTENT_TENANT_PICK_REQUIRED with availableTenantIds when needed", async () => {
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-2",
      status: "requires_credentials",
      nextStep: "credentials",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    });
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-2",
      status: "requires_tenant_pick",
      nextStep: "tenant_pick",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
      availableTenantIds: ["t-a", "t-b"],
    });

    let auth: ReturnType<typeof useAuth> | undefined;
    render(
      <AuthProvider>
        <ContextProbe onState={(a) => (auth = a as ReturnType<typeof useAuth>)} />
      </AuthProvider>,
    );

    await act(async () => {
      await auth!.loginV2("alice@example.com", "pw12345678");
    });

    await waitFor(() => {
      expect(auth!.authIntentStatus).toBe("requires_tenant_pick");
      expect(auth!.authIntentAvailableTenantIds).toEqual(["t-a", "t-b"]);
    });
  });

  it("cancelAuthIntentV2 clears authIntent state via AUTH_STOP", async () => {
    // Get into requires_mfa first
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-1",
      status: "requires_credentials",
      nextStep: "credentials",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    });
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-1",
      status: "requires_mfa",
      nextStep: "mfa",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    });

    let auth: ReturnType<typeof useAuth> | undefined;
    render(
      <AuthProvider>
        <ContextProbe onState={(a) => (auth = a as ReturnType<typeof useAuth>)} />
      </AuthProvider>,
    );

    await act(async () => {
      await auth!.loginV2("alice@example.com", "pw12345678");
    });

    await waitFor(() => {
      expect(auth!.authIntentStatus).toBe("requires_mfa");
    });

    act(() => {
      auth!.cancelAuthIntentV2();
    });

    await waitFor(() => {
      expect(auth!.authIntentStatus).toBeNull();
      expect(auth!.authIntentId).toBeNull();
    });
  });

  it("advanceMfaV2 calls advanceAuthIntent with mfa kind + code", async () => {
    // Get into requires_mfa
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-1",
      status: "requires_credentials",
      nextStep: "credentials",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    });
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-1",
      status: "requires_mfa",
      nextStep: "mfa",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    });

    let auth: ReturnType<typeof useAuth> | undefined;
    render(
      <AuthProvider>
        <ContextProbe onState={(a) => (auth = a as ReturnType<typeof useAuth>)} />
      </AuthProvider>,
    );

    await act(async () => {
      await auth!.loginV2("alice@example.com", "pw12345678");
    });

    await waitFor(() => {
      expect(auth!.authIntentStatus).toBe("requires_mfa");
    });

    // Now exercise advanceMfaV2 — succeeded response
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-1",
      status: "succeeded",
      nextStep: null,
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
      accessToken: "access-token-xyz",
      user: {
        id: "user-1",
        tenantId: "tenant-1",
        tenantRole: "MEMBER",
        isPlatformAdmin: false,
      },
    });
    mockApiClientGet.mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
    });

    await act(async () => {
      await auth!.advanceMfaV2("123456", undefined);
    });

    expect(mockApiClientPost).toHaveBeenCalledWith(
      "/auth/v2/intents/intent-1/advance",
      { kind: "mfa", code: "123456", recoveryCode: undefined },
    );
  });

  it("410 Gone on advanceMfaV2 triggers toast + redirect", async () => {
    // Get into requires_mfa
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-1",
      status: "requires_credentials",
      nextStep: "credentials",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    });
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-1",
      status: "requires_mfa",
      nextStep: "mfa",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    });

    let auth: ReturnType<typeof useAuth> | undefined;
    render(
      <AuthProvider>
        <ContextProbe onState={(a) => (auth = a as ReturnType<typeof useAuth>)} />
      </AuthProvider>,
    );

    await act(async () => {
      await auth!.loginV2("alice@example.com", "pw12345678");
    });

    // 410 Gone
    mockApiClientPost.mockRejectedValueOnce({
      error: { statusCode: 410, message: "Authentication failed" },
    });

    await act(async () => {
      await auth!.advanceMfaV2("000000", undefined);
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Login session expired",
        variant: "warning",
      }),
    );
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("advanceTenantPickV2 calls advanceAuthIntent with tenant_pick kind", async () => {
    // Get into requires_tenant_pick
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-2",
      status: "requires_credentials",
      nextStep: "credentials",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    });
    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-2",
      status: "requires_tenant_pick",
      nextStep: "tenant_pick",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
      availableTenantIds: ["t-a", "t-b"],
    });

    let auth: ReturnType<typeof useAuth> | undefined;
    render(
      <AuthProvider>
        <ContextProbe onState={(a) => (auth = a as ReturnType<typeof useAuth>)} />
      </AuthProvider>,
    );

    await act(async () => {
      await auth!.loginV2("alice@example.com", "pw12345678");
    });

    await waitFor(() => {
      expect(auth!.authIntentStatus).toBe("requires_tenant_pick");
    });

    mockApiClientPost.mockResolvedValueOnce({
      id: "intent-2",
      status: "succeeded",
      nextStep: null,
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
      accessToken: "access-xyz",
      user: {
        id: "user-1",
        tenantId: "t-a",
        tenantRole: "MEMBER",
        isPlatformAdmin: false,
      },
    });
    mockApiClientGet.mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
    });

    await act(async () => {
      await auth!.advanceTenantPickV2("t-a");
    });

    expect(mockApiClientPost).toHaveBeenCalledWith(
      "/auth/v2/intents/intent-2/advance",
      { kind: "tenant_pick", tenantId: "t-a" },
    );
  });
});
