'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-[17px] pt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 disabled:opacity-30"
      >
        <ChevronLeft size={12} strokeWidth={1.8} className="text-content-primary" />
        <span className="text-body-sm font-medium text-content-secondary">Prev</span>
      </button>

      <div className="flex items-center gap-2">
        {pages.map((page, i) =>
          page === '...' ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-sm bg-surface-secondary text-body-sm font-medium text-content-primary"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`flex h-[38px] w-[38px] items-center justify-center rounded-sm text-body-sm ${
                page === currentPage
                  ? 'border border-content-primary bg-surface-subtle font-bold text-content-primary'
                  : 'bg-surface-secondary font-medium text-content-primary hover:bg-surface-subtle'
              }`}
            >
              {page}
            </button>
          ),
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 disabled:opacity-30"
      >
        <span className="text-body-sm font-medium text-content-primary">Next</span>
        <ChevronRight size={12} strokeWidth={1.8} className="text-content-primary" />
      </button>
    </nav>
  );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}
