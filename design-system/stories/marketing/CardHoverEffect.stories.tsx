import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CardHoverEffect } from "@/components/ui/CardHoverEffect";
import { DemoCard } from "../_kit";

// Marketing/CardHoverEffect — a grid of cards where a soft surface follows the hovered card (services/
// features). Theme-aware (surface/content/border tokens), not the original fixed-dark cards.
const meta = {
  title: "Marketing/CardHoverEffect",
  component: CardHoverEffect,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CardHoverEffect>;

export default meta;
type Story = StoryObj<typeof meta>;

const services = [
  { title: "Design", description: "Brand systems and interfaces crafted from a governed token base.", link: "#design" },
  { title: "Development", description: "Production sites on a modern, accessible, fast stack.", link: "#development" },
  { title: "Strategy", description: "Positioning and content that turn visitors into clients.", link: "#strategy" },
  { title: "Branding", description: "Identity that scales across every surface and channel.", link: "#branding" },
  { title: "Support", description: "Ongoing care, monitoring and iteration after launch.", link: "#support" },
  { title: "Analytics", description: "Measurement and insight to keep improving what matters.", link: "#analytics" },
];

export const Default: Story = {
  render: () => (
    <DemoCard block>
      <CardHoverEffect items={services} />
    </DemoCard>
  ),
};
