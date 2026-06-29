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

// AllVariants — ALWAYS last: full (description + two actions + note) and minimal (primary only).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col">
      <div className="bg-surface-primary px-6 py-2">
        <span className="text-caption text-content-tertiary font-mono">full · two actions + note</span>
      </div>
      <CTA
        title="Ready to start your project?"
        description="Tell us what you need and we'll get back to you within 24 hours."
        primaryCtaText="Talk to the team"
        primaryCtaHref="#contact"
        secondaryCtaText="See plans"
        secondaryCtaHref="#plans"
        note="No strings attached."
      />
      <div className="bg-surface-primary px-6 py-2">
        <span className="text-caption text-content-tertiary font-mono">minimal · primary only</span>
      </div>
      <CTA
        title="Ready to start your project?"
        primaryCtaText="Talk to the team"
        primaryCtaHref="#contact"
      />
    </div>
  ),
};
