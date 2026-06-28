import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
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

// Sizes (largest → smallest), with the diameter. lg is the default.
const SIZES = [
  { size: "xl", px: "512" },
  { size: "lg", px: "384" },
  { size: "md", px: "288" },
  { size: "sm", px: "192" },
] as const;

// Intensities (boldest → faintest), with the opacity. soft is the default.
const INTENSITIES = [
  { intensity: "bold", op: "50%" },
  { intensity: "soft", op: "30%" },
  { intensity: "subtle", op: "20%" },
] as const;

const Canvas = ({ children }: { children: ReactNode }) => (
  <div className="relative isolate flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
    {children}
  </div>
);

// Playground — a soft brand halo anchored at two corners.
export const Default: Story = {
  render: (args) => (
    <Canvas>
      <Blob {...args} className="-left-16 -top-16" />
      <Blob {...args} className="-bottom-16 -right-16" />
      <h2 className="text-display-3 font-display">Depth halo</h2>
    </Canvas>
  ),
};

// Sizes — one halo per diameter, centered.
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {SIZES.map(({ size, px }) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <div className="relative isolate flex h-56 w-56 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
            <Blob size={size} intensity="soft" className="static -z-0" />
          </div>
          <span className="text-caption text-content-tertiary font-mono">
            {size} · {px}px{size === "lg" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// Intensities — same halo, opacity boldest → faintest.
export const Intensities: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {INTENSITIES.map(({ intensity, op }) => (
        <div key={intensity} className="flex flex-col items-center gap-1.5">
          <div className="relative isolate flex h-56 w-56 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
            <Blob size="md" intensity={intensity} className="static -z-0" />
          </div>
          <span className="text-caption text-content-tertiary font-mono">
            {intensity} · {op}{intensity === "soft" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: every size × intensity.
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      {INTENSITIES.map(({ intensity, op }) => (
        <div key={intensity} className="space-y-2">
          <p className="text-caption text-content-tertiary font-mono">
            {intensity} · {op}
          </p>
          <div className="flex flex-wrap gap-4">
            {SIZES.map(({ size, px }) => (
              <div key={size} className="flex flex-col items-center gap-1.5">
                <div className="relative isolate flex h-48 w-48 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
                  <Blob size={size} intensity={intensity} className="static -z-0" />
                </div>
                <span className="text-caption text-content-tertiary font-mono">
                  {size} · {px}px
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
