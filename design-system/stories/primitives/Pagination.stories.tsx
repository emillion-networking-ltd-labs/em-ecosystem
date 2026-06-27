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
