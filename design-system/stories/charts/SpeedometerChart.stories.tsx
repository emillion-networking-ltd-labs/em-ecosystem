import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SpeedometerChart from "@/components/ui/SpeedometerChart";
import { DemoCard, Variants, Sizes } from "../_kit";

// Charts/SpeedometerChart — pure-SVG 270° gauge (no chart library), value shown as %. `value` is a
// continuous measure (Values story); `size` is a named scale (AllSizes, with the svg width). No discrete
// style axis → no AllVariants. Colours come from theme tokens (stroke/fill classes).
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

// A few values across the range, to read where the needle lands (continuous measure).
const VALUES = [12, 50, 78, 100] as const;
// Sizes (largest → smallest), with the svg width. lg is the default.
const SIZES = [
  { size: "lg", px: "260" },
  { size: "md", px: "230" },
  { size: "sm", px: "180" },
] as const;

// Default — playground: the gauge at lg, needle pointing to the value (shown as %).
export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <SpeedometerChart {...args} />
    </DemoCard>
  ),
};

// Values — the needle across the range (a continuous measure parameter), the value in the label.
export const Values: Story = {
  render: () => (
    <Variants
      items={VALUES.map((value) => ({
        label: `value=${value}%${value === 78 ? " (default)" : ""}`,
        node: <SpeedometerChart value={value} size="lg" />,
      }))}
    />
  ),
};

// AllSizes — the gauge sizes (named scale), label = size + svg width. Last (no AllVariants: the gauge
// has no discrete style axis).
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
