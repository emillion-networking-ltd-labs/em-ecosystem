import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import FAQ from "@/components/sections/FAQ";

const ITEMS = [
  { question: "How long does a project take?", answer: "Between 3 and 6 weeks depending on scope." },
  { question: "Do you work remotely?", answer: "Yes, with teams across the world." },
  { question: "Do you offer maintenance?", answer: "Yes, optional monthly plans." },
];

const meta = {
  title: "Sections/FAQ",
  component: FAQ,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Questions",
    title: "Frequently asked questions",
    variant: "list",
    items: ITEMS,
  },
  argTypes: { variant: { control: "inline-radio", options: ["list", "boxed"] } },
} satisfies Meta<typeof FAQ>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// boxed = each question sits in its own bordered card instead of an underlined row.
export const Boxed: Story = { args: { variant: "boxed" } };

// AllVariants — ALWAYS last: every layout variant, stacked full-width.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col">
      {(["list", "boxed"] as const).map((variant) => (
        <div key={variant}>
          <div className="bg-surface-primary px-6 py-2">
            <span className="text-caption text-content-tertiary font-mono">{variant}</span>
          </div>
          <FAQ eyebrow="Questions" title="Frequently asked questions" variant={variant} items={ITEMS} />
        </div>
      ))}
    </div>
  ),
};
