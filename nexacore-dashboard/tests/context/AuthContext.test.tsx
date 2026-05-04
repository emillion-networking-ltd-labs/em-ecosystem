/**
 * Regression tests for SCRUM-342: AuthContext.login on failure must
 * surface the backend error via toast ONLY (project convention: backend
 * errors are toast-only; inline error is reserved for client-side
 * form validation). state.error must remain null. The "Session expired"
 * toast must NOT fire on a login failure.
 */

import { act, render, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";

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
  SessionExpiredError: class SessionExpiredError extends Error {
    constructor() {
      super("Session expired");
      this.name = "SessionExpiredError";
    }
  },
}));

jest.mock("@/lib/csrf", () => ({
  getCsrfToken: jest.fn().mockResolvedValue("csrf-token"),
  clearCsrfToken: jest.fn(),
}));

jest.mock("@/lib/fingerprint", () => ({
  getFingerprint: jest.fn().mockResolvedValue("fp-test"),
}));

jest.mock("@/lib/passkey-api", () => ({
  passkeyLoginVerify: jest.fn(),
}));

jest.mock("@/hooks/useIdleTimeout", () => ({
  useIdleTimeout: () => ({
    showWarning: false,
    secondsLeft: 0,
    keepAlive: jest.fn(),
  }),
}));

const mockRouterReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockAddToast = jest.fn();
jest.mock("@/context/ToastContext", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useToast: () => ({
    addToast: mockAddToast,
    toasts: [],
    removeToast: jest.fn(),
  }),
}));

Object.defineProperty(window, "location", {
  value: { pathname: "/login", replace: jest.fn() },
  writable: true,
});

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    status: 401,
    ok: false,
    json: async () => ({}),
    clone() {
      return this;
    },
    headers: { get: () => null },
  }) as unknown as typeof fetch;
});

// ── Imports under test (after mocks) ────────────────────────────────────

import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";

// ── Test consumer that captures state and exposes it via render props ───

let captured: {
  error: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
} = {
  error: null,
  isLoading: false,
  isAuthenticated: false,
};

function TestConsumer({ trigger }: { trigger: number }) {
  const { login, error, isLoading, isAuthenticated } = useAuth();
  const [, setLastError] = useState<unknown>(null);

  captured = { error, isLoading, isAuthenticated };

  useEffect(() => {
    if (trigger > 0) {
      login("user@example.com", "wrong-password").catch((e) => setLastError(e));
    }
  }, [trigger, login]);

  return null;
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("AuthContext.login — failure handling (SCRUM-342)", () => {
  beforeEach(() => {
    mockApiClientPost.mockReset();
    mockApiClientGet.mockReset();
    mockAddToast.mockReset();
    mockClearAccessToken.mockReset();
    captured = { error: null, isLoading: false, isAuthenticated: false };
  });

  it("does NOT set state.error on backend failure (toast-only convention)", async () => {
    mockApiClientPost.mockRejectedValueOnce({
      error: {
        message: "Invalid credentials",
        code: "UNAUTHORIZED",
        statusCode: 401,
      },
    });

    const { rerender } = render(
      <AuthProvider>
        <TestConsumer trigger={0} />
      </AuthProvider>,
    );
    await act(async () => {
      rerender(
        <AuthProvider>
          <TestConsumer trigger={1} />
        </AuthProvider>,
      );
    });

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalled();
    });

    expect(captured.error).toBeNull();
    expect(captured.isLoading).toBe(false);
    expect(captured.isAuthenticated).toBe(false);
  });

  it("shows error toast with backend message on login failure", async () => {
    mockApiClientPost.mockRejectedValueOnce({
      error: { message: "Invalid credentials", statusCode: 401 },
    });

    const { rerender } = render(
      <AuthProvider>
        <TestConsumer trigger={0} />
      </AuthProvider>,
    );
    await act(async () => {
      rerender(
        <AuthProvider>
          <TestConsumer trigger={1} />
        </AuthProvider>,
      );
    });

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "error",
          title: "Sign in failed",
          description: "Invalid credentials.",
        }),
      );
    });
  });

  it("does NOT show 'Session expired' toast on login failure", async () => {
    mockApiClientPost.mockRejectedValueOnce({
      error: { message: "Invalid credentials", statusCode: 401 },
    });

    const { rerender } = render(
      <AuthProvider>
        <TestConsumer trigger={0} />
      </AuthProvider>,
    );
    await act(async () => {
      rerender(
        <AuthProvider>
          <TestConsumer trigger={1} />
        </AuthProvider>,
      );
    });

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalled();
    });

    const calls = mockAddToast.mock.calls.map((c) => c[0]);
    const sessionExpiredCalls = calls.filter(
      (t) => t?.title === "Session expired",
    );
    expect(sessionExpiredCalls).toHaveLength(0);
  });

  it("toast description falls back to 'An unexpected error occurred.' for malformed errors", async () => {
    mockApiClientPost.mockRejectedValueOnce(new Error("network blew up"));

    const { rerender } = render(
      <AuthProvider>
        <TestConsumer trigger={0} />
      </AuthProvider>,
    );
    await act(async () => {
      rerender(
        <AuthProvider>
          <TestConsumer trigger={1} />
        </AuthProvider>,
      );
    });

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "An unexpected error occurred.",
        }),
      );
    });
    // Inline must remain empty — toast-only contract
    expect(captured.error).toBeNull();
  });
});

/**
 * SCRUM-347: regression for the double "Session expired" toast bug observed
 * after a long-idle wake-up. Two sources can call addToast within ms:
 *   1) handleAuthFailure (apiClient 401 cascade)
 *   2) useIdleTimeout callback (browser un-throttles setTimeout)
 * The fix introduces a 3-second timestamp dedupe in showSessionExpiredToast.
 *
 * We don't have a direct seam to the idle callback (mocked at the top of
 * this file). But both sources call the SAME helper internally, so testing
 * the dedupe via two rapid handleAuthFailure invocations proves the contract
 * for both paths by symmetry.
 */
describe("AuthContext — Session expired toast dedupe (SCRUM-347)", () => {
  beforeEach(() => {
    mockSetOnAuthFailure.mockReset();
    mockAddToast.mockReset();
    mockClearAccessToken.mockReset();
    mockRouterReplace.mockReset();
  });

  function captureAuthFailureHandler(): () => void {
    // The most recent setOnAuthFailure call carries the latest handleAuthFailure
    // — the effect re-runs when handleAuthFailure changes (its deps include
    // showSessionExpiredToast, broadcastAuthEvent, router).
    const calls = mockSetOnAuthFailure.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const handler = calls[calls.length - 1][0];
    if (typeof handler !== "function") {
      throw new Error("handleAuthFailure not registered");
    }
    return handler as () => void;
  }

  it("suppresses the second 'Session expired' toast within 3s of the first", async () => {
    render(
      <AuthProvider>
        <TestConsumer trigger={0} />
      </AuthProvider>,
    );

    const handleAuthFailure = captureAuthFailureHandler();

    // Fire twice in quick succession (mimicking handleAuthFailure + idle
    // callback racing on tab wake-up).
    await act(async () => {
      handleAuthFailure();
      handleAuthFailure();
    });

    const sessionExpiredCalls = mockAddToast.mock.calls
      .map((c) => c[0] as { title?: string } | undefined)
      .filter((t) => t?.title === "Session expired");

    expect(sessionExpiredCalls).toHaveLength(1);
  });

  it("allows a new 'Session expired' toast after the 3s dedupe window", async () => {
    const realDateNow = Date.now;
    let mockedNow = realDateNow();
    jest.spyOn(Date, "now").mockImplementation(() => mockedNow);

    try {
      render(
        <AuthProvider>
          <TestConsumer trigger={0} />
        </AuthProvider>,
      );

      const handleAuthFailure = captureAuthFailureHandler();

      await act(async () => {
        handleAuthFailure();
      });

      // Advance 3.5 s — past the dedupe window.
      mockedNow += 3500;

      await act(async () => {
        handleAuthFailure();
      });

      const sessionExpiredCalls = mockAddToast.mock.calls
        .map((c) => c[0] as { title?: string } | undefined)
        .filter((t) => t?.title === "Session expired");

      expect(sessionExpiredCalls).toHaveLength(2);
    } finally {
      (Date.now as unknown as jest.SpyInstance).mockRestore();
    }
  });
});
