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

// AllVariants — ALWAYS last: the total-users area chart (follows the theme toolbar).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <span className="text-caption text-content-tertiary font-mono">total users · area chart</span>
      <TotalUsersChart />
    </div>
  ),
};
