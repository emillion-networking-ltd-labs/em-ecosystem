import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TotalUsersChart from "@/components/ui/TotalUsersChart";

const meta = {
  title: "Charts/TotalUsersChart",
  component: TotalUsersChart,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[480px] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TotalUsersChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// Follows the Storybook theme toolbar (useTheme is wired to it) — switch the toolbar to see dark.
export const Default: Story = {};
