import { render, screen } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import Pagination from '@/components/ui/Pagination';

describe('Pagination', () => {
  it('renders page buttons', () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />,
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('returns null when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('disables Prev on first page', () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />,
    );
    // Component uses chevron icons + aria-label (no visible text)
    const prevBtn = screen.getByRole('button', { name: /previous page/i });
    expect(prevBtn).toBeDisabled();
  });

  it('disables Next on last page', () => {
    render(
      <Pagination currentPage={5} totalPages={5} onPageChange={() => {}} />,
    );
    const nextBtn = screen.getByRole('button', { name: /next page/i });
    expect(nextBtn).toBeDisabled();
  });

  it('calls onPageChange when a page button is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />,
    );

    await user.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
