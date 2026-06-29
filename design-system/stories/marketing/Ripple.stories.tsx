import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Ripple } from "@/components/ui/Ripple";

// Marketing/Ripple — background of concentric circles that pulse (scale) with a stagger and fade toward the
// center via a mask. Color by token (content-primary). Lives behind hero/CTA content (absolute inset-0).
const meta = {
  title: "Marketing/Ripple",
  component: Ripple,
  tags: ["autodocs"],
  // Single stories get the centered demo frame; the overview (`framed: false`) brings its own frames.
  decorators: [
    (Story, ctx) =>
      ctx.parameters.framed === false ? (
        <Story />
      ) : (
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

// AllVariants — ALWAYS last: the density configs (numCircles × mainCircleSize), each in its own frame.
export const AllVariants: Story = {
  parameters: { framed: false },
  render: () => (
    <div className="flex flex-wrap items-center justify-center gap-6">
      {[
        { label: "default · 8 · 210px", props: {} },
        { label: "dense · 12 · 160px", props: { numCircles: 12, mainCircleSize: 160 } },
      ].map(({ label, props }) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <div className="relative flex h-[280px] w-[280px] items-center justify-center overflow-hidden rounded-xl">
            <Ripple {...props} />
          </div>
          <span className="text-caption text-content-tertiary font-mono">{label}</span>
        </div>
      ))}
    </div>
  ),
};
