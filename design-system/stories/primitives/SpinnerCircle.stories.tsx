import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SpinnerCircle from "@/components/ui/SpinnerCircle";

const meta = {
  title: "Primitives/SpinnerCircle",
  component: SpinnerCircle,
  tags: ["autodocs"],
  args: { size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
} satisfies Meta<typeof SpinnerCircle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// The 3 real `sizeClasses` keys (sm/md/lg), ordered and labeled with their
// px as in ComponentShowcase (16/24/32 — md is the default).
const SIZES = [
  { size: "lg", px: "32" },
  { size: "md", px: "24" },
  { size: "sm", px: "16" },
] as const;

// AllSizes — the 3 spinner sizes (sm/md/lg), with px.
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      {SIZES.map(({ size, px }) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <div className="flex h-8 items-center justify-center">
            <SpinnerCircle size={size} />
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
        <div className="flex flex-wrap items-end gap-6">
          {SIZES.map(({ size, px }) => (
            <div key={size} className="flex flex-col items-center gap-1.5">
              <div className="flex h-8 items-center justify-center">
                <SpinnerCircle size={size} />
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
