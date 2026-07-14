import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { Blob } from "@/components/ui/Blob";
import { DemoCard, Variants, Sizes } from "../_kit";

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

// Intensity variants, each grouping an existing story (label = that story's name). No measures here.
const INTENSITIES = [
  { label: "Default", intensity: "soft" },
  { label: "Subtle", intensity: "subtle" },
  { label: "Bold", intensity: "bold" },
] as const;

// The bounded surface the absolute halo lives on (the inner tile; DemoCard frames it as the project Card).
const Surface = ({
  h = "h-56",
  children,
}: {
  h?: string;
  children: ReactNode;
}) => (
  <div
    className={`relative isolate flex ${h} w-full items-center justify-center overflow-hidden rounded-xl bg-surface-primary`}
  >
    {children}
  </div>
);

// Default — playground: a soft brand halo anchored at two corners.
export const Default: Story = {
  render: (args) => (
    <DemoCard block className="overflow-hidden">
      <Surface h="h-72">
        <Blob {...args} className="-left-16 -top-16" />
        <Blob {...args} className="-bottom-16 -right-16" />
        <h2 className="text-display-3 font-display">Depth halo</h2>
      </Surface>
    </DemoCard>
  ),
};

// Subtle — the faintest intensity (20% opacity), for a barely-there atmosphere.
export const Subtle: Story = {
  render: () => (
    <DemoCard block className="overflow-hidden">
      <Surface>
        <Blob size="lg" intensity="subtle" className="static -z-0" />
      </Surface>
    </DemoCard>
  ),
};

// Bold — the strongest intensity (50% opacity), for a pronounced brand halo.
export const Bold: Story = {
  render: () => (
    <DemoCard block className="overflow-hidden">
      <Surface>
        <Blob size="lg" intensity="bold" className="static -z-0" />
      </Surface>
    </DemoCard>
  ),
};

// AllSizes — one halo per diameter (size axis); the measurements (px) live here. Penúltima.
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ size, px }) => ({
        label: `${size} · ${px}px${size === "lg" ? " (default)" : ""}`,
        className: "overflow-hidden",
        block: true,
        node: (
          <Surface>
            <Blob size={size} intensity="soft" className="static -z-0" />
          </Surface>
        ),
      }))}
    />
  ),
};

// AllVariants — ALWAYS last: the intensity variants (style axis), labels = the existing stories'
// names (Default / Subtle / Bold). Sizes/measurements live in AllSizes, not here.
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={INTENSITIES.map(({ label, intensity }) => ({
        label,
        className: "overflow-hidden",
        block: true,
        node: (
          <Surface>
            <Blob size="lg" intensity={intensity} className="static -z-0" />
          </Surface>
        ),
      }))}
    />
  ),
};
