import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import DoughnutChart from "@/components/ui/DoughnutChart";
import { DemoCard } from "../_kit";

// Charts/DoughnutChart — recharts donut with a legend (count + share per slice). Renders in the CURRENT
// theme (Storybook toolbar). Slice colours come from the chart's palette (→ brand tokens in ECO-113).
const meta = {
  title: "Charts/DoughnutChart",
  component: DoughnutChart,
  tags: ["autodocs"],
  args: { title: "Users by Role" },
} satisfies Meta<typeof DoughnutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — the donut with its legend (slice count + share); follows the theme toolbar.
export const Default: Story = {
  render: (args) => (
    <DemoCard className="max-w-md">
      <DoughnutChart {...args} />
    </DemoCard>
  ),
};
