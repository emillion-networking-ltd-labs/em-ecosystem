import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spotlight } from "@/components/ui/Spotlight";
import { DemoCard } from "../_kit";

// Aceternity UI (MIT), adopted verbatim in ECO-88. Decorative SVG spotlight; needs a bounded, relative parent.
// A single Default (fill=content-inverse, a neutral light). The accent-driven "themed" variant is dropped — accent is a placeholder
// brand colour, not real; theming happens per satellite, not as a showcased variant. So no AllVariants.
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
      <Tile fill="var(--color-content-inverse)" label="In the spotlight" />
    </DemoCard>
  ),
};
