import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MetricCard from "@/components/ui/MetricCard";
import { DemoCard, Variants } from "../_kit";

const meta = {
  title: "Migration/MetricCard",
  component: MetricCard,
  tags: ["autodocs"],
  args: {
    label: "Total Users",
    value: "12,480",
    trend: 12.5,
    colorVariant: "purple",
  },
  argTypes: {
    colorVariant: { control: "inline-radio", options: ["purple", "blue"] },
    trend: { control: "number" },
    loading: { control: "boolean" },
  },
  render: (args) => (
    <DemoCard>
      <div className="w-72">
        <MetricCard {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — playground: try the value, trend and colour from the controls.
export const Default: Story = {};

// PositiveTrend — an upward trend renders a green delta with an up arrow.
export const PositiveTrend: Story = {
  args: { value: "12,480", trend: 12.5, colorVariant: "purple" },
};

// NegativeTrend — a downward trend renders a red delta with a down arrow.
export const NegativeTrend: Story = {
  args: {
    label: "Churned Users",
    value: "312",
    trend: -4.2,
    colorVariant: "blue",
  },
};

// NoTrend — trend is optional; without it only the value shows (no delta).
export const NoTrend: Story = {
  args: { label: "Active Sessions", value: "1,024", trend: undefined },
};

// Loading — a skeleton placeholder stands in for the value while it resolves.
export const Loading: Story = {
  args: { loading: true },
};

// The two metric-tile colour variants.
const VARIANTS = ["purple", "blue"] as const;

// AllVariants — the colour variants side by side (last, per the story norm).
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANTS.map((v) => ({
        label: v,
        node: (
          <div className="w-72">
            <MetricCard
              label="Total Users"
              value="12,480"
              trend={8.3}
              colorVariant={v}
            />
          </div>
        ),
      }))}
    />
  ),
};
