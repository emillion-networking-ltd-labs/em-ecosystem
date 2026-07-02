import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextGenerateEffect } from "@/components/ui/TextGenerateEffect";
import { DemoCard } from "../_kit";

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
