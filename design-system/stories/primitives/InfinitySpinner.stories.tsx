import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import InfinitySpinner from "@/components/ui/InfinitySpinner";

const meta = {
  title: "Primitives/InfinitySpinner",
  component: InfinitySpinner,
  tags: ["autodocs"],
  args: { size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["md", "lg"] } },
} satisfies Meta<typeof InfinitySpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Only md/lg: at sm the figure-8 is too small to read the animation. Largest → smallest.
// The SVG inherits text color (stroke=currentColor) → text-content-primary on the container.
const SIZES = [
  { size: "lg", px: "32" },
  { size: "md", px: "24" },
] as const;

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6 text-content-primary">
      {SIZES.map(({ size, px }) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <div className="flex h-8 items-center justify-center">
            <InfinitySpinner size={size} />
          </div>
          <span className="text-caption text-content-tertiary font-mono">
            {size} · {px}px{size === "md" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};
