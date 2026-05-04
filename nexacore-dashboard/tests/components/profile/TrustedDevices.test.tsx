import { render, screen } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import TrustedDevices from "@/components/profile/TrustedDevices";
import { mockTrustedDevice } from "../../helpers/profile-mocks";

// --- Mocks ---

const mockAddToast = jest.fn();
const mockFetchDevices = jest.fn().mockResolvedValue(undefined);
const mockTrustCurrentDevice = jest.fn();
const mockRevokeDevice = jest.fn();
const mockRevokeAllDevices = jest.fn();

let hookState = {
  devices: [] as ReturnType<typeof mockTrustedDevice>[],
  isLoading: false,
  fetchDevices: mockFetchDevices,
  trustCurrentDevice: mockTrustCurrentDevice,
  revokeDevice: mockRevokeDevice,
  revokeAllDevices: mockRevokeAllDevices,
  error: null as string | null,
  clearError: jest.fn(),
};

jest.mock("@/hooks/useTrustedDevices", () => ({
  useTrustedDevices: () => hookState,
}));

jest.mock("@/context/ToastContext", () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

jest.mock("@/hooks/useRateLimit", () => ({
  useRateLimit: () => ({
    rateLimitInfo: { isRateLimited: false, retryAfter: null },
    setRateLimit: jest.fn(),
    clearRateLimit: jest.fn(),
  }),
}));

// --- Tests ---

describe("TrustedDevices", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchDevices.mockResolvedValue(undefined);
    hookState = {
      devices: [],
      isLoading: false,
      fetchDevices: mockFetchDevices,
      trustCurrentDevice: mockTrustCurrentDevice,
      revokeDevice: mockRevokeDevice,
      revokeAllDevices: mockRevokeAllDevices,
      error: null,
      clearError: jest.fn(),
    };
  });

  it("renders device list with data", () => {
    hookState.devices = [
      mockTrustedDevice({ id: "1", deviceName: "Chrome on Windows" }),
      mockTrustedDevice({ id: "2", deviceName: "Safari on iPhone" }),
    ];

    render(<TrustedDevices />);

    expect(screen.getByText("Chrome on Windows")).toBeInTheDocument();
    expect(screen.getByText("Safari on iPhone")).toBeInTheDocument();
  });

  it("renders empty state when no devices", () => {
    hookState.devices = [];
    hookState.isLoading = false;

    render(<TrustedDevices />);

    expect(screen.getByText(/No trusted devices/)).toBeInTheDocument();
  });

  it("shows loading spinner during fetch", () => {
    hookState.isLoading = true;
    hookState.devices = [];

    const { container } = render(<TrustedDevices />);

    // Spinner renders as an animated div, not text
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("revoke device shows confirmation modal", async () => {
    hookState.devices = [
      mockTrustedDevice({ id: "1", deviceName: "Chrome on Windows" }),
    ];

    render(<TrustedDevices />);

    // Click the revoke button using aria-label
    await user.click(
      screen.getByLabelText("Revoke trust for Chrome on Windows"),
    );

    // Modal should appear with confirmation title
    expect(screen.getByText("Revoke Device Trust")).toBeInTheDocument();
  });

  it("trust button opens password confirmation modal (SCRUM-327)", async () => {
    hookState.devices = [];

    render(<TrustedDevices />);

    const trustButton = screen.getByRole("button", {
      name: /trust this device/i,
    });
    await user.click(trustButton);

    // Modal opens; trustCurrentDevice not yet called
    expect(
      screen.getByText("Trust This Device", { selector: "h2" }),
    ).toBeInTheDocument();
    expect(mockTrustCurrentDevice).not.toHaveBeenCalled();
  });

  it("trust modal calls trustCurrentDevice with password on confirm (SCRUM-327)", async () => {
    hookState.devices = [];
    mockTrustCurrentDevice.mockResolvedValue("trusted");

    render(<TrustedDevices />);

    await user.click(
      screen.getByRole("button", { name: /trust this device/i }),
    );
    await user.type(
      screen.getByLabelText("Confirm with your password"),
      "SecureP@ss1",
    );
    await user.click(screen.getByRole("button", { name: /trust device/i }));

    expect(mockTrustCurrentDevice).toHaveBeenCalledWith("SecureP@ss1");
  });

  it("trust modal fires INVALID_PASSWORD toast (not inline) on backend 401 (SCRUM-327)", async () => {
    hookState.devices = [];
    mockTrustCurrentDevice.mockResolvedValue("invalid-password");

    render(<TrustedDevices />);

    await user.click(
      screen.getByRole("button", { name: /trust this device/i }),
    );
    await user.type(
      screen.getByLabelText("Confirm with your password"),
      "wrong-pw",
    );
    await user.click(screen.getByRole("button", { name: /trust device/i }));

    // Backend errors → toast (per feedback_toast_only_for_backend_errors.md).
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "error",
        title: "Invalid password",
      }),
    );
    // Modal stays open so the user can retry.
    expect(
      screen.getByText("Trust This Device", { selector: "h2" }),
    ).toBeInTheDocument();
  });

  it("revoke modal calls revokeDevice with password on confirm (SCRUM-327)", async () => {
    hookState.devices = [
      mockTrustedDevice({ id: "dev-1", deviceName: "Chrome on Windows" }),
    ];
    mockRevokeDevice.mockResolvedValue(true);

    render(<TrustedDevices />);

    await user.click(
      screen.getByLabelText("Revoke trust for Chrome on Windows"),
    );
    await user.type(
      screen.getByLabelText("Confirm with your password"),
      "SecureP@ss1",
    );
    await user.click(screen.getByRole("button", { name: /^revoke$/i }));

    expect(mockRevokeDevice).toHaveBeenCalledWith("dev-1", "SecureP@ss1");
  });

  it("calls fetchDevices on mount", () => {
    render(<TrustedDevices />);
    expect(mockFetchDevices).toHaveBeenCalled();
  });
});
