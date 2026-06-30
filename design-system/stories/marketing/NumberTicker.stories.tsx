import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { DemoCard, Variants } from "../_kit";

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
    <DemoCard>
      <span className={NUM}>
        <NumberTicker {...args} />
      </span>
    </DemoCard>
  ),
};

// Up — counts from 0 up to the value (default).
export const Up: Story = {
  render: () => (
    <DemoCard>
      <span className={NUM}>
        <NumberTicker value={500} direction="up" />+
      </span>
    </DemoCard>
  ),
};

// Down — counts from the value down to 0.
export const Down: Story = {
  render: () => (
    <DemoCard>
      <span className={NUM}>
        <NumberTicker value={100} direction="down" />
      </span>
    </DemoCard>
  ),
};

// Decimals — fractional target with fixed decimal places.
export const Decimals: Story = {
  render: () => (
    <DemoCard>
      <span className={NUM}>
        <NumberTicker value={4.9} decimalPlaces={1} />
      </span>
    </DemoCard>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, Up, Down, Decimals) — one project Card each, name above.
const VARIANTS = [
  { label: "Default", node: <span className={NUM}><NumberTicker value={100} /></span> },
  {
    label: "Up",
    node: (
      <span className={NUM}>
        <NumberTicker value={500} direction="up" />+
      </span>
    ),
  },
  { label: "Down", node: <span className={NUM}><NumberTicker value={100} direction="down" /></span> },
  { label: "Decimals", node: <span className={NUM}><NumberTicker value={4.9} decimalPlaces={1} /></span> },
];

export const AllVariants: Story = {
  render: () => <Variants items={VARIANTS} />,
};
