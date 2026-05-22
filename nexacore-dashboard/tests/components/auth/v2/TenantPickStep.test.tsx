import { render, screen, fireEvent } from "../../../test-utils";
import TenantPickStep from "@/components/auth/v2/TenantPickStep";

const mockAdvanceTenantPickV2 = jest.fn();
const mockCancelAuthIntentV2 = jest.fn();
let mockAvailableTenantIds: string[] | null = null;
let mockIsLoading = false;

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    authIntentAvailableTenantIds: mockAvailableTenantIds,
    advanceTenantPickV2: mockAdvanceTenantPickV2,
    cancelAuthIntentV2: mockCancelAuthIntentV2,
    isLoading: mockIsLoading,
  }),
}));

const TENANT_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const TENANT_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

describe("TenantPickStep", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAvailableTenantIds = [TENANT_A, TENANT_B];
    mockIsLoading = false;
  });

  it("renders Select Workspace heading", () => {
    render(<TenantPickStep />);
    expect(
      screen.getByRole("heading", { name: "Select Workspace" }),
    ).toBeInTheDocument();
  });

  it("renders one button per tenantId in availableTenantIds", () => {
    render(<TenantPickStep />);
    const buttons = screen.getAllByRole("button", {
      name: /Select workspace/i,
    });
    expect(buttons).toHaveLength(2);
  });

  it("renders tenant ids in monospace short form (8-prefix…4-suffix)", () => {
    render(<TenantPickStep />);
    // TENANT_A starts with 'aaaaaaaa' and ends with 'aaaa'
    expect(screen.getByText("aaaaaaaa…aaaa")).toBeInTheDocument();
    expect(screen.getByText("bbbbbbbb…bbbb")).toBeInTheDocument();
  });

  it("calls advanceTenantPickV2 with selected tenantId on click", async () => {
    mockAdvanceTenantPickV2.mockResolvedValue(undefined);
    render(<TenantPickStep />);
    const firstButton = screen.getAllByRole("button", {
      name: /Select workspace/i,
    })[0];
    fireEvent.click(firstButton);
    expect(mockAdvanceTenantPickV2).toHaveBeenCalledWith(TENANT_A);
  });

  it("Cancel button calls cancelAuthIntentV2", () => {
    render(<TenantPickStep />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockCancelAuthIntentV2).toHaveBeenCalled();
  });

  it("renders defensive empty-list UI when availableTenantIds is empty", () => {
    mockAvailableTenantIds = [];
    render(<TenantPickStep />);
    expect(
      screen.getByText("No workspaces available."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /back to sign in/i }),
    ).toBeInTheDocument();
  });

  it("renders defensive empty-list UI when availableTenantIds is null", () => {
    mockAvailableTenantIds = null;
    render(<TenantPickStep />);
    expect(
      screen.getByText("No workspaces available."),
    ).toBeInTheDocument();
  });

  it("disables tenant buttons while isLoading", () => {
    mockIsLoading = true;
    render(<TenantPickStep />);
    const buttons = screen.getAllByRole("button", {
      name: /Select workspace/i,
    });
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
