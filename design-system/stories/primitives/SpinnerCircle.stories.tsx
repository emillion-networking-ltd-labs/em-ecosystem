import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SpinnerCircle from "@/components/ui/SpinnerCircle";
import { DemoCard, Sizes } from "../_kit";

const meta = {
  title: "Migration/SpinnerCircle",
  component: SpinnerCircle,
  tags: ["autodocs"],
  args: { size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
} satisfies Meta<typeof SpinnerCircle>;

export default meta;
type Story = StoryObj<typeof meta>;

// The 3 real sizeClasses keys (sm/md/lg), with px (16/24/32 — md is the default).
const SIZES = [
  { size: "lg", px: "32" },
  { size: "md", px: "24" },
  { size: "sm", px: "16" },
] as const;

// Default — playground: the spinner; change its size from the Controls.
export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <SpinnerCircle {...args} />
    </DemoCard>
  ),
};

// AllSizes — the 3 spinner sizes (sm/md/lg), with px. Last: a spinner's only axis is size (no AllVariants).
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ size, px }) => ({
        label: `${size} · ${px}px${size === "md" ? " (default)" : ""}`,
        node: <SpinnerCircle size={size} />,
      }))}
    />
  ),
};
