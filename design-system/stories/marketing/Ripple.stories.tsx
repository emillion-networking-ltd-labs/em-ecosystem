import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Ripple } from "@/components/ui/Ripple";
import { DemoCard } from "../_kit";

// Marketing/Ripple — background of concentric circles that pulse (scale) with a stagger and fade toward the
// center via a mask. Color by token (content-primary). Lives behind hero/CTA content (absolute inset-0).
const meta = {
  title: "Marketing/Ripple",
  component: Ripple,
  tags: ["autodocs"],
} satisfies Meta<typeof Ripple>;

export default meta;
type Story = StoryObj<typeof meta>;

// Ripple is an absolute-positioned background; it needs a bounded tile to live in — hosted inside the project Card.
const Tile = ({
  numCircles,
  mainCircleSize,
  height = "h-96",
}: {
  numCircles?: number;
  mainCircleSize?: number;
  height?: string;
}) => (
  <div
    className={`relative flex ${height} w-full items-center justify-center overflow-hidden rounded-xl bg-surface-secondary`}
  >
    <Ripple numCircles={numCircles} mainCircleSize={mainCircleSize} />
    <span className="relative z-10 text-h2 font-semibold text-content-primary">Ripple</span>
  </div>
);

// Default — 8 concentric circles pulsing outward.
export const Default: Story = {
  render: () => (
    <DemoCard block className="overflow-hidden">
      <Tile />
    </DemoCard>
  ),
};

// Dense — more, tighter circles.
export const Dense: Story = {
  render: () => (
    <DemoCard block className="overflow-hidden">
      <Tile numCircles={12} mainCircleSize={160} />
    </DemoCard>
  ),
};
