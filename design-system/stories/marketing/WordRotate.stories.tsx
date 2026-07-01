import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WordRotate } from "@/components/ui/WordRotate";
import { DemoCard } from "../_kit";

// Marketing/WordRotate — rotates through words with a fade up/down (dynamic hero headlines). Color/size
// come from className (display scale + font-display for marketing).
const meta = {
  title: "Marketing/WordRotate",
  component: WordRotate,
  tags: ["autodocs"],
  args: {
    words: ["Design", "Develop", "Deliver"],
    className: "text-display-2 font-display font-bold text-content-primary",
  },
} satisfies Meta<typeof WordRotate>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — rotates every 2.5s.
export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <WordRotate {...args} />
    </DemoCard>
  ),
};

// Slow — a longer interval between words.
export const Slow: Story = {
  args: { duration: 4000 },
  render: (args) => (
    <DemoCard>
      <WordRotate {...args} />
    </DemoCard>
  ),
};
