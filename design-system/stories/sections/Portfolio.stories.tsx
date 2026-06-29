import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Portfolio from "@/components/sections/Portfolio";
import photoA from "../assets/sample-after.jpg";
import photoB from "../assets/sample-before.jpg";
import photoC from "../assets/hero-sample.jpg";

// Static image imports resolve to {src}|string under storybook-vite; normalize to the string the prop wants.
const srcA = typeof photoA === "string" ? photoA : photoA.src;
const srcB = typeof photoB === "string" ? photoB : photoB.src;
const srcC = typeof photoC === "string" ? photoC : photoC.src;

const ITEMS = [
  { title: "Atlas Rebrand", description: "Identity and website for a fintech." },
  { title: "Verde App", description: "A mobility mobile product." },
  { title: "Norte Store", description: "Custom e-commerce build." },
];

// Same items but every card has a photo (the third reuses srcA) — for the image-driven views.
const ITEMS_IMG = [
  { title: "Atlas Rebrand", description: "Identity and website for a fintech.", imageSrc: srcA },
  { title: "Verde App", description: "A mobility mobile product.", imageSrc: srcB },
  { title: "Norte Store", description: "Custom e-commerce build.", imageSrc: srcA },
];

// Pure image set for the gallery variant (captions via `title`; images reused to fill the grid).
const GALLERY = [
  { title: "Backstage", imageSrc: srcA },
  { title: "On set", imageSrc: srcB },
  { title: "Studio portrait", imageSrc: srcC },
  { title: "Golden hour", imageSrc: srcA },
  { title: "Detail shot", imageSrc: srcB },
  { title: "Wide angle", imageSrc: srcC },
  { title: "Close up", imageSrc: srcA },
  { title: "Final cut", imageSrc: srcB },
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
  argTypes: { variant: { control: "inline-radio", options: ["grid", "featured", "gallery"] } },
} satisfies Meta<typeof Portfolio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// featured = the first item spans two columns as a hero tile.
export const Featured: Story = { args: { variant: "featured" } };

// Every card has a real photo (the third reuses srcA).
export const WithImages: Story = { args: { items: ITEMS_IMG } };

// gallery = image grid with hover captions + a full lightbox (click an image: zoom, drag-swipe, arrows, Esc).
export const Gallery: Story = {
  args: { variant: "gallery", eyebrow: "Gallery", title: "Selected shots", items: GALLERY },
};

// AllVariants — ALWAYS last: EVERY Portfolio example — grid / featured × without / with images, plus gallery.
const ALL = [
  { label: "grid · no images", variant: "grid" as const, items: ITEMS },
  { label: "grid · with images", variant: "grid" as const, items: ITEMS_IMG },
  { label: "featured · no images", variant: "featured" as const, items: ITEMS },
  { label: "featured · with images", variant: "featured" as const, items: ITEMS_IMG },
  { label: "gallery", variant: "gallery" as const, items: GALLERY },
];

// AllVariants — ALWAYS last: the layout variants (featured · with-images · gallery).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col">
      {ALL.map(({ label, variant, items }) => (
        <div key={label}>
          <div className="px-6 pt-6 pb-2">
            <span className="text-caption text-content-tertiary font-mono">{label}</span>
          </div>
          <Portfolio eyebrow="Work" title="Recent projects" variant={variant} items={items} viewAllText="View all" viewAllHref="#" />
        </div>
      ))}
    </div>
  ),
};
