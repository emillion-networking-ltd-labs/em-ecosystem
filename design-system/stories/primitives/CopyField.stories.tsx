import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CopyField from "@/components/ui/CopyField";
import { DemoCard, Sizes } from "../_kit";

const meta = {
  title: "Migration/CopyField",
  component: CopyField,
  tags: ["autodocs"],
  args: {
    // Corto → se ve completo → SIN tooltip (el tooltip sale solo cuando trunca, ver LongValue).
    value: "https://nexa.link/xY9kQ2",
    size: "md",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
  render: (args) => (
    <DemoCard>
      <div className="w-80">
        <CopyField {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof CopyField>;

export default meta;
type Story = StoryObj<typeof meta>;

// No design-variant axis — size (AllSizes) + a long-value case; the copied state is transient (resets
// after 2s), exercised via interaction. So there is no AllVariants.

// Default — playground.
export const Default: Story = {};

// Long value — truncates. (Hover tooltip with the full value is tracked in ECO-118.)
export const LongValue: Story = {
  args: {
    value: "sk-live-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3IifQ",
  },
};

// The 2 sizes (largest to smallest), with px.
const SIZES = [
  { key: "md", px: "48" },
  { key: "sm", px: "40" },
] as const;

// AllSizes — the field sizes (sm/md), with px. Last (no AllVariants: no design-variant axis).
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ key, px }) => ({
        label: `${key} · ${px}px${key === "md" ? " (default)" : ""}`,
        node: (
          <div className="w-80">
            <CopyField value="ABCD-2F4A-9C1B" size={key} />
          </div>
        ),
      }))}
    />
  ),
};
