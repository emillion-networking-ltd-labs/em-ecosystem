import { render, screen, fireEvent, waitFor } from "../../../test-utils";
import MfaTotpStepV2 from "@/components/auth/v2/MfaTotpStepV2";
import { RateLimitError } from "@/lib/types";

const mockAdvanceMfaV2 = jest.fn();
const mockCancelAuthIntentV2 = jest.fn();
const mockClearError = jest.fn();
const mockSetRateLimit = jest.fn();
const mockAddToast = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    advanceMfaV2: mockAdvanceMfaV2,
    cancelAuthIntentV2: mockCancelAuthIntentV2,
    isLoading: false,
    error: null,
    clearError: mockClearError,
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
    setRateLimit: mockSetRateLimit,
    clearRateLimit: jest.fn(),
  }),
}));

jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ addToast: mockAddToast, removeToast: jest.fn() }),
}));

describe("MfaTotpStepV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Two-Factor Authentication heading by default", () => {
    render(<MfaTotpStepV2 />);
    expect(
      screen.getByRole("heading", { name: "Two-Factor Authentication" }),
    ).toBeInTheDocument();
  });

  it("renders 6-digit MfaDigitInput", () => {
    render(<MfaTotpStepV2 />);
    // MfaDigitInput renders 6 inputs (only the first has an id by component design)
    expect(document.getElementById("totp-digit-0")).toBeInTheDocument();
    expect(screen.getByText("Verification Code")).toBeInTheDocument();
  });

  it("Verify button is disabled until 6 digits entered", () => {
    render(<MfaTotpStepV2 />);
    const verifyBtn = screen.getByRole("button", { name: /verify/i });
    expect(verifyBtn).toBeDisabled();
  });

  it("Cancel button calls cancelAuthIntentV2", () => {
    render(<MfaTotpStepV2 />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockCancelAuthIntentV2).toHaveBeenCalled();
  });

  it('switches to recovery code form when "Use recovery code" clicked', () => {
    render(<MfaTotpStepV2 />);
    fireEvent.click(screen.getByRole("button", { name: /use recovery code/i }));
    expect(
      screen.getByRole("heading", { name: "Recovery Code" }),
    ).toBeInTheDocument();
    // The recovery code input has no name binding; query by placeholder.
    expect(
      screen.getByPlaceholderText("xxxx-xxxx-xxxx"),
    ).toBeInTheDocument();
  });

  it("submits recovery code via advanceMfaV2(undefined, recoveryCode)", async () => {
    mockAdvanceMfaV2.mockResolvedValue(undefined);
    render(<MfaTotpStepV2 />);
    fireEvent.click(screen.getByRole("button", { name: /use recovery code/i }));
    fireEvent.change(screen.getByPlaceholderText("xxxx-xxxx-xxxx"), {
      target: { value: "abcd-1234-efgh" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));
    expect(mockAdvanceMfaV2).toHaveBeenCalledWith(undefined, "abcd-1234-efgh");
  });

  it('switches back from recovery to TOTP via "Use authenticator app"', () => {
    render(<MfaTotpStepV2 />);
    fireEvent.click(screen.getByRole("button", { name: /use recovery code/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /use authenticator app/i }),
    );
    expect(
      screen.getByRole("heading", { name: "Two-Factor Authentication" }),
    ).toBeInTheDocument();
  });

  it("handles RateLimitError from advanceMfaV2 with setRateLimit + toast", async () => {
    mockAdvanceMfaV2.mockRejectedValue(
      new RateLimitError(60, "Too many attempts.", "throttle"),
    );
    render(<MfaTotpStepV2 />);
    // Switch to recovery code branch (simpler input than 6-digit grid for triggering submit)
    fireEvent.click(screen.getByRole("button", { name: /use recovery code/i }));
    fireEvent.change(screen.getByPlaceholderText("xxxx-xxxx-xxxx"), {
      target: { value: "abcd-1234-efgh" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));
    await waitFor(() => {
      expect(mockSetRateLimit).toHaveBeenCalledWith(60, "Too many attempts.");
      expect(mockAddToast).toHaveBeenCalled();
    });
  });
});
