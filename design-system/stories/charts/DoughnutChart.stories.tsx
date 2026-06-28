import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import DoughnutChart from "@/components/ui/DoughnutChart";

const meta = {
  title: "Charts/DoughnutChart",
  component: DoughnutChart,
  tags: ["autodocs"],
  args: { title: "Users by Role" },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DoughnutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
