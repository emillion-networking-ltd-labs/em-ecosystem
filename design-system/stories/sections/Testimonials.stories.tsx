import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Testimonials from "@/components/sections/Testimonials";

// Reviews style: avatar + date + star rating + text (a Google-reviews-style wall).
const REVIEWS = [
  { name: "Ava Bennett", role: "2 weeks ago", rating: 5, quote: "From the first call they understood exactly what we needed. The result speaks for itself.", href: "#" },
  { name: "Liam Carter", role: "1 month ago", rating: 5, quote: "Fast, clear and genuinely skilled. We launched ahead of schedule.", href: "#" },
  { name: "Sofia Reyes", role: "1 month ago", rating: 4, quote: "A pleasure to work with — thoughtful, responsive and detail-obsessed.", href: "#" },
  { name: "Noah Patel", role: "2 months ago", rating: 5, quote: "Best team we've worked with. They treat your product like their own.", href: "#" },
  { name: "Mia Fontaine", role: "3 months ago", rating: 5, quote: "Strategy, design and build all under one roof, and all excellent.", href: "#" },
  { name: "Ethan Cole", role: "4 months ago", rating: 4, quote: "Professional from start to finish. Highly recommend.", href: "#" },
];

// Testimonials style: avatar + role + quote, no stars.
const QUOTES = [
  { name: "Ava Bennett", role: "CTO, Atlas", quote: "They understood the brand from the very first call and never lost the thread.", href: "#" },
  { name: "Liam Carter", role: "Founder, Verde", quote: "Fast, clear and genuinely skilled — a rare combination.", href: "#" },
  { name: "Sofia Reyes", role: "Head of Product, Norte", quote: "The best team we've ever worked with.", href: "#" },
];

const meta = {
  title: "Sections/Testimonials",
  component: Testimonials,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Testimonials",
    title: "What people say",
    items: REVIEWS,
    rating: 4.9,
    ratingCount: "128 reviews on Google",
    viewAllText: "Read all reviews",
    viewAllHref: "#reviews",
  },
} satisfies Meta<typeof Testimonials>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — reviews with avatars, star ratings and an aggregate rating header.
export const Default: Story = {};

// Quotes — testimonials with role + quote, no stars, no aggregate rating.
export const Quotes: Story = {
  args: {
    eyebrow: "Testimonials",
    title: "Trusted by teams",
    items: QUOTES,
    rating: undefined,
    ratingCount: undefined,
    viewAllText: undefined,
    viewAllHref: undefined,
  },
};

// No design-variant axis — reviews (Default, with rating+stars) vs plain quotes are two content modes,
// each its own story. So there is no AllVariants.
