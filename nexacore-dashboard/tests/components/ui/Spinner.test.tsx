import { render, screen } from '../../test-utils';
import Spinner from '@/components/ui/Spinner';

describe('Spinner', () => {
  it('renders with status role', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has loading aria-label', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Loading',
    );
  });
});
