import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Checkbox from "@/components/ui/Checkbox";
import { DemoCard, Sizes } from "../_kit";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: { label: "I accept the terms", size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  // Stateful wrapper so the checkbox is interactive; `checked` arg seeds the initial state.
  render: (args) => {
    const [on, setOn] = useState(args.checked ?? false);
    return (
      <DemoCard>
        <Checkbox {...args} checked={on} onChange={setOn} />
      </DemoCard>
    );
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// A Checkbox has no design-variant axis — its axes are size (AllSizes) and visual states (each its own
// story). So there is no AllVariants.

// Default — playground (unchecked).
export const Default: Story = {};

export const Checked: Story = { args: { checked: true } };

export const Indeterminate: Story = {
  args: { indeterminate: true, checked: false, label: "Partial selection" },
};

export const Disabled: Story = { args: { disabled: true, checked: false, label: "Not editable" } };

export const DisabledChecked: Story = {
  args: { disabled: true, checked: true, label: "Not editable (checked)" },
};

// The 3 sizes (largest to smallest, like the rest), with px.
const SIZES = [
  { key: "lg", px: "24" },
  { key: "md", px: "20" },
  { key: "sm", px: "16" },
] as const;

// AllSizes — the 3 checkbox sizes (sm/md/lg), with px. Last (no AllVariants: no design-variant axis).
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ key, px }) => ({
        label: `${key} · ${px}px${key === "md" ? " (default)" : ""}`,
        node: <Checkbox size={key} checked onChange={() => {}} />,
      }))}
    />
  ),
};
