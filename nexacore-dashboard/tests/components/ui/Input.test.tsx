import { render, screen } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import Input from '@/components/ui/Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" name="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="Email" name="email" error="Invalid email" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<Input label="Password" name="password" type="password" />);

    const toggleBtn = screen.getByLabelText('Show password');
    await user.click(toggleBtn);
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
  });
});
