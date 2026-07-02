import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { GradientBackdrop } from "@/components/ui/GradientBackdrop";
import { DemoCard, Variants } from "../_kit";

// Decoration/GradientBackdrop — brand atmosphere painted as an absolute, blurred multi-stop gradient behind
// the content. Two shape variants (radial/linear) and three governed intensities. Pure decoration (aria-hidden),
// themed by token (--gradient-brand) — never a hex.
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

// Shape variants — the two brand-gradient shapes. radial is the default.
const VARIANTS = ["radial", "linear"] as const;
// Intensities (boldest → faintest), with the opacity. soft is the default.
const INTENSITIES = [
  { intensity: "bold", op: "40%" },
  { intensity: "soft", op: "20%" },
  { intensity: "subtle", op: "10%" },
] as const;

// The bounded surface the absolute backdrop lives on (the inner tile; DemoCard frames it as the project Card).
const Tile = ({ h = "h-56", children }: { h?: string; children: ReactNode }) => (
  <div
    className={`relative isolate flex ${h} w-full items-center justify-center overflow-hidden rounded-xl bg-surface-primary`}
  >
    {children}
  </div>
);

// Default — playground: brand atmosphere behind the content.
export const Default: Story = {
  render: (args) => (
    <DemoCard block className="overflow-hidden">
      <Tile h="h-72">
        <GradientBackdrop {...args} />
        <h2 className="text-display-3 font-display">Brand atmosphere</h2>
      </Tile>
    </DemoCard>
  ),
};

// Radial — the radial brand-gradient shape (the default variant).
export const Radial: Story = {
  render: () => (
    <DemoCard block className="overflow-hidden">
      <Tile>
        <GradientBackdrop variant="radial" />
      </Tile>
    </DemoCard>
  ),
};

// Linear — the linear brand-gradient shape.
export const Linear: Story = {
  render: () => (
    <DemoCard block className="overflow-hidden">
      <Tile>
        <GradientBackdrop variant="linear" />
      </Tile>
    </DemoCard>
  ),
};

// Intensities — boldest → faintest, on the radial variant (measure axis; the real % live here).
export const Intensities: Story = {
  render: () => (
    <Variants
      items={INTENSITIES.map(({ intensity, op }) => ({
        label: `${intensity} · ${op}${intensity === "soft" ? " (default)" : ""}`,
        className: "overflow-hidden",
        block: true,
        node: (
          <Tile>
            <GradientBackdrop intensity={intensity} />
          </Tile>
        ),
      }))}
    />
  ),
};

// AllVariants — ALWAYS last: the style axis only — the two shape variants (Radial / Linear), labels =
// the variant names. Intensities live in their own story; no variant × intensity matrix here (mixes axes).
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANTS.map((variant) => ({
        label: variant === "radial" ? "Radial" : "Linear",
        className: "overflow-hidden",
        block: true,
        node: (
          <Tile>
            <GradientBackdrop variant={variant} />
          </Tile>
        ),
      }))}
    />
  ),
};
