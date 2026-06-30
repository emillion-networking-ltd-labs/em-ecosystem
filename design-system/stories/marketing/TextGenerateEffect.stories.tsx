import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextGenerateEffect } from "@/components/ui/TextGenerateEffect";
import { DemoCard, Variants } from "../_kit";

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
    <DemoCard>
      <TextGenerateEffect {...args} />
    </DemoCard>
  ),
};

// NoBlur — the `filter` prop off, so words fade in without the blur pass.
export const NoBlur: Story = {
  args: { filter: false },
  render: (args) => (
    <DemoCard>
      <TextGenerateEffect {...args} />
    </DemoCard>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, NoBlur) — one project Card each, name above.
const WORDS = "Design that arrives word by word, with craft.";
const VARIANTS = [
  { label: "Default", node: <TextGenerateEffect words={WORDS} filter duration={0.5} /> },
  { label: "NoBlur", node: <TextGenerateEffect words={WORDS} filter={false} duration={0.5} /> },
];

export const AllVariants: Story = {
  render: () => <Variants items={VARIANTS} />,
};
