import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TypingAnimation } from "@/components/ui/TypingAnimation";
import Card from "@/components/ui/Card";

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
export const Default: Story = {
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <TypingAnimation {...args} />
    </Card>
  ),
};

// Loop — cycles through several words (type → pause → delete → next).
export const Loop: Story = {
  args: { children: undefined, words: ["Design.", "Develop.", "Deliver."], loop: true },
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <TypingAnimation {...args} />
    </Card>
  ),
};

// CursorBlock — block cursor instead of the line caret.
export const CursorBlock: Story = {
  args: { cursorStyle: "block" },
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <TypingAnimation {...args} />
    </Card>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, Loop, CursorBlock) — one project Card each, name above.
const CLS = "text-display-3 font-display font-bold text-content-primary";
const VARIANTS = [
  { label: "Default", node: <TypingAnimation className={CLS}>Where bold brands begin.</TypingAnimation> },
  {
    label: "Loop",
    node: <TypingAnimation words={["Design.", "Develop.", "Deliver."]} loop className={CLS} />,
  },
  {
    label: "CursorBlock",
    node: (
      <TypingAnimation cursorStyle="block" className={CLS}>
        Where bold brands begin.
      </TypingAnimation>
    ),
  },
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
