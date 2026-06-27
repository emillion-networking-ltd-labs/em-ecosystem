import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Spinner from "@/components/ui/Spinner";

const meta = {
  title: "Primitives/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  args: { size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(["sm", "md", "lg"] as const).map((s) => (
        <Spinner key={s} size={s} />
      ))}
    </div>
  ),
};
