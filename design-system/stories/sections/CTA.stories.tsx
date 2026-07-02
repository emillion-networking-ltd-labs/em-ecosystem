import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CTA from "@/components/sections/CTA";

const meta = {
  title: "Sections/CTA",
  component: CTA,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    title: "Ready to start your project?",
    description: "Tell us what you need and we'll get back to you within 24 hours.",
    primaryCtaText: "Talk to the team",
    primaryCtaHref: "#contact",
    secondaryCtaText: "See plans",
    secondaryCtaHref: "#plans",
    note: "No strings attached.",
  },
} satisfies Meta<typeof CTA>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — a full-width closing band, forced dark (like the footer), with two button actions.
export const Default: Story = {};

// A single closing CTA band — no design-variant/size axis, so no AllVariants.
