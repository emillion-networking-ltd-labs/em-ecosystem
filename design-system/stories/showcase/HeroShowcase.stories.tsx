import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HeroShowcase } from "@/components/sections/HeroShowcase";

// Showcase/HeroShowcase — the star piece: composes primitives + decoration + marketing. `preset` is a
// multi-axis sector (typeface family + decorative atmosphere + emphasis), switchable from the Controls.
// NOTE: in the catalog the three presets read almost the same — the brand font faces aren't injected here
// (the consumer provides them via next/font) and `bold`/`editorial` share font-display. Genuinely
// differentiating the presets (distinct font/atmosphere/surface per sector) is its own ticket, so there
// are no per-preset stories / AllVariants yet (they would be near-identical — the very anti-pattern the
// norm forbids: AllVariants must group REAL, visibly distinct variants, never estrena them).
const meta = {
  title: "Showcase/HeroShowcase",
  component: HeroShowcase,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    preset: "bold",
    eyebrow: "Personal training",
    title: "Your strongest self",
    titleAccent: "starts today",
    subtitle: "Tailored plans, real tracking and a community that pushes you further.",
    ctaText: "Book a class",
    ctaHref: "#book",
    secondaryCtaText: "See plans",
    secondaryCtaHref: "#plans",
  },
  argTypes: {
    preset: { control: "inline-radio", options: ["bold", "elegant", "editorial"] },
  },
} satisfies Meta<typeof HeroShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

const Media = () => (
  <div className="aspect-[4/3] w-full rounded-2xl border border-border-default [background-image:var(--gradient-brand)] opacity-90" />
);

// Default — playground: the full hero. Switch the sector with the `preset` control.
export const Default: Story = { args: { media: <Media /> } };
