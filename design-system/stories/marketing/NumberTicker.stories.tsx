import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NumberTicker } from "@/components/ui/NumberTicker";

// Marketing/NumberTicker — animated count-up/down to a target (marketing stats). Theme-aware via
// content-primary; animates on scroll into view.
const meta = {
  title: "Marketing/NumberTicker",
  component: NumberTicker,
  tags: ["autodocs"],
  args: { value: 100 },
  argTypes: {
    value: { control: "number" },
    direction: { control: "inline-radio", options: ["up", "down"] },
    decimalPlaces: { control: "number" },
  },
} satisfies Meta<typeof NumberTicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <span className="text-h1 font-black text-content-primary">
      <NumberTicker {...args} />
    </span>
  ),
};

// Up — counts from 0 up to the value (default).
export const Up: Story = {
  render: () => (
    <span className="text-h1 font-black text-content-primary">
      <NumberTicker value={500} direction="up" />+
    </span>
  ),
};

// Down — counts from the value down to 0.
export const Down: Story = {
  render: () => (
    <span className="text-h1 font-black text-content-primary">
      <NumberTicker value={100} direction="down" />
    </span>
  ),
};

// Decimals — fractional target with fixed decimal places.
export const Decimals: Story = {
  render: () => (
    <span className="text-h1 font-black text-content-primary">
      <NumberTicker value={4.9} decimalPlaces={1} />
    </span>
  ),
};

// AllVariants — ALWAYS last: a stats band, the real marketing use.
const STATS = [
  { value: 500, suffix: "+", label: "Clients" },
  { value: 12, suffix: "", label: "Years" },
  { value: 98, suffix: "%", label: "Satisfaction" },
  { value: 4.9, suffix: "", label: "Rating", decimals: 1 },
] as const;

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
      {STATS.map(({ value, suffix, label, decimals }) => (
        <div key={label} className="flex flex-col items-center gap-1">
          <span className="text-h1 font-black text-content-primary">
            <NumberTicker value={value} decimalPlaces={decimals ?? 0} />
            {suffix}
          </span>
          <span className="text-caption text-content-tertiary">{label}</span>
        </div>
      ))}
    </div>
  ),
};
