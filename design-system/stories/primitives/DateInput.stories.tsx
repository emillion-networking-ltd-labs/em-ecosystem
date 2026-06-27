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

export const Disabled: Story = {
  args: { label: "No editable", disabled: true },
  render: (args) => {
    const [value, setValue] = useState("2026-06-27");
    return <DateInput {...args} value={value} onChange={setValue} />;
  },
};

const sizes = ["sm", "md"] as const;

export const AllSizes: Story = {
  render: () => {
    const [value, setValue] = useState("2026-06-27");
    return (
      <div className="flex flex-col gap-4">
        {sizes.map((size) => (
          <div key={size} className="flex flex-col gap-1.5">
            <DateInput
              size={size}
              label={`Tamaño ${size}`}
              value={value}
              onChange={setValue}
            />
            <span className="text-caption text-content-tertiary">
              {size === "sm" ? "sm · 40px" : "md · 48px (por defecto)"}
            </span>
          </div>
        ))}
      </div>
    );
  },
};
