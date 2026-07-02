import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { DotPattern } from "@/components/ui/DotPattern";
import { DemoCard, Variants, Sizes } from "../_kit";

// Decoration/DotPattern — a tileable dot texture painted as an absolute background (currentColor), for an
// editorial backdrop behind hero/CTA content. Color comes from a text token (text-border-subtle by default,
// text-accent to theme it) — never a hex.
const meta = {
  title: "Decoration/DotPattern",
  component: DotPattern,
  tags: ["autodocs"],
  args: { gap: 16, radius: 1 },
} satisfies Meta<typeof DotPattern>;

export default meta;
type Story = StoryObj<typeof meta>;

// Cell gaps (densest → sparsest), in px. 16 is the default.
const GAPS = [12, 16, 24, 32] as const;
// Dot radii (smallest → largest), in px. 1 is the default.
const RADII = [1, 1.5, 2, 3] as const;

// The bounded surface the absolute pattern lives on (the inner tile; DemoCard frames it as the project Card).
const Tile = ({ h = "h-56", children }: { h?: string; children: ReactNode }) => (
  <div
    className={`relative isolate flex ${h} w-full items-center justify-center overflow-hidden rounded-xl bg-surface-primary`}
  >
    {children}
  </div>
);

// Default — playground: a dot texture; color inherits from a text token (currentColor).
export const Default: Story = {
  render: (args) => (
    <DemoCard block className="overflow-hidden">
      <Tile h="h-72">
        <DotPattern {...args} className="text-content-tertiary" />
        <h2 className="text-display-3 font-display">Dot texture</h2>
      </Tile>
    </DemoCard>
  ),
};

// Radii — dot size, smallest → largest (a secondary measure parameter of the dot itself).
export const Radii: Story = {
  render: () => (
    <Variants
      items={RADII.map((radius) => ({
        label: `radius=${radius}px${radius === 1 ? " (default)" : ""}`,
        className: "overflow-hidden",
        block: true,
        node: (
          <Tile>
            <DotPattern gap={20} radius={radius} className="text-content-tertiary" />
          </Tile>
        ),
      }))}
    />
  ),
};

// Gaps — the cell gap is the pattern's scale (the size measure), densest → sparsest; the real px live here.
export const Gaps: Story = {
  render: () => (
    <Sizes
      items={GAPS.map((gap) => ({
        label: `gap=${gap}px${gap === 16 ? " (default)" : ""}`,
        className: "overflow-hidden",
        block: true,
        node: (
          <Tile>
            <DotPattern gap={gap} className="text-content-tertiary" />
          </Tile>
        ),
      }))}
    />
  ),
};
