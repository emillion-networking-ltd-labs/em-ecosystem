import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import FAQ from "@/components/sections/FAQ";

const ITEMS = [
  { question: "How long does a project take?", answer: "Between 3 and 6 weeks depending on scope and the level of polish you need." },
  { question: "Do you work remotely?", answer: "Yes, with teams across the world — async-friendly and on your timezone when it matters." },
  { question: "Do you offer maintenance?", answer: "Yes, optional monthly plans to keep everything fast, secure and up to date." },
  { question: "How do we get started?", answer: "A short discovery call, a clear proposal, and a kickoff within the week." },
];

const meta = {
  title: "Sections/FAQ",
  component: FAQ,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "FAQ",
    title: "Frequently asked questions",
    items: ITEMS,
  },
  argTypes: {
    surface: { control: "inline-radio", options: ["grouped", "separated"] },
    indicator: { control: "inline-radio", options: ["chevron", "plus"] },
  },
} satisfies Meta<typeof FAQ>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — grouped accordion with the plus (+→×) indicator.
export const Default: Story = {};

// Separated — each question in its own bordered card.
export const Separated: Story = { args: { surface: "separated" } };

// Chevron — the alternative indicator (▾ rotates 180° instead of the +→×).
export const Chevron: Story = { args: { indicator: "chevron" } };

// surface (grouped/separated) and indicator (plus/chevron) are config params, each its own story — not a
// single design-variant axis. The old AllVariants was a surface×indicator matrix → removed.
