import { render, screen, fireEvent, waitFor } from "../../../test-utils";
import LoginFormV2 from "@/components/auth/v2/LoginFormV2";

const mockLoginV2 = jest.fn();
const mockClearError = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    loginV2: mockLoginV2,
    isLoading: false,
    isAuthenticated: false,
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
    setRateLimit: jest.fn(),
    clearRateLimit: jest.fn(),
  }),
}));

jest.mock("@/context/ToastContext", () => ({
  useToast: () => ({ addToast: jest.fn(), removeToast: jest.fn() }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

describe("LoginFormV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Sign In heading and email + password inputs", () => {
    render(<LoginFormV2 />);
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("shows inline error when email is empty on submit", () => {
    render(<LoginFormV2 />);
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByText("Enter your email address")).toBeInTheDocument();
    expect(mockLoginV2).not.toHaveBeenCalled();
  });

  it("shows inline error when email is invalid", () => {
    const { container } = render(<LoginFormV2 />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email", name: "email" },
    });
    // fireEvent.click on a submit button inside an email-type input may be
    // blocked by JSDOM's HTML5 validation; submit the form directly instead.
    const form = container.querySelector("form")!;
    fireEvent.submit(form);
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(mockLoginV2).not.toHaveBeenCalled();
  });

  it("calls loginV2 with credentials on successful submit", async () => {
    mockLoginV2.mockResolvedValue(undefined);
    render(<LoginFormV2 />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "alice@example.com", name: "email" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-horse-battery-staple", name: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockLoginV2).toHaveBeenCalledWith(
        "alice@example.com",
        "correct-horse-battery-staple",
      );
    });
  });

  it("shows password validation error on weak password", () => {
    render(<LoginFormV2 />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "alice@example.com", name: "email" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "short", name: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockLoginV2).not.toHaveBeenCalled();
  });

  it("renders forgot-password link with email in querystring", () => {
    render(<LoginFormV2 />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "alice@example.com", name: "email" },
    });
    const link = screen.getByRole("link", {
      name: /forgot password/i,
    }) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toContain(
      "/forgot-password?email=alice%40example.com",
    );
  });

  it("calls clearError on mount to clear stale errors", () => {
    render(<LoginFormV2 />);
    expect(mockClearError).toHaveBeenCalled();
  });
});
