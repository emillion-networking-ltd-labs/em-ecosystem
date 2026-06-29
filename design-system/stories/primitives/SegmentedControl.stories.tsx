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

const sizes = ["sm", "md", "lg"] as const;

// AllSizes — the 3 control sizes (sm/md/lg), with px.
export const AllSizes: Story = {
  render: () => {
    const [value, setValue] = useState("diario");
    return (
      <div className="flex flex-col items-start gap-3">
        {sizes.map((size) => (
          <div key={size} className="flex items-center gap-3">
            <SegmentedControl
              options={opciones}
              size={size}
              value={value}
              onChange={setValue}
            />
            <span className="text-caption text-content-tertiary font-mono">
              {size === "sm"
                ? "sm · 32px"
                : size === "md"
                  ? "md · 40px"
                  : "lg · 48px"}
            </span>
          </div>
        ))}
      </div>
    );
  },
};

const variants = ["primary", "secondary", "outline"] as const;

// AllVariants — ALWAYS last: every visual variant of the control.
export const AllVariants: Story = {
  render: () => {
    const [value, setValue] = useState("diario");
    return (
      <div className="flex flex-wrap items-end gap-4">
        {variants.map((variant) => (
          <div key={variant} className="flex flex-col gap-1.5">
            <span className="text-caption text-content-tertiary font-mono">{variant}</span>
            <SegmentedControl
              options={opciones}
              variant={variant}
              value={value}
              onChange={setValue}
            />
          </div>
        ))}
      </div>
    );
  },
};
