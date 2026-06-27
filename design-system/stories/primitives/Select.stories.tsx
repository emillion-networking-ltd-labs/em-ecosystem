import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Select from "@/components/ui/Select";

const opciones = [
  { label: "España", value: "es" },
  { label: "México", value: "mx" },
  { label: "Argentina", value: "ar" },
  { label: "Colombia", value: "co" },
];

const meta = {
  title: "Primitives/Select",
  component: Select,
  tags: ["autodocs"],
  args: {
    options: opciones,
    placeholder: "Selecciona un país",
    size: "sm",
    onChange: () => {},
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string>();
    return <Select {...args} value={value} onChange={setValue} />;
  },
};

export const WithValue: Story = {
  render: (args) => {
    const [value, setValue] = useState<string>("mx");
    return <Select {...args} value={value} onChange={setValue} />;
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => {
    const [value, setValue] = useState<string>();
    return <Select {...args} value={value} onChange={setValue} />;
  },
};
