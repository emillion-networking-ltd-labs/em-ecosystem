import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Toggle from "@/components/ui/Toggle";
import { DemoCard, Sizes } from "../_kit";

const meta = {
  title: "Migration/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  args: { label: "Notifications", size: "md", checked: true },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  // Stateful wrapper so the toggle is interactive; `checked` arg seeds the initial state.
  render: (args) => {
    const [on, setOn] = useState(args.checked ?? false);
    return (
      <DemoCard>
        <Toggle {...args} checked={on} onChange={setOn} />
      </DemoCard>
    );
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// A Toggle has no design-variant axis — its axes are size (AllSizes) and on/off + disabled states (each its
// own story). So there is no AllVariants.

// Default — playground (on).
export const Default: Story = {};

export const Off: Story = { args: { checked: false } };

export const Disabled: Story = {
  args: { disabled: true, checked: false, label: "Disabled" },
};

export const DisabledOn: Story = {
  args: { disabled: true, checked: true, label: "Disabled (on)" },
};

// Sizes (largest → smallest), with px (track width). md is the default.
const SIZES = [
  { key: "lg", px: "48" },
  { key: "md", px: "40" },
  { key: "sm", px: "32" },
] as const;

// AllSizes — the 3 toggle sizes (sm/md/lg), with px. Last (no AllVariants: no design-variant axis).
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ key, px }) => ({
        label: `${key} · ${px}px${key === "md" ? " (default)" : ""}`,
        node: <Toggle size={key} checked onChange={() => {}} />,
      }))}
    />
  ),
};
