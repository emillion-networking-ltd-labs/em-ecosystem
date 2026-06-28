import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HeroShowcase } from "@/components/sections/HeroShowcase";

// The star piece: composes primitives + decoration + marketing. `preset` = a multi-axis sector
// (typeface family + decorative atmosphere + emphasis), not just a color.
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

export const Default: Story = { args: { media: <Media /> } };

// Preset BOLD (gym / tech): punchy sans + brand halos.
export const Bold: Story = { args: { media: <Media /> } };

// Preset ELEGANT (restaurant / luxury): serif + a subtle atmosphere.
export const Elegant: Story = {
  args: {
    preset: "elegant",
    eyebrow: "Seasonal kitchen",
    title: "Flavors you remember",
    titleAccent: "",
    subtitle: "Local produce, signature recipes and a room built to lose track of time in.",
    ctaText: "Book a table",
    ctaHref: "#book",
    secondaryCtaText: "View menu",
    secondaryCtaHref: "#menu",
    media: <Media />,
  },
};

// Preset EDITORIAL (agency / portfolio): technical grid + strong typography.
export const Editorial: Story = {
  args: {
    preset: "editorial",
    eyebrow: "Design studio",
    title: "Ideas with craft",
    titleAccent: "and results",
    subtitle: "Brand, product and web for teams that want to truly stand out.",
    ctaText: "Let's talk",
    ctaHref: "#contact",
    media: <Media />,
  },
};

// Omit-if-absent: no media → single-column hero, centered (never an invented placeholder).
export const NoMedia: Story = { args: { media: undefined } };

// AllVariants — ALWAYS last: every preset stacked, so the multi-axis difference reads at a glance.
const PRESETS = [
  {
    preset: "bold",
    label: "bold · gym / tech",
    args: {
      eyebrow: "Personal training",
      title: "Your strongest self",
      titleAccent: "starts today",
      subtitle: "Tailored plans, real tracking and a community that pushes you further.",
      ctaText: "Book a class",
      ctaHref: "#book",
      secondaryCtaText: "See plans",
      secondaryCtaHref: "#plans",
    },
  },
  {
    preset: "elegant",
    label: "elegant · restaurant / luxury",
    args: {
      eyebrow: "Seasonal kitchen",
      title: "Flavors you remember",
      subtitle: "Local produce, signature recipes and a room built to lose track of time in.",
      ctaText: "Book a table",
      ctaHref: "#book",
      secondaryCtaText: "View menu",
      secondaryCtaHref: "#menu",
    },
  },
  {
    preset: "editorial",
    label: "editorial · agency / portfolio",
    args: {
      eyebrow: "Design studio",
      title: "Ideas with craft",
      titleAccent: "and results",
      subtitle: "Brand, product and web for teams that want to truly stand out.",
      ctaText: "Let's talk",
      ctaHref: "#contact",
    },
  },
] as const;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {PRESETS.map(({ preset, label, args }) => (
        <div key={preset} className="flex flex-col gap-2">
          <span className="px-6 text-caption text-content-tertiary font-mono">{label}</span>
          <HeroShowcase preset={preset} {...args} media={<Media />} />
        </div>
      ))}
    </div>
  ),
};
