import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ChartCard from "@/components/ui/ChartCard";
import { DemoCard } from "../_kit";

// Primitives/ChartCard — a panel with a TITLE + an optional action slot, for wrapping charts, data panels and
// dashboard widgets. Uses surface/border/content tokens, so it follows the theme (Storybook toolbar).
const meta = {
  title: "Primitives/ChartCard",
  component: ChartCard,
  tags: ["autodocs"],
  args: { title: "Total Users" },
} satisfies Meta<typeof ChartCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const Body = () => (
  <div className="flex h-40 items-center justify-center text-body text-content-tertiary">
    (panel content)
  </div>
);

// Default — a titled panel wrapping arbitrary content.
export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <div className="w-full max-w-md">
        <ChartCard {...args}>
          <Body />
        </ChartCard>
      </div>
    </DemoCard>
  ),
};

// WithAction — the header carries an action slot (a legend, a filter, a menu…).
export const WithAction: Story = {
  render: (args) => (
    <DemoCard>
      <div className="w-full max-w-md">
        <ChartCard
          {...args}
          action={
            <span className="text-caption text-content-tertiary">Last 7 days</span>
          }
        >
          <Body />
        </ChartCard>
      </div>
    </DemoCard>
  ),
};
