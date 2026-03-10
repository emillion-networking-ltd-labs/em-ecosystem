import { render, screen } from '../../test-utils';
import LoginForm from '@/components/auth/LoginForm';

// --- Mocks ---

const mockStartConditionalUI = jest.fn();
const mockAbortConditionalUI = jest.fn();
let mockIsConditionalAvailable = false;

jest.mock('@/hooks/usePasskey', () => ({
  usePasskey: () => ({
    isSupported: true,
    loginWithPasskey: jest.fn(),
    isLoggingIn: false,
    isConditionalAvailable: mockIsConditionalAvailable,
    startConditionalUI: mockStartConditionalUI,
    abortConditionalUI: mockAbortConditionalUI,
    passkeys: [],
    isLoadingList: false,
    fetchPasskeys: jest.fn(),
    registerPasskey: jest.fn(),
    isRegistering: false,
    renamePasskey: jest.fn(),
    deletePasskey: jest.fn(),
    error: null,
    clearError: jest.fn(),
  }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: jest.fn(),
    isLoading: false,
    isAuthenticated: false,
    error: null,
    clearError: jest.fn(),
    mfaRequired: false,
    resendVerificationPublic: jest.fn(),
  }),
}));

jest.mock('@/hooks/useRateLimit', () => ({
  useRateLimit: () => ({
    rateLimitInfo: { isRateLimited: false, retryAfter: null, message: null, kind: null },
    setRateLimit: jest.fn(),
    clearRateLimit: jest.fn(),
  }),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ addToast: jest.fn() }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn().mockReturnValue(null) }),
}));

jest.mock('@/components/auth/OAuthButtons', () => {
  return function MockOAuthButtons() {
    return <div data-testid="oauth-buttons" />;
  };
});

jest.mock('@/components/auth/MfaTotpStep', () => {
  return function MockMfaTotpStep() {
    return <div data-testid="mfa-step" />;
  };
});

jest.mock('@/components/ui/TurnstileWidget', () => {
  return function MockTurnstileWidget({ onToken }: { onToken: (t: string) => void }) {
    onToken('mock-turnstile-token');
    return <div data-testid="turnstile-widget" />;
  };
});

// --- Tests ---

describe('LoginForm — Conditional UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConditionalAvailable = false;
  });

  it('renders email input with autocomplete="username webauthn"', () => {
    render(<LoginForm />);
    const emailInput = screen.getByPlaceholderText('your@email.com');
    expect(emailInput).toHaveAttribute('autocomplete', 'username webauthn');
  });

  it('calls startConditionalUI on mount when available', () => {
    mockIsConditionalAvailable = true;
    render(<LoginForm />);
    expect(mockStartConditionalUI).toHaveBeenCalledTimes(1);
  });

  it('does not call startConditionalUI when not available', () => {
    mockIsConditionalAvailable = false;
    render(<LoginForm />);
    expect(mockStartConditionalUI).not.toHaveBeenCalled();
  });

  it('calls abortConditionalUI on unmount', () => {
    mockIsConditionalAvailable = true;
    const { unmount } = render(<LoginForm />);
    unmount();
    expect(mockAbortConditionalUI).toHaveBeenCalled();
  });
});
