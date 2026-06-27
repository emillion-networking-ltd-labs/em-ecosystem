import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GradientBackdrop } from "@/components/ui/GradientBackdrop";

const meta = {
  title: "Decoration/GradientBackdrop",
  component: GradientBackdrop,
  tags: ["autodocs"],
  args: { variant: "radial", intensity: "soft", blur: true },
  argTypes: {
    variant: { control: "inline-radio", options: ["linear", "radial"] },
    intensity: { control: "inline-radio", options: ["subtle", "soft", "bold"] },
  },
} satisfies Meta<typeof GradientBackdrop>;

export default meta;
type Story = StoryObj<typeof meta>;

// Slot decorativo absoluto → necesita un contenedor `relative` con altura para verse.
export const Default: Story = {
  render: (args) => (
    <div className="relative isolate flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
      <GradientBackdrop {...args} />
      <h2 className="text-display-3 font-display">Atmósfera de marca</h2>
    </div>
  ),
};
