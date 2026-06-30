import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextGenerateEffect } from "@/components/ui/TextGenerateEffect";
import Card from "@/components/ui/Card";

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

export const Default: Story = {
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <TextGenerateEffect {...args} />
    </Card>
  ),
};

// NoBlur — the `filter` prop off, so words fade in without the blur pass.
export const NoBlur: Story = {
  args: { filter: false },
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <TextGenerateEffect {...args} />
    </Card>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, NoBlur) — one project Card each, name above.
const WORDS = "Design that arrives word by word, with craft.";
const VARIANTS = [
  { label: "Default", node: <TextGenerateEffect words={WORDS} filter duration={0.5} /> },
  { label: "NoBlur", node: <TextGenerateEffect words={WORDS} filter={false} duration={0.5} /> },
];

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
          <Card className="flex min-h-[140px] items-center justify-center">{v.node}</Card>
        </div>
      ))}
    </div>
  ),
};
