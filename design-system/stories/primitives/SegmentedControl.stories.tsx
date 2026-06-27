import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import SegmentedControl from "@/components/ui/SegmentedControl";

const opciones = [
  { value: "diario", label: "Diario" },
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" },
];

const meta = {
  title: "Primitives/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
  args: {
    options: opciones,
    value: "diario",
    variant: "primary",
    size: "sm",
    onChange: () => {},
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "outline"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState("diario");
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
  },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
  render: (args) => {
    const [value, setValue] = useState("semanal");
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
  },
};

export const Outline: Story = {
  args: { variant: "outline" },
  render: (args) => {
    const [value, setValue] = useState("mensual");
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
  },
};
