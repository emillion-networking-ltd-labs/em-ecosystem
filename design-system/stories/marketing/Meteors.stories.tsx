import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Meteors } from "@/components/ui/Meteors";

// Aceternity UI (MIT), adoptado verbatim en ECO-88.
const meta = {
  title: "Marketing/Meteors",
  component: Meteors,
  tags: ["autodocs"],
  args: { number: 20 },
} satisfies Meta<typeof Meteors>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-inverse text-content-inverse">
      <Meteors {...args} />
      <span className="relative z-10 text-display-3 font-display">Meteoros</span>
    </div>
  ),
};
