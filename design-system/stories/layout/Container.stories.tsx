import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Container } from "@/components/ui/Container";

const meta = {
  title: "Layout/Container",
  component: Container,
  tags: ["autodocs"],
  args: { size: "lg" },
  argTypes: { size: { control: "inline-radio", options: ["prose", "sm", "md", "lg", "xl", "full"] } },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sizes (widest → narrowest), with the max-width token. lg is the default; xl is the canonical marketing width.
const SIZES = [
  { size: "full", w: "none" },
  { size: "xl", w: "1280 · --content-max" },
  { size: "lg", w: "max-w-6xl · 1152" },
  { size: "md", w: "max-w-4xl · 896" },
  { size: "sm", w: "max-w-2xl · 672" },
  { size: "prose", w: "max-w-prose · 65ch" },
] as const;

const Box = ({ label }: { label: string }) => (
  <div className="rounded-lg border border-border-strong bg-surface-secondary px-4 py-3 text-content-secondary">
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

// AllSizes — each max-width on the full canvas so the difference in measure is visible. The text shows how
// the line length clamps as the container narrows (the caption carries the size + token, not the box).
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6">
      {SIZES.map(({ size, w }) => (
        <div key={size} className="space-y-1.5">
          <span className="text-caption text-content-secondary font-mono">
            {size} · {w}
            {size === "lg" ? " (default)" : size === "xl" ? " (canonical)" : ""}
          </span>
          <Container size={size}>
            <Box label="A comfortable reading measure keeps line length in check: the wider the container, the longer each line runs before it wraps and re-centers." />
          </Container>
        </div>
      ))}
    </div>
  ),
};
