import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RingSpinner from "@/components/ui/RingSpinner";

const meta = {
  title: "Primitives/RingSpinner",
  component: RingSpinner,
  tags: ["autodocs"],
  args: { size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
} satisfies Meta<typeof RingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Claves reales de SIZES (sm=16 / md=24 / lg=32). El SVG hereda el color del
// texto (stroke=currentColor), de ahí el text-content-primary del contenedor.
const SIZES = [
  { size: "lg", px: "32" },
  { size: "md", px: "24" },
  { size: "sm", px: "16" },
] as const;

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6 text-content-primary">
      {SIZES.map(({ size, px }) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <div className="flex h-8 items-center justify-center">
            <RingSpinner size={size} />
          </div>
          <span className="text-caption text-content-tertiary font-mono">
            {size} · {px}px{size === "md" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};
