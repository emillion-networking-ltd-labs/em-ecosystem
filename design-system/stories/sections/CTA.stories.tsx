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
    variant: "brand",
  },
  argTypes: { variant: { control: "inline-radio", options: ["brand", "surface"] } },
} satisfies Meta<typeof CTA>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// surface = neutral panel with a border instead of the brand gradient.
export const Surface: Story = { args: { variant: "surface" } };

// AllVariants — ALWAYS last: every panel variant, stacked full-width.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col">
      {(["brand", "surface"] as const).map((variant) => (
        <div key={variant}>
          <div className="bg-surface-primary px-6 py-2">
            <span className="text-caption text-content-tertiary font-mono">{variant}</span>
          </div>
          <CTA
            variant={variant}
            title="Ready to start your project?"
            description="Tell us what you need and we'll get back to you within 24 hours."
            primaryCtaText="Talk to the team"
            primaryCtaHref="#contact"
            secondaryCtaText="See plans"
            secondaryCtaHref="#plans"
            note="No strings attached."
          />
        </div>
      ))}
    </div>
  ),
};
