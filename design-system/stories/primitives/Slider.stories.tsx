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

function SliderDemo({
  initial = 40,
  label,
  min,
  max,
  step,
  showValue,
  disabled,
}: {
  initial?: number;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Slider
      value={value}
      onChange={setValue}
      label={label}
      min={min}
      max={max}
      step={step}
      showValue={showValue}
      disabled={disabled}
    />
  );
}

// AllVariants — ALWAYS last: the presentation options (label, value) and the disabled state.
export const AllVariants: Story = {
  render: () => (
    <div className="flex max-w-xs flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">label + value</p>
        <SliderDemo label="Volume" initial={40} />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">without value</p>
        <SliderDemo label="Volume" showValue={false} initial={60} />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">without label</p>
        <SliderDemo showValue={false} initial={25} />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">custom range (0–500)</p>
        <SliderDemo label="Price" min={0} max={500} step={10} initial={120} />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">disabled</p>
        <SliderDemo label="Disabled" disabled initial={70} />
      </div>
    </div>
  ),
};
