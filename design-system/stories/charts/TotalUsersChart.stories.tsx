import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TotalUsersChart from "@/components/ui/TotalUsersChart";
import { DemoCard } from "../_kit";

// Charts/TotalUsersChart — recharts line chart (this year vs last year) in its own panel. Full-width card
// with the chart centered at a sensible width (max-w-2xl) so it doesn't stretch. Renders in the CURRENT
// theme (Storybook toolbar). Line colours come from the chart's palette (→ brand tokens in ECO-113).
const meta = {
  title: "Charts/TotalUsersChart",
  component: TotalUsersChart,
  tags: ["autodocs"],
} satisfies Meta<typeof TotalUsersChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — the year-over-year line chart; follows the theme toolbar.
export const Default: Story = {
  render: () => (
    <DemoCard>
      <div className="w-full max-w-2xl">
        <TotalUsersChart />
      </div>
    </DemoCard>
  ),
};
