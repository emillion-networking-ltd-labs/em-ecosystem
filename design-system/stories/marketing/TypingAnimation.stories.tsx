import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TypingAnimation } from "@/components/ui/TypingAnimation";

// Marketing/TypingAnimation — typewriter effect (type/delete, optional loop, blinking cursor). Starts on
// view. Color/size from className. The cursor uses the `blink-cursor` keyframe (tokens.css).
const meta = {
  title: "Marketing/TypingAnimation",
  component: TypingAnimation,
  tags: ["autodocs"],
  args: {
    children: "Where bold brands begin.",
    className: "text-display-3 font-display font-bold text-content-primary",
  },
} satisfies Meta<typeof TypingAnimation>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — types a single phrase once.
export const Default: Story = {};

// Loop — cycles through several words (type → pause → delete → next).
export const Loop: Story = {
  args: { children: undefined, words: ["Design.", "Develop.", "Deliver."], loop: true },
};

// CursorBlock — block cursor instead of the line caret.
export const CursorBlock: Story = { args: { cursorStyle: "block" } };

// AllVariants — ALWAYS last: the three cursor styles + the looping mode.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["line", "block", "underscore"] as const).map((cursorStyle) => (
        <div key={cursorStyle}>
          <p className="mb-2 text-caption text-content-tertiary font-mono">
            cursor · {cursorStyle}
            {cursorStyle === "line" ? " (default)" : ""}
          </p>
          <TypingAnimation
            cursorStyle={cursorStyle}
            className="text-display-3 font-display font-bold text-content-primary"
          >
            Where bold brands begin.
          </TypingAnimation>
        </div>
      ))}
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">loop · words</p>
        <TypingAnimation
          words={["Design.", "Develop.", "Deliver."]}
          loop
          className="text-display-3 font-display font-bold text-content-primary"
        />
      </div>
    </div>
  ),
};
