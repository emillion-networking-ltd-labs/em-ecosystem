import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import DateInput from "@/components/ui/DateInput";

const meta = {
  title: "Primitives/DateInput",
  component: DateInput,
  tags: ["autodocs"],
  args: {
    label: "Fecha de nacimiento",
    placeholder: "DD/MM/YYYY",
    size: "md",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof DateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState("");
    return <DateInput {...args} value={value} onChange={setValue} />;
  },
};

export const WithValue: Story = {
  render: (args) => {
    const [value, setValue] = useState("2026-06-27");
    return <DateInput {...args} value={value} onChange={setValue} />;
  },
};

export const WithError: Story = {
  args: { error: "Selecciona una fecha válida" },
  render: (args) => {
    const [value, setValue] = useState("");
    return <DateInput {...args} value={value} onChange={setValue} />;
  },
};
