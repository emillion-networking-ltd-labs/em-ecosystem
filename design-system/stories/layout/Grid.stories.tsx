import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Grid } from "@/components/ui/Grid";

const meta = {
  title: "Layout/Grid",
  component: Grid,
  tags: ["autodocs"],
  args: { cols: 3, gap: "md" },
  argTypes: {
    cols: { control: "inline-radio", options: [1, 2, 3, 4] },
    gap: { control: "inline-radio", options: ["sm", "md", "lg", "xl"] },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

// Columns (most → fewest). 3 is the default. Always collapses to 1 on mobile.
const COLS = [4, 3, 2, 1] as const;

const Cell = ({ n }: { n: number }) => (
  <div className="rounded-lg border border-border-default bg-surface-secondary p-6 text-center text-content-secondary">
    Cell {n}
  </div>
);

const cells = (count: number) =>
  Array.from({ length: count }, (_, i) => <Cell key={i} n={i + 1} />);

// Playground — responsive grid with governed columns and gap.
export const Default: Story = {
  render: (args) => <Grid {...args}>{cells(6)}</Grid>,
};

// Columns — 4 → 1, each with enough cells to fill a row at the top breakpoint.
export const Columns: Story = {
  render: () => (
    <div className="space-y-8">
      {COLS.map((c) => (
        <div key={c} className="space-y-1.5">
          <span className="text-caption text-content-tertiary font-mono">
            cols={c}
            {c === 3 ? " (default)" : ""}
          </span>
          <Grid cols={c}>{cells(c)}</Grid>
        </div>
      ))}
    </div>
  ),
};
