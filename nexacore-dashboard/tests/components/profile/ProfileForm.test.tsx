import { render, screen, waitFor, within } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import ProfileForm from '@/components/profile/ProfileForm';
import { mockUser } from '../../helpers/profile-mocks';

// --- Mocks ---

const mockAddToast = jest.fn();
const mockRequestEmailChange = jest.fn();

let mockUserValue = mockUser();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUserValue,
    refreshSession: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
}));

jest.mock('@/lib/email-change-api', () => ({
  requestEmailChange: (...args: unknown[]) => mockRequestEmailChange(...args),
}));

// --- Helpers ---

// The live "change email" flow lives inside ProfileForm (the standalone ChangeEmailForm was a dead
// duplicate removed in ECO-148). It is a ConfirmModal opened by the "Change Email" action button; the
// modal holds the New Email + Current Password inputs and its own "Change Email" confirm button. These
// tests exercise that live path — the coverage the removed ChangeEmailForm test only ever gave to the
// dead duplicate, not to what the app actually renders.
async function openEmailModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Change Email' }));
  return screen.findByRole('dialog');
}

// --- Tests ---

describe('ProfileForm — change email', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserValue = mockUser();
  });

  it('shows the Change Email action for a password user', () => {
    render(<ProfileForm />);

    expect(
      screen.getByRole('button', { name: 'Change Email' }),
    ).toBeInTheDocument();
  });

  it('hides Change Email for OAuth-only users (email managed by the provider)', () => {
    mockUserValue = mockUser({ hasPassword: false, oauthProviders: ['GOOGLE'] });

    render(<ProfileForm />);

    expect(
      screen.queryByRole('button', { name: 'Change Email' }),
    ).not.toBeInTheDocument();
  });

  it('opens a modal with New Email and Current Password inputs', async () => {
    render(<ProfileForm />);

    const dialog = await openEmailModal(user);

    expect(within(dialog).getByLabelText('New Email')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Current Password')).toBeInTheDocument();
  });

  it('submit calls requestEmailChange with the new email and password', async () => {
    mockRequestEmailChange.mockResolvedValue({ message: 'OK' });

    render(<ProfileForm />);
    const dialog = await openEmailModal(user);

    await user.type(within(dialog).getByLabelText('New Email'), 'new@example.com');
    await user.type(
      within(dialog).getByLabelText('Current Password'),
      'password123',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Change Email' }));

    await waitFor(() => {
      expect(mockRequestEmailChange).toHaveBeenCalledWith(
        'new@example.com',
        'password123',
      );
    });
  });

  it('shows a success toast on a successful request', async () => {
    mockRequestEmailChange.mockResolvedValue({ message: 'OK' });

    render(<ProfileForm />);
    const dialog = await openEmailModal(user);

    await user.type(within(dialog).getByLabelText('New Email'), 'new@example.com');
    await user.type(
      within(dialog).getByLabelText('Current Password'),
      'password123',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Change Email' }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'success',
          title: 'Verification email sent',
        }),
      );
    });
  });

  it('shows an error toast on API failure', async () => {
    mockRequestEmailChange.mockRejectedValue({
      error: { message: 'Server error', statusCode: 500 },
    });

    render(<ProfileForm />);
    const dialog = await openEmailModal(user);

    await user.type(within(dialog).getByLabelText('New Email'), 'new@example.com');
    await user.type(
      within(dialog).getByLabelText('Current Password'),
      'password123',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Change Email' }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'error',
          title: 'Email change failed',
        }),
      );
    });
  });

  it('blocks submit and flags a same-email as invalid', async () => {
    render(<ProfileForm />);
    const dialog = await openEmailModal(user);

    // mockUser().email === 'test@example.com'
    await user.type(within(dialog).getByLabelText('New Email'), 'test@example.com');
    await user.type(
      within(dialog).getByLabelText('Current Password'),
      'password123',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Change Email' }));

    expect(
      within(dialog).getByText(
        'New email must be different from current email',
      ),
    ).toBeInTheDocument();
    expect(mockRequestEmailChange).not.toHaveBeenCalled();
  });
});
