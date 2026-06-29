import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WordRotate } from "@/components/ui/WordRotate";

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
export const Default: Story = {};

// Slow — a longer interval between words.
export const Slow: Story = { args: { duration: 4000 } };

// AllVariants — ALWAYS last: the rotation intervals (size/color come from className).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {[
        { label: "default · 2500ms", duration: 2500 },
        { label: "slow · 4000ms", duration: 4000 },
      ].map(({ label, duration }) => (
        <div key={label}>
          <p className="mb-2 text-caption text-content-tertiary font-mono">{label}</p>
          <WordRotate
            words={["Design", "Develop", "Deliver"]}
            duration={duration}
            className="text-display-2 font-display font-bold text-content-primary"
          />
        </div>
      ))}
    </div>
  ),
};
