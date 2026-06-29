import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SpinnerInfinity from "@/components/ui/SpinnerInfinity";

const meta = {
  title: "Primitives/SpinnerInfinity",
  component: SpinnerInfinity,
  tags: ["autodocs"],
  args: { size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["md", "lg"] } },
} satisfies Meta<typeof SpinnerInfinity>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Only md/lg: at sm the figure-8 is too small to read the animation. Largest → smallest.
// The SVG inherits text color (stroke=currentColor) → text-content-primary on the container.
const SIZES = [
  { size: "lg", px: "32" },
  { size: "md", px: "24" },
] as const;

// AllSizes — the spinner sizes (md/lg), with px.
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6 text-content-primary">
      {SIZES.map(({ size, px }) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <div className="flex h-8 items-center justify-center">
            <SpinnerInfinity size={size} />
          </div>
          <span className="text-caption text-content-tertiary font-mono">
            {size} · {px}px{size === "md" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: an overview walking every axis (size is a spinner's only one).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">sizes</p>
        <div className="flex flex-wrap items-end gap-6 text-content-primary">
          {SIZES.map(({ size, px }) => (
            <div key={size} className="flex flex-col items-center gap-1.5">
              <div className="flex h-8 items-center justify-center">
                <SpinnerInfinity size={size} />
              </div>
              <span className="text-caption text-content-tertiary font-mono">
                {size} · {px}px{size === "md" ? " (default)" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};
