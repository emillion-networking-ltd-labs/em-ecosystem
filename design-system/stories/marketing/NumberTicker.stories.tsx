import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NumberTicker } from "@/components/ui/NumberTicker";
import Card from "@/components/ui/Card";

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

const NUM = "text-h1 font-black text-content-primary";

export const Default: Story = {
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <span className={NUM}>
        <NumberTicker {...args} />
      </span>
    </Card>
  ),
};

// Up — counts from 0 up to the value (default).
export const Up: Story = {
  render: () => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <span className={NUM}>
        <NumberTicker value={500} direction="up" />+
      </span>
    </Card>
  ),
};

// Down — counts from the value down to 0.
export const Down: Story = {
  render: () => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <span className={NUM}>
        <NumberTicker value={100} direction="down" />
      </span>
    </Card>
  ),
};

// Decimals — fractional target with fixed decimal places.
export const Decimals: Story = {
  render: () => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <span className={NUM}>
        <NumberTicker value={4.9} decimalPlaces={1} />
      </span>
    </Card>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, Up, Down, Decimals) — one project Card each, name above.
const VARIANTS = [
  { label: "Default", node: <NumberTicker value={100} /> },
  {
    label: "Up",
    node: (
      <>
        <NumberTicker value={500} direction="up" />+
      </>
    ),
  },
  { label: "Down", node: <NumberTicker value={100} direction="down" /> },
  { label: "Decimals", node: <NumberTicker value={4.9} decimalPlaces={1} /> },
];

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
          <Card className="flex min-h-[140px] items-center justify-center">
            <span className={NUM}>{v.node}</span>
          </Card>
        </div>
      ))}
    </div>
  ),
};
