import { render, screen, waitFor, within } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import ConnectedAccounts from '@/components/profile/ConnectedAccounts';
import { mockUser } from '../../helpers/profile-mocks';

// --- Mocks ---

const mockAddToast = jest.fn();
const mockRefreshSession = jest.fn().mockResolvedValue(undefined);
const mockUnlinkOAuth = jest.fn();
const mockGenerateLinkCode = jest.fn();

let mockUserValue = mockUser();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUserValue,
    refreshSession: mockRefreshSession,
  }),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

jest.mock('@/lib/oauth-api', () => ({
  unlinkOAuth: (...args: unknown[]) => mockUnlinkOAuth(...args),
  generateLinkCode: (...args: unknown[]) => mockGenerateLinkCode(...args),
}));

// jsdom 26+/jest 30 locked down window.location entirely (assign/replace/href
// are non-writable + non-configurable). We mock the navigation wrapper module
// instead — the component imports navigateTo() from @/lib/navigation, so this
// gives a clean assertion surface without fighting jsdom.
const mockNavigateTo = jest.fn();
jest.mock('@/lib/navigation', () => ({
  navigateTo: (...args: unknown[]) => mockNavigateTo(...args),
}));

// --- Tests ---

describe('ConnectedAccounts', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserValue = mockUser();
    mockGenerateLinkCode.mockResolvedValue({ code: 'test-link-code' });
    mockNavigateTo.mockClear();
  });

  it('renders connected providers with status', () => {
    mockUserValue = mockUser({ oauthProviders: ['GOOGLE'], hasPassword: true });

    render(<ConnectedAccounts />);

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    // Google should show Disconnect, GitHub should show Connect
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });

  it('renders both providers as unconnected', () => {
    mockUserValue = mockUser({ oauthProviders: [] });

    render(<ConnectedAccounts />);

    const connectButtons = screen.getAllByText('Connect');
    expect(connectButtons).toHaveLength(2);
  });

  it('connect button calls generateLinkCode and sets window.location.href with code', async () => {
    mockUserValue = mockUser({ oauthProviders: [] });

    render(<ConnectedAccounts />);

    const connectButtons = screen.getAllByText('Connect');
    await user.click(connectButtons[0]); // Google

    await waitFor(() => {
      expect(mockGenerateLinkCode).toHaveBeenCalled();
      expect(mockNavigateTo).toHaveBeenCalled();
      const lastUrl = mockNavigateTo.mock.calls.at(-1)?.[0] as string;
      expect(lastUrl).toContain('/auth/link/google');
      expect(lastUrl).toContain('code=test-link-code');
    });
  });

  it('shows error toast when generateLinkCode fails', async () => {
    mockUserValue = mockUser({ oauthProviders: [] });
    mockGenerateLinkCode.mockRejectedValue(new Error('Unauthorized'));

    render(<ConnectedAccounts />);

    const connectButtons = screen.getAllByText('Connect');
    await user.click(connectButtons[0]);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error', title: 'Connection failed' }),
      );
    });
  });

  it('disconnect button shows password modal', async () => {
    mockUserValue = mockUser({ oauthProviders: ['GOOGLE', 'GITHUB'], hasPassword: true });

    render(<ConnectedAccounts />);

    const disconnectButtons = screen.getAllByText('Disconnect');
    await user.click(disconnectButtons[0]);

    expect(screen.getByText(/Disconnect Google/)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('unlink calls unlinkOAuth and refreshSession', async () => {
    mockUserValue = mockUser({ oauthProviders: ['GOOGLE', 'GITHUB'], hasPassword: true });
    mockUnlinkOAuth.mockResolvedValue({ message: 'OK' });

    render(<ConnectedAccounts />);

    const disconnectButtons = screen.getAllByText('Disconnect');
    await user.click(disconnectButtons[0]); // Google

    await user.type(screen.getByLabelText('Password'), 'password123');

    // Find the modal's Disconnect button — scope the query to the dialog
    // (ConfirmModal renders with role="dialog") so we don't hit the row's
    // own Disconnect button that opened the modal.
    const dialog = await screen.findByRole('dialog');
    const modalDisconnect = within(dialog).getByRole('button', {
      name: /^disconnect$/i,
    });
    await user.click(modalDisconnect);

    await waitFor(() => {
      expect(mockUnlinkOAuth).toHaveBeenCalledWith('GOOGLE', 'password123');
      expect(mockRefreshSession).toHaveBeenCalled();
    });
  });

  it('cannot disconnect last auth method without password', () => {
    mockUserValue = mockUser({ hasPassword: false, oauthProviders: ['GOOGLE'] });

    render(<ConnectedAccounts />);

    expect(screen.getByText('Set a password first')).toBeInTheDocument();
    expect(screen.queryByText('Disconnect')).not.toBeInTheDocument();
  });

  it('shows error toast on unlink failure', async () => {
    mockUserValue = mockUser({ oauthProviders: ['GOOGLE', 'GITHUB'], hasPassword: true });
    mockUnlinkOAuth.mockRejectedValue({
      error: { message: 'Server error', statusCode: 500 },
    });

    render(<ConnectedAccounts />);

    const disconnectButtons = screen.getAllByText('Disconnect');
    await user.click(disconnectButtons[0]);

    await user.type(screen.getByLabelText('Password'), 'password123');

    const dialog = await screen.findByRole('dialog');
    const modalDisconnect = within(dialog).getByRole('button', {
      name: /^disconnect$/i,
    });
    await user.click(modalDisconnect);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' }),
      );
    });
  });
});
