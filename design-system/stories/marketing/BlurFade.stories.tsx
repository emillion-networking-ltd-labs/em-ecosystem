import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlurFade } from "@/components/ui/BlurFade";
import Card from "@/components/ui/Card";

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
    <Card className="flex min-h-[140px] items-center justify-center">
      <BlurFade {...args}>
        <h2 className="text-display-3 font-display text-content-primary">Arrives with poise</h2>
      </BlurFade>
    </Card>
  ),
};

// Staggered — the `delay` prop fanned across a list for a cascading reveal.
export const Staggered: Story = {
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <div className="flex flex-col gap-3">
        {["True to the facts", "Beautiful per sector", "First-party code"].map((t, i) => (
          <BlurFade key={t} {...args} delay={i * 0.15}>
            <p className="text-content-secondary">{t}</p>
          </BlurFade>
        ))}
      </div>
    </Card>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, Staggered) — one project Card each, name above.
const VARIANTS = [
  {
    label: "Default",
    node: (
      <BlurFade inView duration={0.6}>
        <h2 className="text-display-3 font-display text-content-primary">Arrives with poise</h2>
      </BlurFade>
    ),
  },
  {
    label: "Staggered",
    node: (
      <div className="flex flex-col gap-3">
        {["True to the facts", "Beautiful per sector", "First-party code"].map((t, i) => (
          <BlurFade key={t} inView duration={0.6} delay={i * 0.15}>
            <p className="text-content-secondary">{t}</p>
          </BlurFade>
        ))}
      </div>
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
