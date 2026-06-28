import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Hero from "@/components/sections/Hero";
import heroPhoto from "../assets/sample-after.jpg";

// Static image import resolves to {src}|string under storybook-vite; normalize to the string the prop wants.
const heroSrc = typeof heroPhoto === "string" ? heroPhoto : heroPhoto.src;

const meta = {
  title: "Sections/Hero",
  component: Hero,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Creative studio",
    title: "Brands people remember",
    subtitle: "Design, web and product for teams that want to stand out.",
    ctaText: "Get started",
    ctaHref: "#contact",
    secondaryCtaText: "See our work",
    secondaryCtaHref: "#portfolio",
    variant: "gradient",
    align: "center",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["gradient", "soft"] },
    align: { control: "inline-radio", options: ["left", "center"] },
  },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// gradient = brand-colored background (default). soft = surface with brand accents.
export const Soft: Story = { args: { variant: "soft", align: "left" } };

// Content aligned to the start instead of centered.
export const AlignLeft: Story = { args: { align: "left" } };

// Optional real client photo turns the hero into a split layout (text + image).
export const WithImage: Story = {
  args: {
    align: "left",
    imageSrc: heroSrc,
    imageAlt: "Studio workspace",
  },
};

// AllVariants — ALWAYS last: every variant × alignment, stacked full-width.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col">
      {(
        [
          { variant: "gradient", align: "center" },
          { variant: "gradient", align: "left" },
          { variant: "soft", align: "center" },
          { variant: "soft", align: "left" },
        ] as const
      ).map(({ variant, align }) => (
        <div key={`${variant}-${align}`}>
          <div className="bg-surface-primary px-6 py-2">
            <span className="text-caption text-content-tertiary font-mono">
              {variant} · {align}
            </span>
          </div>
          <Hero
            variant={variant}
            align={align}
            eyebrow="Creative studio"
            title="Brands people remember"
            subtitle="Design, web and product for teams that want to stand out."
            ctaText="Get started"
            ctaHref="#contact"
            secondaryCtaText="See our work"
            secondaryCtaHref="#portfolio"
          />
        </div>
      ))}
    </div>
  ),
};
