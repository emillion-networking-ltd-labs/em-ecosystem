import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Pencil, Copy, Archive, Trash2 } from "lucide-react";
import Select from "@/components/ui/Select";
import { DemoCard, Sizes } from "../_kit";

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
  // Stateful wrapper so the select is interactive; `value` arg seeds the initial selection.
  render: (args) => {
    const [value, setValue] = useState<string | undefined>(args.value);
    return (
      <DemoCard>
        <div className="w-80">
          <Select {...args} value={value} onChange={setValue} />
        </div>
      </DemoCard>
    );
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// A Select has no design-variant axis — its axes are size (AllSizes) and states (value / icons / disabled,
// each its own story). So there is no AllVariants.

// Default — playground (no selection).
export const Default: Story = {};

export const WithValue: Story = { args: { value: "mx" } };

// Options can carry an icon.
export const WithIcons: Story = {
  args: { options: optionsWithIcons, placeholder: "Choose an action…" },
};

export const Disabled: Story = { args: { disabled: true } };

// Sizes (largest → smallest), with px. The trigger height: md = h-12 (48), sm = h-10 (40, default).
const SIZES = [
  { size: "md", px: "48" },
  { size: "sm", px: "40" },
] as const;

// AllSizes — the select sizes (sm/md), with px. Last (no AllVariants: no design-variant axis).
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ size, px }) => ({
        label: `${size} · ${px}px${size === "sm" ? " (default)" : ""}`,
        node: (
          <div className="w-80">
            <Select options={options} size={size} value="es" onChange={() => {}} />
          </div>
        ),
      }))}
    />
  ),
};
