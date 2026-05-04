import { render, screen, waitFor } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import PasskeyManager from "@/components/profile/PasskeyManager";
import { mockPasskey } from "../../helpers/profile-mocks";

// --- Mocks ---

const mockAddToast = jest.fn();
const mockFetchPasskeys = jest.fn().mockResolvedValue(undefined);
const mockRegisterPasskey = jest.fn();
const mockRenamePasskey = jest.fn();
const mockDeletePasskey = jest.fn();
const mockClearError = jest.fn();

let hookState = {
  isSupported: true,
  passkeys: [] as ReturnType<typeof mockPasskey>[],
  isLoadingList: false,
  fetchPasskeys: mockFetchPasskeys,
  registerPasskey: mockRegisterPasskey,
  isRegistering: false,
  renamePasskey: mockRenamePasskey,
  deletePasskey: mockDeletePasskey,
  error: null as string | null,
  clearError: mockClearError,
  // Unused by PasskeyManager but present in hook
  isSupported_: true,
  loginWithPasskey: jest.fn(),
  isLoggingIn: false,
  isConditionalAvailable: false,
  startConditionalUI: jest.fn(),
  abortConditionalUI: jest.fn(),
};

jest.mock("@/hooks/usePasskey", () => ({
  usePasskey: () => hookState,
}));

jest.mock("@/context/ToastContext", () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

// --- Tests ---

describe("PasskeyManager", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchPasskeys.mockResolvedValue(undefined);
    hookState = {
      isSupported: true,
      passkeys: [],
      isLoadingList: false,
      fetchPasskeys: mockFetchPasskeys,
      registerPasskey: mockRegisterPasskey,
      isRegistering: false,
      renamePasskey: mockRenamePasskey,
      deletePasskey: mockDeletePasskey,
      error: null,
      clearError: mockClearError,
      isSupported_: true,
      loginWithPasskey: jest.fn(),
      isLoggingIn: false,
      isConditionalAvailable: false,
      startConditionalUI: jest.fn(),
      abortConditionalUI: jest.fn(),
    };
  });

  it("renders passkey list with data", () => {
    hookState.passkeys = [
      mockPasskey({ id: "1", name: "MacBook Pro" }),
      mockPasskey({
        id: "2",
        name: "iPhone",
        deviceType: "multiDevice",
        backedUp: true,
      }),
    ];

    render(<PasskeyManager />);

    expect(screen.getByText("MacBook Pro")).toBeInTheDocument();
    expect(screen.getByText("iPhone")).toBeInTheDocument();
    expect(screen.getByText("Synced")).toBeInTheDocument();
    expect(screen.getByText("2 registered")).toBeInTheDocument();
  });

  it("renders empty state when no passkeys", () => {
    hookState.passkeys = [];

    render(<PasskeyManager />);

    expect(screen.getByText(/No passkeys registered/)).toBeInTheDocument();
  });

  it("shows browser unsupported warning", () => {
    hookState.isSupported = false;

    render(<PasskeyManager />);

    expect(screen.getByText("Passkeys not supported")).toBeInTheDocument();
  });

  it("register button click opens registration view", async () => {
    render(<PasskeyManager />);

    await user.click(screen.getByRole("button", { name: /add passkey/i }));

    expect(
      screen.getByLabelText(/confirm with your password/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/passkey name/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Register Passkey" }),
    ).toBeInTheDocument();
  });

  it("register flow calls registerPasskey with password and name (SCRUM-327)", async () => {
    mockRegisterPasskey.mockResolvedValue(mockPasskey({ name: "My Key" }));

    render(<PasskeyManager />);

    await user.click(screen.getByRole("button", { name: /add passkey/i }));
    await user.type(
      screen.getByLabelText(/confirm with your password/i),
      "SecureP@ss1",
    );
    await user.type(screen.getByLabelText(/passkey name/i), "My Key");
    await user.click(screen.getByRole("button", { name: "Register Passkey" }));

    await waitFor(() => {
      expect(mockRegisterPasskey).toHaveBeenCalledWith("SecureP@ss1", "My Key");
    });
  });

  it("register modal shows inline error for invalid-password (SCRUM-327)", async () => {
    mockRegisterPasskey.mockResolvedValue("invalid-password");

    render(<PasskeyManager />);

    await user.click(screen.getByRole("button", { name: /add passkey/i }));
    await user.type(
      screen.getByLabelText(/confirm with your password/i),
      "wrong-pw",
    );
    await user.click(screen.getByRole("button", { name: "Register Passkey" }));

    expect(await screen.findByText("Invalid password")).toBeInTheDocument();
    // Modal stays open
    expect(
      screen.getByRole("button", { name: "Register Passkey" }),
    ).toBeInTheDocument();
  });

  it("delete flow shows password modal", async () => {
    hookState.passkeys = [mockPasskey({ id: "1", name: "Test Key" })];

    render(<PasskeyManager />);

    await user.click(screen.getByLabelText("Delete Test Key"));

    expect(screen.getByText("Delete Passkey")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/confirm with your password/i),
    ).toBeInTheDocument();
  });

  it("rename flow shows rename modal", async () => {
    hookState.passkeys = [mockPasskey({ id: "1", name: "Old Name" })];

    render(<PasskeyManager />);

    await user.click(screen.getByLabelText("Rename Old Name"));

    expect(screen.getByText("Rename Passkey")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Old Name")).toBeInTheDocument();
  });

  it("shows max reached message at 10 passkeys", () => {
    hookState.passkeys = Array.from({ length: 10 }, (_, i) =>
      mockPasskey({ id: String(i + 1), name: `Key ${i + 1}` }),
    );

    render(<PasskeyManager />);

    expect(screen.getByText(/maximum of 10 passkeys/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add passkey/i })).toBeDisabled();
  });
});
