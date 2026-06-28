import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Portfolio from "@/components/sections/Portfolio";
import photoA from "../assets/sample-after.jpg";
import photoB from "../assets/sample-before.jpg";

// Static image imports resolve to {src}|string under storybook-vite; normalize to the string the prop wants.
const srcA = typeof photoA === "string" ? photoA : photoA.src;
const srcB = typeof photoB === "string" ? photoB : photoB.src;

const ITEMS = [
  { title: "Atlas Rebrand", description: "Identity and website for a fintech." },
  { title: "Verde App", description: "A mobility mobile product." },
  { title: "Norte Store", description: "Custom e-commerce build." },
];

const meta = {
  title: "Sections/Portfolio",
  component: Portfolio,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Work",
    title: "Recent projects",
    variant: "grid",
    viewAllText: "View all",
    viewAllHref: "#",
    items: ITEMS,
  },
  argTypes: { variant: { control: "inline-radio", options: ["grid", "featured"] } },
} satisfies Meta<typeof Portfolio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// featured = the first item spans two columns as a hero tile.
export const Featured: Story = { args: { variant: "featured" } };

// Items without an image fall back to a brand-colored tile with the title.
export const WithImages: Story = {
  args: {
    items: [
      { title: "Atlas Rebrand", description: "Identity and website for a fintech.", imageSrc: srcA },
      { title: "Verde App", description: "A mobility mobile product.", imageSrc: srcB },
      { title: "Norte Store", description: "Custom e-commerce build." },
    ],
  },
};

// AllVariants — ALWAYS last: every layout variant, stacked full-width.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col">
      {(["grid", "featured"] as const).map((variant) => (
        <div key={variant}>
          <div className="bg-surface-primary px-6 py-2">
            <span className="text-caption text-content-tertiary font-mono">{variant}</span>
          </div>
          <Portfolio eyebrow="Work" title="Recent projects" variant={variant} items={ITEMS} />
        </div>
      ))}
    </div>
  ),
};
