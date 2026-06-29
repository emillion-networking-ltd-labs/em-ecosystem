import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Hero from "@/components/sections/Hero";
import heroPhoto from "../assets/hero-sample.jpg";

// Static image import resolves to {src}|string under storybook-vite; normalize to the string the prop wants.
const heroSrc = typeof heroPhoto === "string" ? heroPhoto : heroPhoto.src;

const meta = {
  title: "Sections/Hero",
  component: Hero,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    title: "Where bold brands begin.",
    ctaText: "Start your project",
    ctaHref: "#contact",
    imageSrc: heroSrc,
    imageAlt: "Mountain landscape at dawn",
    stats: [
      { value: "+500", label: "Projects shipped" },
      { value: "12", label: "Years of craft" },
      { value: "98%", label: "Client retention" },
      { value: "30+", label: "Awards won" },
    ],
  },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// AllVariants — ALWAYS last: with stats (default) and without stats.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col">
      <div className="bg-surface-primary px-6 py-2">
        <span className="text-caption text-content-tertiary font-mono">with stats</span>
      </div>
      <Hero
        title="Where bold brands begin."
        ctaText="Start your project"
        ctaHref="#contact"
        imageSrc={heroSrc}
        imageAlt="Mountain landscape at dawn"
        stats={[
          { value: "+500", label: "Projects shipped" },
          { value: "12", label: "Years of craft" },
          { value: "98%", label: "Client retention" },
          { value: "30+", label: "Awards won" },
        ]}
      />
      <div className="bg-surface-primary px-6 py-2">
        <span className="text-caption text-content-tertiary font-mono">without stats</span>
      </div>
      <Hero
        title="Where bold brands begin."
        ctaText="Start your project"
        ctaHref="#contact"
        imageSrc={heroSrc}
        imageAlt="Mountain landscape at dawn"
      />
    </div>
  ),
};
