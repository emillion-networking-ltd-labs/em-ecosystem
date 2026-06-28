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

// Las tres claves reales de `sizeClasses` (sm/md/lg), ordenadas y etiquetadas
// con sus px como en ComponentShowcase (16/24/32 — md es el default).
const SIZES = [
  { size: "lg", px: "32" },
  { size: "md", px: "24" },
  { size: "sm", px: "16" },
] as const;

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
