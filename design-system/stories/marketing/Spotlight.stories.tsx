import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spotlight } from "@/components/ui/Spotlight";

// Aceternity UI (MIT), adoptado verbatim en ECO-88.
const meta = {
  title: "Marketing/Spotlight",
  component: Spotlight,
  tags: ["autodocs"],
} satisfies Meta<typeof Spotlight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-inverse">
      <Spotlight {...args} className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />
      <span className="relative z-10 text-display-3 font-display text-content-inverse">Foco</span>
    </div>
  ),
};
