import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Slider from "@/components/ui/Slider";

const meta = {
  title: "Primitives/Slider",
  component: Slider,
  tags: ["autodocs"],
  args: {
    label: "Volumen",
    min: 0,
    max: 100,
    step: 1,
    showValue: true,
    onChange: () => {},
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(40);
    return <Slider {...args} value={value} onChange={setValue} />;
  },
};

// Slider no tiene sizes ni variants: sus opciones de presentación son
// label y showValue, y su único estado es disabled.
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
  args: { label: "Precio", min: 0, max: 500, step: 10 },
  render: (args) => {
    const [value, setValue] = useState(120);
    return <Slider {...args} value={value} onChange={setValue} />;
  },
};

export const Disabled: Story = {
  args: { disabled: true, label: "No editable" },
  render: (args) => {
    const [value, setValue] = useState(70);
    return <Slider {...args} value={value} onChange={setValue} />;
  },
};
