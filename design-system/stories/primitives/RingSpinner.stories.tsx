import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RingSpinner from "@/components/ui/RingSpinner";

const meta = {
  title: "Primitives/RingSpinner",
  component: RingSpinner,
  tags: ["autodocs"],
  args: { size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
} satisfies Meta<typeof RingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-content-primary">
      {(["sm", "md", "lg"] as const).map((s) => (
        <RingSpinner key={s} size={s} />
      ))}
    </div>
  ),
};
