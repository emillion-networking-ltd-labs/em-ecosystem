import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Pencil, Copy, Archive, Trash2 } from "lucide-react";
import Select from "@/components/ui/Select";

const options = [
  { label: "Spain", value: "es" },
  { label: "Mexico", value: "mx" },
  { label: "Argentina", value: "ar" },
  { label: "Colombia", value: "co" },
];

const optionsWithIcons = [
  { label: "Edit", value: "edit", icon: <Pencil size={16} /> },
  { label: "Duplicate", value: "dup", icon: <Copy size={16} /> },
  { label: "Archive", value: "arch", icon: <Archive size={16} /> },
  { label: "Delete", value: "del", icon: <Trash2 size={16} /> },
];

const meta = {
  title: "Primitives/Select",
  component: Select,
  tags: ["autodocs"],
  args: {
    options,
    placeholder: "Select a country",
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

// Options can carry an icon.
export const WithIcons: Story = {
  args: { options: optionsWithIcons, placeholder: "Choose an action…" },
  render: (args) => {
    const [value, setValue] = useState<string>();
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

// Sizes (largest → smallest), with px. The trigger height: md = h-12 (48), sm = h-10 (40, default).
const SIZES = [
  { size: "md", px: "48" },
  { size: "sm", px: "40" },
] as const;

export const Sizes: Story = {
  render: () => {
    const [value, setValue] = useState<string>("es");
    return (
      <div className="flex flex-col items-start gap-4">
        {SIZES.map(({ size, px }) => (
          <div key={size} className="flex items-center gap-3">
            <Select
              options={options}
              size={size}
              value={value}
              onChange={setValue}
              placeholder="Select a country"
            />
            <span className="text-caption text-content-tertiary font-mono">
              {size} · {px}px{size === "sm" ? " (default)" : ""}
            </span>
          </div>
        ))}
      </div>
    );
  },
};
