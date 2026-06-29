import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SpeedometerChart from "@/components/ui/SpeedometerChart";

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

export const Default: Story = {};

// AllSizes — the gauge sizes (sm/md/lg), with px (svg width).
const SIZES = [
  { size: "lg", px: "260" },
  { size: "md", px: "230" },
  { size: "sm", px: "180" },
] as const;

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      {SIZES.map(({ size, px }) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <SpeedometerChart size={size} value={72} />
          <span className="text-caption text-content-tertiary font-mono">
            {size} · {px}px{size === "lg" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: the value gauge (270° SVG speedometer, value shown as %).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <span className="text-caption text-content-tertiary font-mono">speedometer · value gauge</span>
      <SpeedometerChart value={78} size="lg" />
    </div>
  ),
};
