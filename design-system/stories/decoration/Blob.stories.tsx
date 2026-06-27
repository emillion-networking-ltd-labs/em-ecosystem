import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Blob } from "@/components/ui/Blob";

const meta = {
  title: "Decoration/Blob",
  component: Blob,
  tags: ["autodocs"],
  args: { size: "lg", intensity: "soft" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg", "xl"] },
    intensity: { control: "inline-radio", options: ["subtle", "soft", "bold"] },
  },
} satisfies Meta<typeof Blob>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="relative isolate flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
      <Blob {...args} className="-left-16 -top-16" />
      <Blob {...args} className="-bottom-16 -right-16" />
      <h2 className="text-display-3 font-display">Halo de profundidad</h2>
    </div>
  ),
};
