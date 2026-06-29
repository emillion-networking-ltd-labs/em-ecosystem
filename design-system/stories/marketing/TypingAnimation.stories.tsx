import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TypingAnimation } from "@/components/ui/TypingAnimation";
import { DemoCell, DemoStack } from "./_frame";

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
    <DemoStack>
      {(["line", "block", "underscore"] as const).map((cursorStyle) => (
        <DemoCell
          key={cursorStyle}
          caption={`cursor · ${cursorStyle}${cursorStyle === "line" ? " (default)" : ""}`}
        >
          <TypingAnimation
            cursorStyle={cursorStyle}
            className="text-display-3 font-display font-bold text-content-primary"
          >
            Where bold brands begin.
          </TypingAnimation>
        </DemoCell>
      ))}
      <DemoCell caption="loop · words">
        <TypingAnimation
          words={["Design.", "Develop.", "Deliver."]}
          loop
          className="text-display-3 font-display font-bold text-content-primary"
        />
      </DemoCell>
    </DemoStack>
  ),
};
