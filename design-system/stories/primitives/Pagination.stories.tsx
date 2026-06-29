import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Pagination from "@/components/ui/Pagination";

const meta = {
  title: "Primitives/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  args: {
    currentPage: 3,
    totalPages: 10,
    onPageChange: () => {},
  },
  render: (args) => {
    const [currentPage, setCurrentPage] = useState(args.currentPage);
    return (
      <Pagination
        totalPages={args.totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    );
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Pocas páginas (≤7) — se listan todas, sin elipsis.
export const FewPages: Story = {
  args: { currentPage: 2, totalPages: 5 },
};

// Primera página — la flecha «anterior» queda deshabilitada; elipsis a la derecha.
export const FirstPage: Story = {
  args: { currentPage: 1, totalPages: 12 },
};

// Página intermedia — elipsis a ambos lados.
export const MiddlePage: Story = {
  args: { currentPage: 6, totalPages: 12 },
};

// Última página — la flecha «siguiente» queda deshabilitada; elipsis a la izquierda.
export const LastPage: Story = {
  args: { currentPage: 12, totalPages: 12 },
};

function PaginationDemo({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const [page, setPage] = useState(currentPage);
  return <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />;
}

// AllVariants — ALWAYS last: the page-position states (few · first · middle · last).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">
          few pages (≤7, no ellipsis)
        </p>
        <PaginationDemo currentPage={2} totalPages={5} />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">first page</p>
        <PaginationDemo currentPage={1} totalPages={12} />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">middle page</p>
        <PaginationDemo currentPage={6} totalPages={12} />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">last page</p>
        <PaginationDemo currentPage={12} totalPages={12} />
      </div>
    </div>
  ),
};
