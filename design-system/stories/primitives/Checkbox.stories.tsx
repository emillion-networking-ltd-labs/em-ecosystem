import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Checkbox from "@/components/ui/Checkbox";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: { label: "I accept the terms", size: "md" },
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
  args: { indeterminate: true, label: "Partial selection" },
  render: (args) => <Checkbox {...args} checked={false} />,
};

export const Disabled: Story = {
  args: { disabled: true, label: "Not editable" },
  render: (args) => <Checkbox {...args} checked={false} />,
};

export const DisabledChecked: Story = {
  args: { disabled: true, checked: true, label: "Not editable (checked)" },
  render: (args) => <Checkbox {...args} />,
};

// The 3 sizes (largest to smallest, like the rest), with px.
const SIZES = [
  { key: "lg", px: "24" },
  { key: "md", px: "20" },
  { key: "sm", px: "16" },
] as const;

// AllSizes — the 3 checkbox sizes (sm/md/lg), with px.
export const AllSizes: Story = {
  render: () => {
    const [values, setValues] = useState({ sm: true, md: true, lg: true });
    return (
      <div className="flex flex-wrap items-end gap-6">
        {SIZES.map(({ key, px }) => (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <Checkbox
              size={key}
              checked={values[key]}
              onChange={(v) => setValues((s) => ({ ...s, [key]: v }))}
            />
            <span className="text-caption text-content-tertiary font-mono">
              {key} · {px}px{key === "md" ? " (default)" : ""}
            </span>
          </div>
        ))}
      </div>
    );
  },
};

// AllVariants — ALWAYS last: a Checkbox has no color variants; its axes are its visual states.
export const AllVariants: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    const [unchecked, setUnchecked] = useState(false);
    return (
      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked={unchecked} onChange={setUnchecked} />
          <span className="text-caption text-content-tertiary font-mono">unchecked</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked={checked} onChange={setChecked} />
          <span className="text-caption text-content-tertiary font-mono">checked</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked={false} indeterminate />
          <span className="text-caption text-content-tertiary font-mono">indeterminate</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked={false} disabled />
          <span className="text-caption text-content-tertiary font-mono">disabled</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked disabled />
          <span className="text-caption text-content-tertiary font-mono">disabled (checked)</span>
        </div>
      </div>
    );
  },
};
