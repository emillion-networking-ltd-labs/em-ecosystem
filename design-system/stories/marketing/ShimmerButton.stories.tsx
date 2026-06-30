import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { DemoCard, Variants } from "../_kit";

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

export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <ShimmerButton {...args} />
    </DemoCard>
  ),
};

// Brand — drive the fill from the accent token instead of the upstream black default.
export const Brand: Story = {
  args: {
    children: "Book a demo",
    background: "var(--color-accent)",
    shimmerColor: "#ffffff",
  },
  render: (args) => (
    <DemoCard>
      <ShimmerButton {...args} />
    </DemoCard>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, Brand) — one project Card each, name above.
const VARIANTS = [
  { label: "Default", node: <ShimmerButton shimmerDuration="3s">Get started</ShimmerButton> },
  {
    label: "Brand",
    node: (
      <ShimmerButton background="var(--color-accent)" shimmerColor="#ffffff">
        Book a demo
      </ShimmerButton>
    ),
  },
];

export const AllVariants: Story = {
  render: () => <Variants items={VARIANTS} />,
};
