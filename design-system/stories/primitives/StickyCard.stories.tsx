import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import StickyCard from "@/components/ui/StickyCard";

const meta = {
  title: "Primitives/StickyCard",
  component: StickyCard,
  tags: ["autodocs"],
  args: {
    position: "bottom",
    children: (
      <div className="p-6 text-body text-content-primary">
        Sticky card content
      </div>
    ),
  },
  argTypes: {
    position: { control: "inline-radio", options: ["top", "bottom"] },
  },
} satisfies Meta<typeof StickyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
