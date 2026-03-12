import { render, screen } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { render as rtlRender } from '@testing-library/react';
import ErrorPage from '@/app/error';
import GlobalError from '@/app/global-error';

// Mock Button component to simplify testing
jest.mock('@/components/ui/Button', () => {
  return function MockButton({
    children,
    onClick,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
  }) {
    return (
      <button onClick={onClick} data-variant={variant}>
        {children}
      </button>
    );
  };
});

describe('ErrorPage (app-level error boundary)', () => {
  const mockReset = jest.fn();

  function makeError(message: string, digest?: string) {
    const err = new globalThis.Error(message) as Error & { digest?: string };
    if (digest) err.digest = digest;
    return err;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders "Something went wrong" heading', () => {
    render(<ErrorPage error={makeError('Test error message')} reset={mockReset} />);
    expect(
      screen.getByText('Something went wrong'),
    ).toBeInTheDocument();
  });

  it('renders error icon with accessible label', () => {
    render(<ErrorPage error={makeError('fail')} reset={mockReset} />);
    expect(screen.getByLabelText('Error')).toBeInTheDocument();
  });

  it('calls reset when "Try again" is clicked', async () => {
    const user = userEvent.setup();
    render(<ErrorPage error={makeError('fail')} reset={mockReset} />);

    await user.click(screen.getByText('Try again'));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('renders "Go back home" button', () => {
    render(<ErrorPage error={makeError('fail')} reset={mockReset} />);
    expect(screen.getByText('Go back home')).toBeInTheDocument();
  });

  it('shows error message in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<ErrorPage error={makeError('Test error message')} reset={mockReset} />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides error message in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(<ErrorPage error={makeError('Test error message')} reset={mockReset} />);
    expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
    expect(
      screen.getByText('An unexpected error occurred. Please try again.'),
    ).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('shows error digest as reference ID when available', () => {
    render(<ErrorPage error={makeError('fail', 'abc123')} reset={mockReset} />);
    expect(screen.getByText('Reference: abc123')).toBeInTheDocument();
  });

  it('does not show reference when digest is absent', () => {
    render(<ErrorPage error={makeError('fail')} reset={mockReset} />);
    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument();
  });

  it('logs error to console', () => {
    const err = makeError('Test error message');
    render(<ErrorPage error={err} reset={mockReset} />);
    expect(console.error).toHaveBeenCalledWith(
      'Error boundary caught:',
      err,
    );
  });
});

describe('GlobalError (root layout error boundary)', () => {
  const mockReset = jest.fn();

  function makeError(message: string, digest?: string) {
    const err = new globalThis.Error(message) as Error & { digest?: string };
    if (digest) err.digest = digest;
    return err;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders "Something went wrong" heading', () => {
    rtlRender(<GlobalError error={makeError('Layout crash')} reset={mockReset} />);
    expect(
      screen.getByText('Something went wrong'),
    ).toBeInTheDocument();
  });

  it('renders error icon with accessible label', () => {
    rtlRender(<GlobalError error={makeError('fail')} reset={mockReset} />);
    expect(screen.getByLabelText('Error')).toBeInTheDocument();
  });

  it('calls reset when "Try again" is clicked', async () => {
    const user = userEvent.setup();
    rtlRender(<GlobalError error={makeError('fail')} reset={mockReset} />);

    await user.click(screen.getByText('Try again'));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('renders "Go to login" fallback link', () => {
    rtlRender(<GlobalError error={makeError('fail')} reset={mockReset} />);
    const link = screen.getByText('Go to login');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/login');
  });

  it('shows error digest as reference ID when available', () => {
    rtlRender(<GlobalError error={makeError('fail', 'xyz789')} reset={mockReset} />);
    expect(screen.getByText('Reference: xyz789')).toBeInTheDocument();
  });

  it('does not show reference when digest is absent', () => {
    rtlRender(<GlobalError error={makeError('fail')} reset={mockReset} />);
    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument();
  });

  it('logs error to console', () => {
    const err = makeError('Layout crash');
    rtlRender(<GlobalError error={err} reset={mockReset} />);
    expect(console.error).toHaveBeenCalledWith(
      'Global error boundary caught:',
      err,
    );
  });
});
