import { render, screen, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import DeleteAccount from '@/components/profile/DeleteAccount';
import { mockUser } from '../../helpers/profile-mocks';

// --- Mocks ---

const mockAddToast = jest.fn();
const mockLogout = jest.fn().mockResolvedValue(undefined);
const mockPush = jest.fn();
const mockDeleteAccount = jest.fn();

let mockUserValue = mockUser();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUserValue, logout: mockLogout }),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/delete-account-api', () => ({
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
}));

// --- Tests ---

describe('DeleteAccount', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserValue = mockUser();
  });

  it('renders danger zone with delete button', () => {
    render(<DeleteAccount />);

    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Account' })).toBeInTheDocument();
  });

  it('shows confirmation modal on click', async () => {
    render(<DeleteAccount />);

    await user.click(screen.getByRole('button', { name: 'Delete Account' }));

    expect(screen.getByPlaceholderText('Type DELETE')).toBeInTheDocument();
    expect(screen.getByText('Delete My Account')).toBeInTheDocument();
  });

  it('requires password for password users', async () => {
    mockUserValue = mockUser({ hasPassword: true });

    render(<DeleteAccount />);
    await user.click(screen.getByRole('button', { name: 'Delete Account' }));

    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('no password field for OAuth-only users', async () => {
    mockUserValue = mockUser({ hasPassword: false, oauthProviders: ['GOOGLE'] });

    render(<DeleteAccount />);
    await user.click(screen.getByRole('button', { name: 'Delete Account' }));

    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });

  it('successful deletion triggers logout and redirect', async () => {
    mockUserValue = mockUser({ hasPassword: false, oauthProviders: ['GOOGLE'] });
    mockDeleteAccount.mockResolvedValue({ message: 'OK' });

    render(<DeleteAccount />);
    await user.click(screen.getByRole('button', { name: 'Delete Account' }));

    // Type DELETE
    await user.type(screen.getByPlaceholderText('Type DELETE'), 'DELETE');
    await user.click(screen.getByText('Delete My Account'));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledWith(undefined);
      expect(mockLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error toast on API failure', async () => {
    mockUserValue = mockUser({ hasPassword: false, oauthProviders: ['GOOGLE'] });
    mockDeleteAccount.mockRejectedValue({
      error: { message: 'Server error', statusCode: 500 },
    });

    render(<DeleteAccount />);
    await user.click(screen.getByRole('button', { name: 'Delete Account' }));

    await user.type(screen.getByPlaceholderText('Type DELETE'), 'DELETE');
    await user.click(screen.getByText('Delete My Account'));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' }),
      );
    });
  });
});
