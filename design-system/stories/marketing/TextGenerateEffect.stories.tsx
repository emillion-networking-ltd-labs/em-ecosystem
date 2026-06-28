import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextGenerateEffect } from "@/components/ui/TextGenerateEffect";

// Aceternity UI (MIT), adopted verbatim in ECO-88. Reveals words one by one with a progressive blur.
const meta = {
  title: "Marketing/TextGenerateEffect",
  component: TextGenerateEffect,
  tags: ["autodocs"],
  args: {
    words: "Design that arrives word by word, with craft.",
    filter: true,
    duration: 0.5,
  },
} satisfies Meta<typeof TextGenerateEffect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// NoBlur — the `filter` prop off, so words fade in without the blur pass.
export const NoBlur: Story = { args: { filter: false } };

// AllVariants — ALWAYS last: the real `filter` boolean × the `duration` prop.
const VARIANTS = [
  { filter: true, duration: 0.5, label: "filter on · 0.5s (default)" },
  { filter: false, duration: 0.5, label: "filter off · 0.5s" },
  { filter: true, duration: 1, label: "filter on · 1s" },
] as const;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col items-start gap-1.5">
          <TextGenerateEffect
            words="Reveal the headline with intent."
            filter={v.filter}
            duration={v.duration}
          />
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
        </div>
      ))}
    </div>
  ),
};
