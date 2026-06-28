import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Slider from "@/components/ui/Slider";

const meta = {
  title: "Primitives/Slider",
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
  // Constrain so it doesn't stretch full-bleed.
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(40);
    return <Slider {...args} value={value} onChange={setValue} />;
  },
};

// Slider has no sizes or variants: its presentation options are label and showValue,
// and its only state is disabled.
export const WithoutValue: Story = {
  args: { showValue: false },
  render: (args) => {
    const [value, setValue] = useState(60);
    return <Slider {...args} value={value} onChange={setValue} />;
  },
};

export const WithoutLabel: Story = {
  args: { label: undefined, showValue: false },
  render: (args) => {
    const [value, setValue] = useState(25);
    return <Slider {...args} value={value} onChange={setValue} />;
  },
};

export const CustomRange: Story = {
  args: { label: "Price", min: 0, max: 500, step: 10 },
  render: (args) => {
    const [value, setValue] = useState(120);
    return <Slider {...args} value={value} onChange={setValue} />;
  },
};

export const Disabled: Story = {
  args: { disabled: true, label: "Disabled" },
  render: (args) => {
    const [value, setValue] = useState(70);
    return <Slider {...args} value={value} onChange={setValue} />;
  },
};
