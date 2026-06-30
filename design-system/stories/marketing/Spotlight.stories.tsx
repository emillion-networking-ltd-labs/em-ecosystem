import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spotlight } from "@/components/ui/Spotlight";
import Card from "@/components/ui/Card";

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
    <Card className="overflow-hidden">
      <Tile fill="white" label="In the spotlight" />
    </Card>
  ),
};

// Themed — drive the fill from the accent token instead of the default white.
export const Accent: Story = {
  render: () => (
    <Card className="overflow-hidden">
      <Tile fill="var(--color-accent)" label="On brand" />
    </Card>
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
    <div className="flex flex-col gap-6">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
          <Card className="overflow-hidden">
            <Tile fill={v.fill} label="Spotlight" height="h-56" />
          </Card>
        </div>
      ))}
    </div>
  ),
};
