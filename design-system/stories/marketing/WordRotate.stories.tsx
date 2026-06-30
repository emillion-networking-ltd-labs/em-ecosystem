import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WordRotate } from "@/components/ui/WordRotate";
import Card from "@/components/ui/Card";

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
    <Card className="flex min-h-[140px] items-center justify-center">
      <WordRotate {...args} />
    </Card>
  ),
};

// Slow — a longer interval between words.
export const Slow: Story = {
  args: { duration: 4000 },
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <WordRotate {...args} />
    </Card>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, Slow) — one project Card each, name above.
const CLS = "text-display-2 font-display font-bold text-content-primary";
const VARIANTS = [
  { label: "Default", node: <WordRotate words={["Design", "Develop", "Deliver"]} className={CLS} /> },
  {
    label: "Slow",
    node: <WordRotate words={["Design", "Develop", "Deliver"]} duration={4000} className={CLS} />,
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
