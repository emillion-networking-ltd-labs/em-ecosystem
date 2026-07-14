import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import DateInput from "@/components/ui/DateInput";
import { DemoCard, Sizes } from "../_kit";

const meta = {
  title: "Migration/DateInput",
  component: DateInput,
  tags: ["autodocs"],
  args: {
    label: "Date of birth",
    placeholder: "DD/MM/YYYY",
    size: "md",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
  // Stateful wrapper so the field is interactive; full-width card, the field centered at a form width.
  render: (args) => {
    const [value, setValue] = useState(args.value ?? "");
    return (
      <DemoCard>
        <div className="w-80">
          <DateInput {...args} value={value} onChange={setValue} />
        </div>
      </DemoCard>
    );
  },
} satisfies Meta<typeof DateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// A DateInput has no design-variant axis — its axes are size (AllSizes) and states (value / error /
// disabled, each its own story). So there is no AllVariants.

// Default — playground.
export const Default: Story = {};

export const WithValue: Story = { args: { value: "2026-06-27" } };

// On error the field outline AND the label turn red (general rule across inputs).
export const WithError: Story = { args: { error: "Pick a valid date" } };

export const Disabled: Story = {
  args: { value: "2026-06-27", label: "Not editable", disabled: true },
};

// The 2 sizes (largest to smallest), with px.
const SIZES = [
  { key: "md", px: "48" },
  { key: "sm", px: "40" },
] as const;

// AllSizes — the input sizes (sm/md), with px. Last (no AllVariants: no design-variant axis).
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ key, px }) => ({
        label: `${key} · ${px}px${key === "md" ? " (default)" : ""}`,
        node: (
          <div className="w-80">
            <DateInput
              size={key}
              label={`Size ${key}`}
              value="2026-06-27"
              onChange={() => {}}
            />
          </div>
        ),
      }))}
    />
  ),
};
