import { render, screen } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import TrustedDevices from '@/components/profile/TrustedDevices';
import { mockTrustedDevice } from '../../helpers/profile-mocks';

// --- Mocks ---

const mockAddToast = jest.fn();
const mockFetchDevices = jest.fn();
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

jest.mock('@/hooks/useTrustedDevices', () => ({
  useTrustedDevices: () => hookState,
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

// --- Tests ---

describe('TrustedDevices', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('renders device list with data', () => {
    hookState.devices = [
      mockTrustedDevice({ id: '1', deviceName: 'Chrome on Windows' }),
      mockTrustedDevice({ id: '2', deviceName: 'Safari on iPhone' }),
    ];

    render(<TrustedDevices />);

    expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
    expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
  });

  it('renders empty state when no devices', () => {
    hookState.devices = [];
    hookState.isLoading = false;

    render(<TrustedDevices />);

    expect(screen.getByText(/No trusted devices/)).toBeInTheDocument();
  });

  it('shows loading spinner during fetch', () => {
    hookState.isLoading = true;
    hookState.devices = [];

    const { container } = render(<TrustedDevices />);

    // Spinner renders as an animated div, not text
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('revoke device shows confirmation modal', async () => {
    hookState.devices = [mockTrustedDevice({ id: '1', deviceName: 'Chrome on Windows' })];

    render(<TrustedDevices />);

    // Click the revoke button using aria-label
    await user.click(screen.getByLabelText('Revoke trust for Chrome on Windows'));

    // Modal should appear with confirmation title
    expect(screen.getByText('Revoke Device Trust')).toBeInTheDocument();
  });

  it('trust current device calls trustCurrentDevice', async () => {
    hookState.devices = [];
    mockTrustCurrentDevice.mockResolvedValue(true);

    render(<TrustedDevices />);

    const trustButton = screen.getByRole('button', { name: /trust this device/i });
    await user.click(trustButton);

    expect(mockTrustCurrentDevice).toHaveBeenCalled();
  });

  it('calls fetchDevices on mount', () => {
    render(<TrustedDevices />);
    expect(mockFetchDevices).toHaveBeenCalled();
  });
});
