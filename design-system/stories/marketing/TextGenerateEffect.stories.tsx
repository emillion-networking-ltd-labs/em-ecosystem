import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextGenerateEffect } from "@/components/ui/TextGenerateEffect";

// Aceternity UI (MIT), adoptado verbatim en ECO-88.
const meta = {
  title: "Marketing/TextGenerateEffect",
  component: TextGenerateEffect,
  tags: ["autodocs"],
  args: {
    words: "Diseño que aparece palabra a palabra, con oficio.",
    filter: true,
    duration: 0.5,
  },
} satisfies Meta<typeof TextGenerateEffect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SinDesenfoque: Story = { args: { filter: false } };
