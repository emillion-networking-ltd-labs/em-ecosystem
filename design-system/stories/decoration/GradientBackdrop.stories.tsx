import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
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

// Variants — the two brand-gradient shapes. radial is the default.
const VARIANTS = ["radial", "linear"] as const;
// Intensities (boldest → faintest), with the opacity. soft is the default.
const INTENSITIES = [
  { intensity: "bold", op: "40%" },
  { intensity: "soft", op: "20%" },
  { intensity: "subtle", op: "10%" },
] as const;

const Canvas = ({ children }: { children: ReactNode }) => (
  <div className="relative isolate flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
    {children}
  </div>
);

// The decorative slot is absolute → it needs a `relative` container with height to be seen.
// Playground — brand atmosphere behind the content.
export const Default: Story = {
  render: (args) => (
    <div className="relative isolate flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
      <GradientBackdrop {...args} />
      <h2 className="text-display-3 font-display">Brand atmosphere</h2>
    </div>
  ),
};

// Variants — radial vs linear, at the default intensity.
export const Variants: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      {VARIANTS.map((variant) => (
        <div key={variant} className="space-y-1.5">
          <Canvas>
            <GradientBackdrop variant={variant} />
          </Canvas>
          <span className="text-caption text-content-tertiary font-mono">
            variant=&quot;{variant}&quot;{variant === "radial" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// Intensities — boldest → faintest, on the radial variant.
export const Intensities: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {INTENSITIES.map(({ intensity, op }) => (
        <div key={intensity} className="space-y-1.5">
          <Canvas>
            <GradientBackdrop intensity={intensity} />
          </Canvas>
          <span className="text-caption text-content-tertiary font-mono">
            {intensity} · {op}{intensity === "soft" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: every variant × intensity.
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      {VARIANTS.map((variant) => (
        <div key={variant} className="space-y-2">
          <p className="text-caption text-content-tertiary font-mono">variant=&quot;{variant}&quot;</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {INTENSITIES.map(({ intensity, op }) => (
              <div key={intensity} className="space-y-1.5">
                <Canvas>
                  <GradientBackdrop variant={variant} intensity={intensity} />
                </Canvas>
                <span className="text-caption text-content-tertiary font-mono">
                  {intensity} · {op}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
