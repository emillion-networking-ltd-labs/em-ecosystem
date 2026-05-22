import { render, screen } from "../../../test-utils";
import AuthIntentFlow from "@/components/auth/v2/AuthIntentFlow";
import type { AuthIntentStatus } from "@/lib/types";

let mockAuthIntentStatus: AuthIntentStatus | null = null;
let mockAvailableTenantIds: string[] | null = null;

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    authIntentStatus: mockAuthIntentStatus,
    authIntentAvailableTenantIds: mockAvailableTenantIds,
    loginV2: jest.fn(),
    advanceMfaV2: jest.fn(),
    advanceTenantPickV2: jest.fn(),
    cancelAuthIntentV2: jest.fn(),
    isLoading: false,
    isAuthenticated: false,
    error: null,
    clearError: jest.fn(),
  }),
}));

jest.mock("@/hooks/useRateLimit", () => ({
  useRateLimit: () => ({
    rateLimitInfo: {
      isRateLimited: false,
      retryAfter: null,
      message: null,
      kind: null,
    },
    setRateLimit: jest.fn(),
    clearRateLimit: jest.fn(),
  }),
}));

jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ addToast: jest.fn(), removeToast: jest.fn() }),
}));

jest.mock("@/context/ToastContext", () => ({
  useToast: () => ({ addToast: jest.fn(), removeToast: jest.fn() }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

describe("AuthIntentFlow orchestrator", () => {
  beforeEach(() => {
    mockAuthIntentStatus = null;
    mockAvailableTenantIds = null;
  });

  it("renders LoginFormV2 when status is null (initial)", () => {
    mockAuthIntentStatus = null;
    render(<AuthIntentFlow />);
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
  });

  it("renders LoginFormV2 when status is 'requires_credentials'", () => {
    mockAuthIntentStatus = "requires_credentials";
    render(<AuthIntentFlow />);
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
  });

  it("renders MfaTotpStepV2 when status is 'requires_mfa'", () => {
    mockAuthIntentStatus = "requires_mfa";
    render(<AuthIntentFlow />);
    expect(
      screen.getByRole("heading", { name: "Two-Factor Authentication" }),
    ).toBeInTheDocument();
  });

  it("renders TenantPickStep when status is 'requires_tenant_pick'", () => {
    mockAuthIntentStatus = "requires_tenant_pick";
    mockAvailableTenantIds = ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"];
    render(<AuthIntentFlow />);
    expect(
      screen.getByRole("heading", { name: "Select Workspace" }),
    ).toBeInTheDocument();
  });

  it("renders null when status is 'succeeded'", () => {
    mockAuthIntentStatus = "succeeded";
    const { container } = render(<AuthIntentFlow />);
    expect(container).toBeEmptyDOMElement();
  });

  it("defensively renders LoginFormV2 when status is 'failed'", () => {
    mockAuthIntentStatus = "failed";
    render(<AuthIntentFlow />);
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
  });

  it("defensively renders LoginFormV2 when status is 'expired'", () => {
    mockAuthIntentStatus = "expired";
    render(<AuthIntentFlow />);
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
  });

  it("defensively renders LoginFormV2 for unwired statuses (requires_passkey, requires_setup)", () => {
    mockAuthIntentStatus = "requires_passkey";
    const { rerender } = render(<AuthIntentFlow />);
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
    mockAuthIntentStatus = "requires_setup";
    rerender(<AuthIntentFlow />);
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
  });
});
