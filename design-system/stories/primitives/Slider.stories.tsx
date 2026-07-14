import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Slider from "@/components/ui/Slider";
import { DemoCard } from "../_kit";

const meta = {
  title: "Migration/Slider",
  component: Slider,
  tags: ["autodocs"],
  args: {
    label: "Volume",
    min: 0,
    max: 100,
    step: 1,
    showValue: true,
    onChange: () => {},
  },
  // Stateful wrapper so the slider is interactive; full-width card, the field centered at a form width.
  render: (args) => {
    const [value, setValue] = useState(args.value ?? 40);
    return (
      <DemoCard>
        <div className="w-80">
          <Slider {...args} value={value} onChange={setValue} />
        </div>
      </DemoCard>
    );
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

// A Slider has no size or design-variant axis — its options are label / showValue / range, and its only
// state is disabled. Each is its own story; there is no AllVariants.

// Default — playground (label + value).
export const Default: Story = {};

export const WithoutValue: Story = { args: { value: 60, showValue: false } };

export const WithoutLabel: Story = {
  args: { value: 25, label: undefined, showValue: false },
};

export const CustomRange: Story = {
  args: { value: 120, label: "Price", min: 0, max: 500, step: 10 },
};

export const Disabled: Story = {
  args: { value: 70, disabled: true, label: "Disabled" },
};
