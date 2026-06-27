import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DotPattern } from "@/components/ui/DotPattern";

const meta = {
  title: "Decoration/DotPattern",
  component: DotPattern,
  tags: ["autodocs"],
  args: { gap: 16, radius: 1 },
} satisfies Meta<typeof DotPattern>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="relative isolate flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
      <DotPattern {...args} />
      <h2 className="text-display-3 font-display">Textura de puntos</h2>
    </div>
  ),
};

export const Accent: Story = {
  render: (args) => (
    <div className="relative isolate flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
      <DotPattern {...args} className="text-accent opacity-40" />
      <h2 className="text-display-3 font-display">Tematizada por token</h2>
    </div>
  ),
};
