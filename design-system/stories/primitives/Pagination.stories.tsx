import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { DemoCard } from "../_kit";

const meta = {
  title: "Primitives/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  args: {
    currentPage: 3,
    totalPages: 10,
    onPageChange: () => {},
  },
  // Stateful wrapper so it's interactive; `currentPage` arg seeds the position.
  render: (args) => {
    const [currentPage, setCurrentPage] = useState(args.currentPage);
    return (
      <DemoCard>
        <Pagination totalPages={args.totalPages} currentPage={currentPage} onPageChange={setCurrentPage} />
      </DemoCard>
    );
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

// Pagination has no design-variant/size axis — its only axis is the page position (few / first / middle /
// last), which are states, each its own story. So there is no AllVariants.

// Default — a middle-ish position with ellipsis.
export const Default: Story = {};

// Few pages (≤7) — all listed, no ellipsis.
export const FewPages: Story = { args: { currentPage: 2, totalPages: 5 } };

// First page — the "previous" arrow is disabled; ellipsis on the right.
export const FirstPage: Story = { args: { currentPage: 1, totalPages: 12 } };

// Middle page — ellipsis on both sides.
export const MiddlePage: Story = { args: { currentPage: 6, totalPages: 12 } };

// Last page — the "next" arrow is disabled; ellipsis on the left.
export const LastPage: Story = { args: { currentPage: 12, totalPages: 12 } };
