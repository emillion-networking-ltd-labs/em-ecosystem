import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TypingAnimation } from "@/components/ui/TypingAnimation";
import { DemoCard } from "../_kit";

// Marketing/TypingAnimation — typewriter effect (type/delete, optional loop, blinking cursor). Starts on
// view. Color/size from className. The cursor uses the `blink-cursor` keyframe (tokens.css).
const meta = {
  title: "Marketing/TypingAnimation",
  component: TypingAnimation,
  tags: ["autodocs"],
  args: {
    children: "Where bold brands begin.",
    className: "text-display-3 font-mono text-content-primary",
  },
} satisfies Meta<typeof TypingAnimation>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — types a single phrase once.
export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <TypingAnimation {...args} />
    </DemoCard>
  ),
};

// Loop — cycles through several words (type → pause → delete → next).
export const Loop: Story = {
  args: {
    children: undefined,
    words: ["Design.", "Develop.", "Deliver."],
    loop: true,
  },
  render: (args) => (
    <DemoCard>
      <TypingAnimation {...args} />
    </DemoCard>
  ),
};

// CursorBlock — block cursor instead of the line caret.
export const CursorBlock: Story = {
  args: { cursorStyle: "block" },
  render: (args) => (
    <DemoCard>
      <TypingAnimation {...args} />
    </DemoCard>
  ),
};
