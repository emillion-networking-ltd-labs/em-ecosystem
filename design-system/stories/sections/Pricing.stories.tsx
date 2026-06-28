import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Pricing from "@/components/sections/Pricing";

const PLANS = [
  {
    name: "Basic",
    price: "$30",
    period: "/mo",
    description: "To get started.",
    features: ["1 project", "Email support"],
    cta: "Choose Basic",
  },
  {
    name: "Pro",
    price: "$60",
    period: "/mo",
    description: "For growing teams.",
    features: ["Unlimited projects", "Priority support", "Analytics"],
    highlighted: true,
    cta: "Choose Pro",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large accounts.",
    features: ["SLA", "Dedicated onboarding"],
    cta: "Contact sales",
  },
];

const meta = {
  title: "Sections/Pricing",
  component: Pricing,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Plans",
    title: "Clear pricing",
    subtitle: "No surprises. Cancel anytime.",
    plans: PLANS,
  },
} satisfies Meta<typeof Pricing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
