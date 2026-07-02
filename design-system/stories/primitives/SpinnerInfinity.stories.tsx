import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SpinnerInfinity from "@/components/ui/SpinnerInfinity";
import { DemoCard, Sizes } from "../_kit";

const meta = {
  title: "Primitives/SpinnerInfinity",
  component: SpinnerInfinity,
  tags: ["autodocs"],
  args: { size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["md", "lg"] } },
} satisfies Meta<typeof SpinnerInfinity>;

export default meta;
type Story = StoryObj<typeof meta>;

// Only md/lg: at sm the figure-8 is too small to read the animation. Largest → smallest. The SVG inherits
// the text color (stroke=currentColor), hence text-content-primary on the card.
const SIZES = [
  { size: "lg", px: "32" },
  { size: "md", px: "24" },
] as const;

// Default — playground: the spinner; change its size from the Controls.
export const Default: Story = {
  render: (args) => (
    <DemoCard className="text-content-primary">
      <SpinnerInfinity {...args} />
    </DemoCard>
  ),
};

// AllSizes — the spinner sizes (md/lg), with px. Last: a spinner's only axis is size (no AllVariants).
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ size, px }) => ({
        label: `${size} · ${px}px${size === "md" ? " (default)" : ""}`,
        className: "text-content-primary",
        node: <SpinnerInfinity size={size} />,
      }))}
    />
  ),
};
