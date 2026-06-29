import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { DemoCell, DemoStack } from "./_frame";

// Magic UI (MIT), adopted verbatim in ECO-82. Requires the `shimmer-slide` / `spin-around` keyframes (tokens.css).
// background / shimmerColor default to the upstream values (rgba(0,0,0,1) + #ffffff) — respected in Default.
const meta = {
  title: "Marketing/ShimmerButton",
  component: ShimmerButton,
  tags: ["autodocs"],
  args: {
    children: "Get started",
    shimmerDuration: "3s",
  },
} satisfies Meta<typeof ShimmerButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Brand — drive the fill from the accent token instead of the upstream black default.
export const Brand: Story = {
  args: {
    children: "Book a demo",
    background: "var(--color-accent)",
    shimmerColor: "#ffffff",
  },
};

// AllVariants — ALWAYS last: the real props (background, shimmerDuration, borderRadius).
const VARIANTS = [
  { label: "default · 3s · pill", props: { children: "Get started", shimmerDuration: "3s" } },
  { label: "brand fill (--color-accent)", props: { children: "Book a demo", background: "var(--color-accent)", shimmerColor: "#ffffff" } },
  { label: "shimmerDuration 1.5s", props: { children: "Fast shimmer", shimmerDuration: "1.5s" } },
  { label: "borderRadius 12px", props: { children: "Squared", borderRadius: "12px" } },
] as const;

export const AllVariants: Story = {
  render: () => (
    <DemoStack>
      {VARIANTS.map((v) => (
        <DemoCell key={v.label} caption={v.label}>
          <ShimmerButton {...v.props} />
        </DemoCell>
      ))}
    </DemoStack>
  ),
};
