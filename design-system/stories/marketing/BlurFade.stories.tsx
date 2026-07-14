import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlurFade } from "@/components/ui/BlurFade";
import { DemoCard } from "../_kit";

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
    <DemoCard>
      <BlurFade {...args}>
        <p className="text-display-2 font-display font-bold text-content-primary">
          Arrives with poise
        </p>
      </BlurFade>
    </DemoCard>
  ),
};

// Staggered — the `delay` prop fanned across a list for a cascading reveal.
export const Staggered: Story = {
  render: (args) => (
    <DemoCard>
      <div className="flex flex-col gap-3">
        {["True to the facts", "Beautiful per sector", "First-party code"].map(
          (t, i) => (
            <BlurFade key={t} {...args} delay={i * 0.15}>
              <p className="text-display-3 font-display font-bold text-content-primary">
                {t}
              </p>
            </BlurFade>
          ),
        )}
      </div>
    </DemoCard>
  ),
};
