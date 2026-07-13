"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import { ChevronLeft, ChevronRight } from "lucide-react";
import Icon from "./Icon";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const pageBase =
  "flex h-8 w-8 items-center justify-center rounded-md text-caption font-normal border border-border-components transition-colors";
const pageActive =
  "bg-surface-inverse text-content-inverse transition-opacity hover:opacity-90";
const pageInactive =
  "bg-surface-primary text-content-primary hover:bg-surface-subtle";
const arrowBase =
  "flex h-8 w-8 items-center justify-center rounded-md border border-border-components text-content-primary transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50";

export const paginationSpecs = {
  page: {
    base: pageBase,
    active: pageActive,
    inactive: pageInactive,
    ellipsis: "text-content-tertiary (no hover, no border)",
  },
  arrows: {
    shared: arrowBase,
    icon: "ChevronLeft/Right 16px",
  },
  dimensions: {
    size: "h-8 w-8 (32px) — Button sm size",
    gap: "gap-1 between pages",
    radius: "rounded-md",
  },
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={arrowBase}
        aria-label="Previous page"
      >
        <Icon icon={ChevronLeft} size="md" />
      </button>

      {pages.map((page, i) =>
        page === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-8 w-8 items-center justify-center text-caption font-normal text-content-tertiary"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`${pageBase} ${page === currentPage ? pageActive : pageInactive}`}
          >
            {page}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={arrowBase}
        aria-label="Next page"
      >
        <Icon icon={ChevronRight} size="md" />
      </button>
    </nav>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}
