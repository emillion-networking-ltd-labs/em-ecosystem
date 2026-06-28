import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Testimonials from "@/components/sections/Testimonials";

const ITEMS = [
  { name: "Ana Garcia", quote: "They understood the brand from the very first call.", result: "+40% leads" },
  { name: "Luis Perez", quote: "Fast, clear and genuinely skilled.", result: "Launched in 4 weeks" },
  { name: "Maria Ruiz", quote: "The best team we've ever worked with." },
];

const meta = {
  title: "Sections/Testimonials",
  component: Testimonials,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Reviews",
    title: "What our clients say",
    variant: "cards",
    items: ITEMS,
  },
  argTypes: { variant: { control: "inline-radio", options: ["cards", "list"] } },
} satisfies Meta<typeof Testimonials>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// list = single-column rows instead of the default card grid.
export const List: Story = { args: { variant: "list" } };

// Optional "view all" link below the grid.
export const WithViewAll: Story = {
  args: { viewAllText: "Read all reviews", viewAllHref: "#reviews" },
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
          <Testimonials eyebrow="Reviews" title="What our clients say" variant={variant} items={ITEMS} />
        </div>
      ))}
    </div>
  ),
};
