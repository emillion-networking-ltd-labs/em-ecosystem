import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Grid } from "@/components/ui/Grid";
import Card from "@/components/ui/Card";

const meta = {
  title: "Layout/Grid",
  component: Grid,
  tags: ["autodocs"],
  args: { cols: 3, gap: "md" },
  argTypes: {
    cols: { control: "inline-radio", options: [1, 2, 3, 4] },
    gap: { control: "inline-radio", options: ["none", "xs", "sm", "md", "lg", "xl", "2xl"] },
    align: { control: "inline-radio", options: ["start", "center", "end", "stretch"] },
    justify: { control: "inline-radio", options: ["start", "center", "end", "stretch"] },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

// Columns (most → fewest). 3 is the default. Always collapses to 1 on mobile.
const COLS = [4, 3, 2, 1] as const;

// Real registered element as the cell (a Card — the usual thing a grid holds: pricing/service cards).
const Cell = ({ n }: { n: number }) => (
  <Card className="text-center text-content-secondary">Cell {n}</Card>
);

const cells = (count: number) =>
  Array.from({ length: count }, (_, i) => <Cell key={i} n={i + 1} />);

// Playground — responsive grid with governed columns and gap.
export const Default: Story = {
  render: (args) => <Grid {...args}>{cells(6)}</Grid>,
};

// Columns — the number shorthand: mobile-first curve (1 → 2 at sm → N at lg). 4 → 1.
export const Columns: Story = {
  render: () => (
    <div className="space-y-8">
      {COLS.map((c) => (
        <div key={c} className="space-y-1.5">
          <span className="text-caption text-content-secondary font-mono">
            cols={c}
            {c === 3 ? " (default)" : ""}
          </span>
          <Grid cols={c}>{cells(c)}</Grid>
        </div>
      ))}
    </div>
  ),
};

// Responsive — cols as a per-breakpoint object, for curves the number shorthand can't express (e.g. 1 → 3).
export const Responsive: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <span className="text-caption text-content-secondary font-mono">cols={"{{ base: 1, md: 3 }}"} — 1 → 3 at md</span>
        <Grid cols={{ base: 1, md: 3 }}>{cells(3)}</Grid>
      </div>
      <div className="space-y-1.5">
        <span className="text-caption text-content-secondary font-mono">cols={"{{ base: 1, sm: 2, lg: 4 }}"}</span>
        <Grid cols={{ base: 1, sm: 2, lg: 4 }}>{cells(4)}</Grid>
      </div>
    </div>
  ),
};

// AutoFit — content-driven columns (no breakpoints): as many cells as fit at minItemWidth, then wrap.
export const AutoFit: Story = {
  render: () => (
    <div className="space-y-1.5">
      <span className="text-caption text-content-secondary font-mono">minItemWidth=&quot;14rem&quot;</span>
      <Grid minItemWidth="14rem">{cells(6)}</Grid>
    </div>
  ),
};
