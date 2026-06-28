import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Services from "@/components/sections/Services";

const SERVICES = [
  { title: "Brand design", description: "Complete visual identity and usage guidelines." },
  { title: "Web development", description: "Fast, accessible, SEO-ready websites." },
  { title: "Digital product", description: "Custom apps and dashboards." },
];

const meta = {
  title: "Sections/Services",
  component: Services,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "What we do",
    title: "Services",
    variant: "cards",
    services: SERVICES,
  },
  argTypes: { variant: { control: "inline-radio", options: ["cards", "list"] } },
} satisfies Meta<typeof Services>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// list = single-column rows instead of the default card grid.
export const List: Story = { args: { variant: "list" } };

// Optional "view all" link below the grid.
export const WithViewAll: Story = {
  args: { viewAllText: "View all services", viewAllHref: "#services" },
};

// AllVariants — ALWAYS last: every layout variant, stacked full-width.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col">
      {(["cards", "list"] as const).map((variant) => (
        <div key={variant}>
          <div className="bg-surface-primary px-6 py-2">
            <span className="text-caption text-content-tertiary font-mono">{variant}</span>
          </div>
          <Services eyebrow="What we do" title="Services" variant={variant} services={SERVICES} />
        </div>
      ))}
    </div>
  ),
};
