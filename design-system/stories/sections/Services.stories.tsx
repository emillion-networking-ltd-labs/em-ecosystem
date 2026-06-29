import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Services from "@/components/sections/Services";

const SERVICES = [
  {
    label: "Strategy",
    title: "Brand strategy",
    fullDesc: "We define positioning, naming and messaging so every touchpoint speaks with one clear voice and point of view.",
    features: ["Market & competitor audit", "Positioning & messaging", "Naming & verbal identity"],
  },
  {
    label: "Design",
    title: "Product & web design",
    fullDesc: "Interfaces and websites crafted to convert and delight, from the first wireframe to a polished, accessible UI.",
    features: ["UX research & wireframes", "Design system & UI", "Prototyping & handoff"],
  },
  {
    label: "Engineering",
    title: "Front-end development",
    fullDesc: "Fast, accessible front-ends built to last, with clean code and performance baked in from day one.",
    features: ["Next.js & React builds", "Design-system implementation", "Performance & a11y"],
  },
];

const meta = {
  title: "Sections/Services",
  component: Services,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Services",
    title: "What we do",
    subtitle: "A complete system from strategy to launch, built to deliver real results.",
    services: SERVICES,
  },
} satisfies Meta<typeof Services>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// AllVariants — ALWAYS last: the services grid with its expandable "what's included" details.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col">
      <div className="bg-surface-primary px-6 py-2">
        <span className="text-caption text-content-tertiary font-mono">services · expandable details</span>
      </div>
      <Services
        eyebrow="Services"
        title="What we do"
        subtitle="A complete system from strategy to launch, built to deliver real results."
        services={SERVICES}
      />
    </div>
  ),
};
