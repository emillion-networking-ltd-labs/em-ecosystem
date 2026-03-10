import { render, screen, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import SecurityActivity from '@/components/profile/SecurityActivity';
import { mockSecurityEvent } from '../../helpers/profile-mocks';

// --- Mocks ---

const mockGetSecurityActivity = jest.fn();

jest.mock('@/lib/security-activity-api', () => ({
  getSecurityActivity: (...args: unknown[]) => mockGetSecurityActivity(...args),
}));

jest.mock('@/components/ui/Pagination', () => {
  return function MockPagination({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) {
    if (totalPages <= 1) return null;
    return (
      <div data-testid="pagination">
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => onPageChange(2)}>Next</button>
      </div>
    );
  };
});

// --- Tests ---

describe('SecurityActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading text during fetch', () => {
    mockGetSecurityActivity.mockReturnValue(new Promise(() => {})); // never resolves
    render(<SecurityActivity />);
    expect(screen.getByText('Loading events...')).toBeInTheDocument();
  });

  it('renders events list with data', async () => {
    mockGetSecurityActivity.mockResolvedValue({
      data: [
        mockSecurityEvent({ id: '1', action: 'LOGIN_SUCCESS', ipAddress: '10.0.0.1' }),
        mockSecurityEvent({ id: '2', action: 'ACCOUNT_LOCKED', ipAddress: '10.0.0.2' }),
      ],
      meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });

    render(<SecurityActivity />);

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
    expect(screen.getByText('Account Locked')).toBeInTheDocument();
    expect(screen.getByText(/10\.0\.0\.1/)).toBeInTheDocument();
    expect(screen.getByText(/10\.0\.0\.2/)).toBeInTheDocument();
  });

  it('renders empty state when no events', async () => {
    mockGetSecurityActivity.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });

    render(<SecurityActivity />);

    await waitFor(() => {
      expect(screen.getByText('No security events.')).toBeInTheDocument();
    });
  });

  it('renders correct labels for event types', async () => {
    mockGetSecurityActivity.mockResolvedValue({
      data: [
        mockSecurityEvent({ id: '1', action: 'PASSKEY_REGISTERED' }),
        mockSecurityEvent({ id: '2', action: 'OAUTH_UNLINKED' }),
        mockSecurityEvent({ id: '3', action: 'TOKEN_REFRESH' }),
      ],
      meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
    });

    render(<SecurityActivity />);

    await waitFor(() => {
      expect(screen.getByText('Passkey Registered')).toBeInTheDocument();
    });
    expect(screen.getByText('OAuth Unlinked')).toBeInTheDocument();
    expect(screen.getByText('Session Refreshed')).toBeInTheDocument();
  });

  it('shows System when ipAddress is null', async () => {
    mockGetSecurityActivity.mockResolvedValue({
      data: [mockSecurityEvent({ id: '1', ipAddress: null })],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    render(<SecurityActivity />);

    await waitFor(() => {
      expect(screen.getByText(/System/)).toBeInTheDocument();
    });
  });

  it('pagination triggers refetch with new page', async () => {
    mockGetSecurityActivity.mockResolvedValue({
      data: Array.from({ length: 10 }, (_, i) =>
        mockSecurityEvent({ id: String(i + 1) }),
      ),
      meta: { total: 20, page: 1, limit: 10, totalPages: 2 },
    });

    const { getByText } = render(<SecurityActivity />);

    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    // Click next page
    const user = userEvent.setup();
    await user.click(getByText('Next'));

    // Should have been called with page 2
    await waitFor(() => {
      expect(mockGetSecurityActivity).toHaveBeenCalledWith(2, 10);
    });
  });

  it('shows empty state on API error', async () => {
    mockGetSecurityActivity.mockRejectedValue(new Error('Network error'));

    render(<SecurityActivity />);

    await waitFor(() => {
      expect(screen.getByText('No security events.')).toBeInTheDocument();
    });
  });
});
