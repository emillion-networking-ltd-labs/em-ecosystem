import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { DemoCard, Variants, Sizes } from "../_kit";

const OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const meta = {
  title: "Primitives/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
  args: {
    options: OPTIONS,
    value: "daily",
    variant: "primary",
    size: "sm",
    onChange: () => {},
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "outline"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  // Stateful wrapper so the control is interactive; `value` arg seeds the selection.
  render: (args) => {
    const [value, setValue] = useState(args.value ?? "daily");
    return (
      <DemoCard>
        <SegmentedControl {...args} value={value} onChange={setValue} />
      </DemoCard>
    );
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

// ── VARIANTS (the `variant` axis) — one story per variant; grouped by `AllVariants` at the end ──
// The variant only paints the ACTIVE segment (inactive is a fixed style); default is `primary`.
export const Default: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Outline: Story = { args: { variant: "outline" } };

// ── OVERVIEWS (ALWAYS last) — `AllSizes` penultimate, `AllVariants` last ──

// Sizes (largest → smallest), with the control height. sm is the default.
const SIZES = [
  { size: "lg", px: "48" },
  { size: "md", px: "40" },
  { size: "sm", px: "32" },
] as const;

// AllSizes — the 3 control sizes (sm/md/lg), with px.
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ size, px }) => ({
        label: `${size} · ${px}px${size === "sm" ? " (default)" : ""}`,
        node: (
          <SegmentedControl
            options={OPTIONS}
            size={size}
            value="daily"
            onChange={() => {}}
          />
        ),
      }))}
    />
  ),
};

const VARIANTS = ["primary", "secondary", "outline"] as const;

// AllVariants — ALWAYS last: every variant (default size), grouping the variant stories above.
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANTS.map((variant) => ({
        label: cap(variant),
        node: (
          <SegmentedControl
            options={OPTIONS}
            variant={variant}
            value="daily"
            onChange={() => {}}
          />
        ),
      }))}
    />
  ),
};
