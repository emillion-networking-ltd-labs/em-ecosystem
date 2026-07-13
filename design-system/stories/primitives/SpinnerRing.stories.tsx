import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SpinnerRing from "@/components/ui/SpinnerRing";
import { DemoCard, Sizes } from "../_kit";

const meta = {
  title: "Migration/SpinnerRing",
  component: SpinnerRing,
  tags: ["autodocs"],
  args: { size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
} satisfies Meta<typeof SpinnerRing>;

export default meta;
type Story = StoryObj<typeof meta>;

// Real sizeClasses keys (sm=16 / md=24 / lg=32). The SVG inherits the text color (stroke=currentColor),
// hence text-content-primary on the card.
const SIZES = [
  { size: "lg", px: "32" },
  { size: "md", px: "24" },
  { size: "sm", px: "16" },
] as const;

// Default — playground: the spinner; change its size from the Controls.
export const Default: Story = {
  render: (args) => (
    <DemoCard className="text-content-primary">
      <SpinnerRing {...args} />
    </DemoCard>
  ),
};

// AllSizes — the 3 spinner sizes (sm/md/lg), with px. Last: a spinner's only axis is size (no AllVariants).
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ size, px }) => ({
        label: `${size} · ${px}px${size === "md" ? " (default)" : ""}`,
        className: "text-content-primary",
        node: <SpinnerRing size={size} />,
      }))}
    />
  ),
};
