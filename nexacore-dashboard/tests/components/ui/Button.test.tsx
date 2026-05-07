import { render, screen } from '../../test-utils';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: /click me/i }),
    ).toBeInTheDocument();
  });

  it('shows spinner when loading', () => {
    render(<Button loading>Submit</Button>);
    // Spinner is announced as a status live-region for screen readers.
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    // Children remain rendered (dimmed to opacity-30 visually) so the layout
    // doesn't collapse during the async transition.
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when loading', () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
