import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Checkbox from "@/components/ui/Checkbox";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: { label: "Acepto los términos", size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [on, setOn] = useState(false);
    return <Checkbox {...args} checked={on} onChange={setOn} />;
  },
};

export const Checked: Story = {
  render: (args) => {
    const [on, setOn] = useState(true);
    return <Checkbox {...args} checked={on} onChange={setOn} />;
  },
};

export const Indeterminate: Story = {
  args: { indeterminate: true, label: "Selección parcial" },
  render: (args) => <Checkbox {...args} checked={false} />,
};

export const Disabled: Story = {
  args: { disabled: true, label: "No editable" },
  render: (args) => <Checkbox {...args} checked={false} />,
};

export const DisabledChecked: Story = {
  args: { disabled: true, checked: true, label: "No editable (marcado)" },
  render: (args) => <Checkbox {...args} />,
};

const sizes = ["sm", "md", "lg"] as const;

export const AllSizes: Story = {
  render: () => {
    const [values, setValues] = useState({ sm: true, md: true, lg: true });
    return (
      <div className="flex flex-wrap items-end gap-6">
        {sizes.map((size) => (
          <div key={size} className="flex flex-col items-center gap-1.5">
            <Checkbox
              size={size}
              checked={values[size]}
              onChange={(v) => setValues((s) => ({ ...s, [size]: v }))}
            />
            <span className="text-caption text-content-tertiary">
              {size === "sm"
                ? "sm · 16px"
                : size === "md"
                  ? "md · 20px (por defecto)"
                  : "lg · 24px"}
            </span>
          </div>
        ))}
      </div>
    );
  },
};

// Checkbox no tiene variants: sus estados visuales son
// checked, unchecked, indeterminate y disabled.
export const AllStates: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    const [unchecked, setUnchecked] = useState(false);
    return (
      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked={unchecked} onChange={setUnchecked} />
          <span className="text-caption text-content-tertiary">Sin marcar</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked={checked} onChange={setChecked} />
          <span className="text-caption text-content-tertiary">Marcado</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked={false} indeterminate />
          <span className="text-caption text-content-tertiary">Indeterminado</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked={false} disabled />
          <span className="text-caption text-content-tertiary">
            Deshabilitado
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked disabled />
          <span className="text-caption text-content-tertiary">
            Deshabilitado (marcado)
          </span>
        </div>
      </div>
    );
  },
};
