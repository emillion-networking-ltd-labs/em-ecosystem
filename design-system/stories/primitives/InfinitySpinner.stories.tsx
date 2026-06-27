import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import InfinitySpinner from "@/components/ui/InfinitySpinner";

const meta = {
  title: "Primitives/InfinitySpinner",
  component: InfinitySpinner,
  tags: ["autodocs"],
  args: { size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
} satisfies Meta<typeof InfinitySpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-content-primary">
      {(["sm", "md", "lg"] as const).map((s) => (
        <InfinitySpinner key={s} size={s} />
      ))}
    </div>
  ),
};
