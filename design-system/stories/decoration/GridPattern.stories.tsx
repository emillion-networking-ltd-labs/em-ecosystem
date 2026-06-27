import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GridPattern } from "@/components/ui/GridPattern";

const meta = {
  title: "Decoration/GridPattern",
  component: GridPattern,
  tags: ["autodocs"],
  args: { gap: 32, stroke: 1 },
} satisfies Meta<typeof GridPattern>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="relative isolate flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
      <GridPattern {...args} />
      <h2 className="text-display-3 font-display">Rejilla editorial</h2>
    </div>
  ),
};
