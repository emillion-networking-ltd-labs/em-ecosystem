import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { DemoCard, Variants, Sizes } from "../_kit";

const meta = {
  title: "Primitives/CountdownTimer",
  component: CountdownTimer,
  tags: ["autodocs"],
  args: { seconds: 120, variant: "error", size: "sm" },
  argTypes: {
    variant: { control: "inline-radio", options: ["error", "warning"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  render: (args) => (
    <DemoCard>
      <CountdownTimer {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof CountdownTimer>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ["error", "warning"] as const;
// Largest to smallest, like the rest. sm is the component default.
const SIZES = ["lg", "md", "sm"] as const;

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

// Default — playground: use the controls (variant, size). The default variant is `error`.
export const Default: Story = {};

// Warning — the non-default variant (error is shown by Default), before AllVariants groups both.
export const Warning: Story = { args: { variant: "warning" } };

// AllSizes — the 3 sizes (error variant). sm is the default.
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map((s) => ({
        label: `${s}${s === "sm" ? " (default)" : ""}`,
        node: <CountdownTimer seconds={120} variant="error" size={s} />,
      }))}
    />
  ),
};

// AllVariants — ALWAYS last: every variant at the default size (sm), matching the variant stories above.
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANTS.map((v) => ({
        label: cap(v),
        node: <CountdownTimer seconds={120} variant={v} />,
      }))}
    />
  ),
};
