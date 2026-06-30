import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FlipWords } from "@/components/ui/FlipWords";
import Card from "@/components/ui/Card";

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
    <Card className="flex min-h-[140px] items-center justify-center">
      <FlipWords {...args} />
    </Card>
  ),
};

// InContext — as the animated word inside a headline.
export const InContext: Story = {
  render: () => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <h2 className="text-display-3 font-display font-bold text-content-primary">
        Build something <FlipWords words={["beautiful", "modern", "fast"]} />
      </h2>
    </Card>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, InContext) — one project Card each, name above.
const VARIANTS = [
  {
    label: "Default",
    node: (
      <FlipWords
        words={["beautiful", "modern", "fast", "yours"]}
        className="text-display-2 font-display font-bold"
      />
    ),
  },
  {
    label: "InContext",
    node: (
      <h2 className="text-display-3 font-display font-bold text-content-primary">
        Build something <FlipWords words={["beautiful", "modern", "fast"]} />
      </h2>
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
