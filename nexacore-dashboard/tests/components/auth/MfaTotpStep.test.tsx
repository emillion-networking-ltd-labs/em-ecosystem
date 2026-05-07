import { render, screen, fireEvent } from '../../test-utils';
import MfaTotpStep from '@/components/auth/MfaTotpStep';

const mockVerifyMfaLogin = jest.fn();
const mockCancelMfa = jest.fn();
const mockClearError = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    verifyMfaLogin: mockVerifyMfaLogin,
    cancelMfa: mockCancelMfa,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  }),
}));

jest.mock('@/hooks/useRateLimit', () => ({
  useRateLimit: () => ({
    rateLimitInfo: { isRateLimited: false, retryAfter: null, message: null, kind: null },
    setRateLimit: jest.fn(),
    clearRateLimit: jest.fn(),
  }),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    addToast: jest.fn(),
    removeToast: jest.fn(),
  }),
}));

describe('MfaTotpStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trust device checkbox unchecked by default', () => {
    render(<MfaTotpStep />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText('Trust this device for 30 days')).toBeInTheDocument();
  });

  it('passes trustDevice=true to verifyMfaLogin when checkbox is checked', async () => {
    mockVerifyMfaLogin.mockResolvedValue(undefined);
    render(<MfaTotpStep />);

    // Check the trust device checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Fill in 6 digits to trigger auto-submit
    const inputs = screen.getAllByRole('textbox');
    ['1', '2', '3', '4', '5', '6'].forEach((digit, i) => {
      fireEvent.change(inputs[i], { target: { value: digit } });
    });

    expect(mockVerifyMfaLogin).toHaveBeenCalledWith('123456', false, true);
  });

  it('passes trustDevice=false when checkbox is unchecked', async () => {
    mockVerifyMfaLogin.mockResolvedValue(undefined);
    render(<MfaTotpStep />);

    // Fill in 6 digits without checking the box
    const inputs = screen.getAllByRole('textbox');
    ['1', '2', '3', '4', '5', '6'].forEach((digit, i) => {
      fireEvent.change(inputs[i], { target: { value: digit } });
    });

    expect(mockVerifyMfaLogin).toHaveBeenCalledWith('123456', false, false);
  });

  it('shows trust device checkbox in recovery code mode', () => {
    render(<MfaTotpStep />);

    // Switch to recovery code mode
    fireEvent.click(screen.getByText('Use recovery code'));

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(screen.getByText('Trust this device for 30 days')).toBeInTheDocument();
  });

  it('preserves checkbox state when switching between modes', () => {
    render(<MfaTotpStep />);

    // Check the box in TOTP mode
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Switch to recovery code mode
    fireEvent.click(screen.getByText('Use recovery code'));
    const recoveryCheckbox = screen.getByRole('checkbox');
    expect(recoveryCheckbox).toBeChecked();

    // Switch back to TOTP mode
    fireEvent.click(screen.getByText('Use authenticator app'));
    const totpCheckbox = screen.getByRole('checkbox');
    expect(totpCheckbox).toBeChecked();
  });
});
