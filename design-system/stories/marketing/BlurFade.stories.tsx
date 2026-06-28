import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlurFade } from "@/components/ui/BlurFade";

// Magic UI (MIT), adopted verbatim in ECO-82. Blur-in reveal. Uses `motion/react`.
const meta = {
  title: "Marketing/BlurFade",
  component: BlurFade,
  tags: ["autodocs"],
  args: {
    duration: 0.6,
    delay: 0,
    direction: "down",
    inView: true,
  },
} satisfies Meta<typeof BlurFade>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <BlurFade {...args}>
      <h2 className="text-display-3 font-display text-content-primary">
        Arrives with poise
      </h2>
    </BlurFade>
  ),
};

// Staggered — the `delay` prop fanned across a list for a cascading reveal.
export const Staggered: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {["True to the facts", "Beautiful per sector", "First-party code"].map((t, i) => (
        <BlurFade key={t} {...args} delay={i * 0.15}>
          <p className="text-content-secondary">{t}</p>
        </BlurFade>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: the real `direction` enum (up / down / left / right).
const DIRECTIONS = ["up", "down", "left", "right"] as const;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {DIRECTIONS.map((direction) => (
        <div key={direction} className="flex flex-col items-start gap-1.5">
          <BlurFade direction={direction} inView duration={0.6}>
            <p className="text-content-secondary">Reveal from {direction}</p>
          </BlurFade>
          <span className="text-caption text-content-tertiary font-mono">
            direction: {direction}
            {direction === "down" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};
