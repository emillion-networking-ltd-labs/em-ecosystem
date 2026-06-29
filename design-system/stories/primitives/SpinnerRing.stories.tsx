import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SpinnerRing from "@/components/ui/SpinnerRing";

const meta = {
  title: "Primitives/SpinnerRing",
  component: SpinnerRing,
  tags: ["autodocs"],
  args: { size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
} satisfies Meta<typeof SpinnerRing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Real SIZES keys (sm=16 / md=24 / lg=32). The SVG inherits the text color
// (stroke=currentColor), hence text-content-primary on the container.
const SIZES = [
  { size: "lg", px: "32" },
  { size: "md", px: "24" },
  { size: "sm", px: "16" },
] as const;

// AllSizes — the 3 spinner sizes (sm/md/lg), with px.
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6 text-content-primary">
      {SIZES.map(({ size, px }) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <div className="flex h-8 items-center justify-center">
            <SpinnerRing size={size} />
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
                <SpinnerRing size={size} />
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
