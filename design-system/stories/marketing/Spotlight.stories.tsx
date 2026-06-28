import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spotlight } from "@/components/ui/Spotlight";

// Aceternity UI (MIT), adopted verbatim in ECO-88. Decorative SVG spotlight; needs a bounded, relative parent.
// `fill` defaults to "white" inside the component — respected in the Default demo.
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
      <span className="relative z-10 text-display-3 font-display text-content-inverse">In the spotlight</span>
    </div>
  ),
};

// Themed — drive the fill from the accent token instead of the default white.
export const Accent: Story = {
  render: (args) => (
    <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-inverse">
      <Spotlight {...args} className="-top-40 left-0 md:-top-20 md:left-60" fill="var(--color-accent)" />
      <span className="relative z-10 text-display-3 font-display text-content-inverse">On brand</span>
    </div>
  ),
};

// AllVariants — ALWAYS last: the real `fill` prop (white default vs. accent token).
const VARIANTS = [
  { fill: "white", label: 'fill "white" (default)' },
  { fill: "var(--color-accent)", label: "fill var(--color-accent)" },
] as const;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-inverse">
            <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill={v.fill} />
            <span className="relative z-10 text-display-3 font-display text-content-inverse">Spotlight</span>
          </div>
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
        </div>
      ))}
    </div>
  ),
};
