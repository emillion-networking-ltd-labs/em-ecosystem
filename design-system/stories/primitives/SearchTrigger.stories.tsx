import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SearchTrigger from "@/components/ui/SearchTrigger";

const meta = {
  title: "Primitives/SearchTrigger",
  component: SearchTrigger,
  tags: ["autodocs"],
  args: {
    onClick: () => {},
  },
} satisfies Meta<typeof SearchTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
