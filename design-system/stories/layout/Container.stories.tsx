import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Container } from "@/components/ui/Container";

const meta = {
  title: "Layout/Container",
  component: Container,
  tags: ["autodocs"],
  args: { size: "lg" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg", "xl", "full"] } },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sizes (widest → narrowest), with the max-width token. lg is the default.
const SIZES = [
  { size: "full", w: "none" },
  { size: "xl", w: "max-w-7xl" },
  { size: "lg", w: "max-w-6xl" },
  { size: "md", w: "max-w-4xl" },
  { size: "sm", w: "max-w-2xl" },
] as const;

const Box = ({ label }: { label: string }) => (
  <div className="rounded-lg border border-border-default bg-surface-secondary px-4 py-3 text-content-secondary">
    {label}
  </div>
);

// Playground — the line length is clamped and centered; horizontal padding is responsive.
export const Default: Story = {
  render: (args) => (
    <Container {...args}>
      <Box label="Content clamped to the measure and centered. Horizontal padding is responsive." />
    </Container>
  ),
};

// AllSizes — each max-width on the full canvas so the difference in measure is visible.
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      {SIZES.map(({ size, w }) => (
        <div key={size} className="space-y-1.5">
          <Container size={size}>
            <Box label={`size="${size}"`} />
          </Container>
          <Container size={size}>
            <span className="text-caption text-content-tertiary font-mono">
              {size} · {w}
              {size === "lg" ? " (default)" : ""}
            </span>
          </Container>
        </div>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: every size stacked, narrowest on top, to compare the measures.
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-3">
      {[...SIZES].reverse().map(({ size, w }) => (
        <Container key={size} size={size}>
          <div className="rounded-lg border border-border-default bg-surface-secondary px-4 py-2 text-center">
            <span className="text-caption text-content-tertiary font-mono">
              {size} · {w}
              {size === "lg" ? " (default)" : ""}
            </span>
          </div>
        </Container>
      ))}
    </div>
  ),
};
