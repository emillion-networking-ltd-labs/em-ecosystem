import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Ripple } from "@/components/ui/Ripple";

// Marketing/Ripple — background of concentric circles that pulse (scale) with a stagger and fade toward the
// center via a mask. Color by token (content-primary). Lives behind hero/CTA content (absolute inset-0).
const meta = {
  title: "Marketing/Ripple",
  component: Ripple,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-xl">
        <Story />
        <p className="z-10 text-h2 font-semibold text-content-primary">Ripple</p>
      </div>
    ),
  ],
} satisfies Meta<typeof Ripple>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — 8 concentric circles pulsing outward.
export const Default: Story = {};

// Dense — more, tighter circles.
export const Dense: Story = { args: { numCircles: 12, mainCircleSize: 160 } };
