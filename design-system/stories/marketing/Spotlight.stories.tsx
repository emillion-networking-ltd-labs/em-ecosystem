import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spotlight } from "@/components/ui/Spotlight";
import { DemoCard, Variants } from "../_kit";

// Aceternity UI (MIT), adopted verbatim in ECO-88. Decorative SVG spotlight; needs a bounded, relative parent.
// `fill` defaults to "white" inside the component — respected in the Default demo.
const meta = {
  title: "Marketing/Spotlight",
  component: Spotlight,
  tags: ["autodocs"],
} satisfies Meta<typeof Spotlight>;

export default meta;
type Story = StoryObj<typeof meta>;

// The spotlight needs a dark, bounded tile to read — hosted inside the project Card.
const Tile = ({ fill, label, height = "h-72" }: { fill: string; label: string; height?: string }) => (
  <div
    className={`relative flex ${height} w-full items-center justify-center overflow-hidden rounded-xl bg-surface-inverse`}
  >
    <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill={fill} />
    <span className="relative z-10 text-display-3 font-display text-content-inverse">{label}</span>
  </div>
);

export const Default: Story = {
  render: () => (
    <DemoCard block className="overflow-hidden">
      <Tile fill="white" label="In the spotlight" />
    </DemoCard>
  ),
};

// Themed — drive the fill from the accent token instead of the default white.
export const Accent: Story = {
  render: () => (
    <DemoCard block className="overflow-hidden">
      <Tile fill="var(--color-accent)" label="On brand" />
    </DemoCard>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, Accent) — one project Card each, name above.
// The effect is hosted as a dark tile inside the card.
const VARIANTS = [
  { label: "Default", fill: "white" },
  { label: "Accent", fill: "var(--color-accent)" },
] as const;

export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANTS.map((v) => ({
        label: v.label,
        className: "overflow-hidden",
        block: true,
        node: <Tile fill={v.fill} label="Spotlight" height="h-56" />,
      }))}
    />
  ),
};
