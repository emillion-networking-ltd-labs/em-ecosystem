import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FlipWords } from "@/components/ui/FlipWords";
import { DemoCard } from "../_kit";

// Marketing/FlipWords — flips between words letter by letter (blur in/out). Theme-aware (content-primary);
// size from className. Useful as the animated highlight inside a headline.
const meta = {
  title: "Marketing/FlipWords",
  component: FlipWords,
  tags: ["autodocs"],
  args: {
    words: ["beautiful", "modern", "fast", "yours"],
    className: "text-display-2 font-display font-bold",
  },
} satisfies Meta<typeof FlipWords>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — flips between the words.
export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <FlipWords {...args} />
    </DemoCard>
  ),
};

// InContext — as the animated word inside a headline.
export const InContext: Story = {
  render: () => (
    <DemoCard>
      <h2 className="text-display-3 font-display font-bold text-content-primary">
        Build something <FlipWords words={["beautiful", "modern", "fast"]} />
      </h2>
    </DemoCard>
  ),
};
