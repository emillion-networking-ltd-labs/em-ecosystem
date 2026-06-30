import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import Card from "@/components/ui/Card";

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
    <Card className="flex min-h-[140px] items-center justify-center">
      <ShimmerButton {...args} />
    </Card>
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
    <Card className="flex min-h-[140px] items-center justify-center">
      <ShimmerButton {...args} />
    </Card>
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
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
          <Card className="flex min-h-[140px] items-center justify-center">{v.node}</Card>
        </div>
      ))}
    </div>
  ),
};
