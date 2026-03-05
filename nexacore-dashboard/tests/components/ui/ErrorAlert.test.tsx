import { render, screen } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import ErrorAlert from '@/components/ui/ErrorAlert';

describe('ErrorAlert', () => {
  it('renders error message', () => {
    render(<ErrorAlert message="Something went wrong" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong',
    );
  });

  it('returns null when message is empty', () => {
    const { container } = render(<ErrorAlert message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows dismiss button when onDismiss is provided', () => {
    render(<ErrorAlert message="Error" onDismiss={() => {}} />);
    expect(screen.getByLabelText('Dismiss error')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    render(<ErrorAlert message="Error" onDismiss={onDismiss} />);

    await user.click(screen.getByLabelText('Dismiss error'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
