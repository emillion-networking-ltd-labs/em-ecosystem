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

const Cell = ({ n }: { n: number }) => (
  <div className="rounded-lg border border-border-default bg-surface-secondary p-6 text-content-secondary">
    Celda {n}
  </div>
);

export const Default: Story = {
  render: (args) => (
    <Grid {...args}>
      {Array.from({ length: 6 }, (_, i) => (
        <Cell key={i} n={i + 1} />
      ))}
    </Grid>
  ),
};
