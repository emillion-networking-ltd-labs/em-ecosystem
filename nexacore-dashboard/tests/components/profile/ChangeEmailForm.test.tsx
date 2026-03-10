import { render, screen, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import ChangeEmailForm from '@/components/profile/ChangeEmailForm';
import { mockUser } from '../../helpers/profile-mocks';

// --- Mocks ---

const mockAddToast = jest.fn();
const mockRequestEmailChange = jest.fn();

let mockUserValue = mockUser();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUserValue }),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

jest.mock('@/lib/email-change-api', () => ({
  requestEmailChange: (...args: unknown[]) => mockRequestEmailChange(...args),
}));

// --- Tests ---

describe('ChangeEmailForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserValue = mockUser();
  });

  it('renders form with email and password inputs', () => {
    render(<ChangeEmailForm />);

    expect(screen.getByLabelText('New Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change Email' })).toBeInTheDocument();
  });

  it('shows OAuth-only message when user has no password', () => {
    mockUserValue = mockUser({ hasPassword: false, oauthProviders: ['GOOGLE'] });

    render(<ChangeEmailForm />);

    expect(screen.getByText(/Your email is managed by Google/)).toBeInTheDocument();
    expect(screen.queryByLabelText('New Email')).not.toBeInTheDocument();
  });

  it('submit calls requestEmailChange with correct args', async () => {
    mockRequestEmailChange.mockResolvedValue({ message: 'OK' });

    render(<ChangeEmailForm />);

    await user.type(screen.getByLabelText('New Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Current Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Change Email' }));

    await waitFor(() => {
      expect(mockRequestEmailChange).toHaveBeenCalledWith('new@example.com', 'password123');
    });
  });

  it('shows success toast on successful submission', async () => {
    mockRequestEmailChange.mockResolvedValue({ message: 'OK' });

    render(<ChangeEmailForm />);

    await user.type(screen.getByLabelText('New Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Current Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Change Email' }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success', title: 'Verification email sent' }),
      );
    });
  });

  it('shows error toast on API failure', async () => {
    mockRequestEmailChange.mockRejectedValue({
      error: { message: 'Server error', statusCode: 500 },
    });

    render(<ChangeEmailForm />);

    await user.type(screen.getByLabelText('New Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Current Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Change Email' }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' }),
      );
    });
  });

  it('shows validation error for same email', async () => {
    render(<ChangeEmailForm />);

    await user.type(screen.getByLabelText('New Email'), 'test@example.com');

    expect(screen.getByText('New email must be different from current email')).toBeInTheDocument();
  });
});
