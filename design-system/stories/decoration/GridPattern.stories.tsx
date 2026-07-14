import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { GridPattern } from "@/components/ui/GridPattern";
import { DemoCard, Variants, Sizes } from "../_kit";

// Decoration/GridPattern — a tileable grid texture painted as an absolute background (currentColor), for an
// editorial backdrop behind hero/CTA content. Color comes from a text token (text-border-subtle by default,
// text-accent to theme it) — never a hex. (Los demos usan text-border-strong para que el patrón se vea a tamaño tile.)
const meta = {
  title: "Decoration/GridPattern",
  component: GridPattern,
  tags: ["autodocs"],
  args: { gap: 32, stroke: 1 },
} satisfies Meta<typeof GridPattern>;

export default meta;
type Story = StoryObj<typeof meta>;

// Cell gaps (densest → sparsest), in px. 32 is the default.
const GAPS = [16, 24, 32, 48] as const;
// Line strokes (thinnest → thickest), in px. 1 is the default.
const STROKES = [1, 1.5, 2, 3] as const;

// The bounded surface the absolute pattern lives on (the inner tile; DemoCard frames it as the project Card).
const Tile = ({
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

// Default — playground: an editorial grid texture; color inherits from a text token (currentColor).
export const Default: Story = {
  render: (args) => (
    <DemoCard block className="overflow-hidden">
      <Tile h="h-72">
        <GridPattern {...args} className="text-border-strong" />
        <h2 className="text-display-3 font-display">Editorial grid</h2>
      </Tile>
    </DemoCard>
  ),
};

// Strokes — line weight, thinnest → thickest (a secondary measure parameter of the line).
export const Strokes: Story = {
  render: () => (
    <Variants
      items={STROKES.map((stroke) => ({
        label: `stroke=${stroke}px${stroke === 1 ? " (default)" : ""}`,
        className: "overflow-hidden",
        block: true,
        node: (
          <Tile>
            <GridPattern
              gap={28}
              stroke={stroke}
              className="text-border-strong"
            />
          </Tile>
        ),
      }))}
    />
  ),
};

// Gaps — the cell gap is the grid's scale (the size measure), densest → sparsest; the real px live here.
export const Gaps: Story = {
  render: () => (
    <Sizes
      items={GAPS.map((gap) => ({
        label: `gap=${gap}px${gap === 32 ? " (default)" : ""}`,
        className: "overflow-hidden",
        block: true,
        node: (
          <Tile>
            <GridPattern gap={gap} className="text-border-strong" />
          </Tile>
        ),
      }))}
    />
  ),
};
