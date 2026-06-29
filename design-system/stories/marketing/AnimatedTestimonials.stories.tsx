import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnimatedTestimonials } from "@/components/ui/AnimatedTestimonials";

// Marketing/AnimatedTestimonials — a testimonial carousel with photo + word-by-word blur-in (social
// proof). Theme-aware (content/surface tokens). Photos here are inline SVG placeholders (no network).
const meta = {
  title: "Marketing/AnimatedTestimonials",
  component: AnimatedTestimonials,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AnimatedTestimonials>;

export default meta;
type Story = StoryObj<typeof meta>;

// Local, network-free placeholder photo (initial on a neutral background).
const photo = (initial: string, bg: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="500" height="500" fill="${bg}"/><text x="50%" y="50%" font-size="220" fill="#ffffff" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${initial}</text></svg>`,
  )}`;

const testimonials = [
  {
    quote:
      "They rebuilt our site in weeks and bookings went up almost immediately. The process was clear at every step.",
    name: "María López",
    designation: "Owner, Estudio Sur",
    src: photo("M", "#6b7280"),
  },
  {
    quote:
      "A team that actually listens. The result feels like us, not a template, and it is fast on every device.",
    name: "Daniel Ruiz",
    designation: "Founder, Norte Clinic",
    src: photo("D", "#475569"),
  },
  {
    quote:
      "Clean, professional and on time. We finally have a site we are proud to send to new clients.",
    name: "Carla Méndez",
    designation: "Director, Atlas Coworking",
    src: photo("C", "#52525b"),
  },
];

export const Default: Story = {
  render: () => <AnimatedTestimonials testimonials={testimonials} />,
};

// Autoplay — rotates every 5s on its own.
export const Autoplay: Story = {
  render: () => <AnimatedTestimonials testimonials={testimonials} autoplay />,
};

// AllVariants — ALWAYS last: the manual and autoplay configurations.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-2 px-4 text-caption text-content-tertiary font-mono">manual (default)</p>
        <AnimatedTestimonials testimonials={testimonials} />
      </div>
      <div>
        <p className="mb-2 px-4 text-caption text-content-tertiary font-mono">autoplay · 5000ms</p>
        <AnimatedTestimonials testimonials={testimonials} autoplay />
      </div>
    </div>
  ),
};
