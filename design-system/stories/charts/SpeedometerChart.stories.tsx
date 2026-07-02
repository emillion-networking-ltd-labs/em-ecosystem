import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SpeedometerChart from "@/components/ui/SpeedometerChart";
import { DemoCard, Sizes } from "../_kit";

// Charts/SpeedometerChart — pure-SVG 270° gauge, value shown as %. `value` is adjustable from Controls (a
// range), so it needs no story of its own; `size` is a named scale → AllSizes (with the svg width). No
// discrete style axis → no AllVariants. Colours come from theme tokens (stroke/fill classes).
const meta = {
  title: "Charts/SpeedometerChart",
  component: SpeedometerChart,
  tags: ["autodocs"],
  args: { value: 78, size: "lg" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof SpeedometerChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sizes (largest → smallest), with the svg width. lg is the default.
const SIZES = [
  { size: "lg", px: "260" },
  { size: "md", px: "230" },
  { size: "sm", px: "180" },
] as const;

// Default — playground: the gauge; move the needle with the Controls (value range).
export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <SpeedometerChart {...args} />
    </DemoCard>
  ),
};

// AllSizes — the gauge sizes (named scale), label = size + svg width. Last (no AllVariants: no discrete style axis).
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ size, px }) => ({
        label: `${size} · ${px}px${size === "lg" ? " (default)" : ""}`,
        node: <SpeedometerChart size={size} value={72} />,
      }))}
    />
  ),
};
