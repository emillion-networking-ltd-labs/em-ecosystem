import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Tooltip from "@/components/ui/Tooltip";

const triggerClass =
  "rounded-lg border border-border-components bg-surface-primary px-4 py-2 text-body text-content-primary";

const meta = {
  title: "Primitives/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  args: {
    content: "Hover to see more details.",
    position: "top",
    children: (
      <button type="button" className={triggerClass}>
        Hover me
      </button>
    ),
  },
  argTypes: {
    position: {
      control: "select",
      options: ["top", "bottom", "left", "right", "auto"],
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Centered with room so the (top) tooltip isn't clipped by the canvas edge.
export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="flex min-h-[200px] items-center justify-center">
        <Story />
      </div>
    ),
  ],
};

// auto — genuinely adapts to the nearest viewport edge. The trigger sits near the TOP (centered
// horizontally), so there's no room above and auto opens it BELOW. Move a trigger near another edge
// and it flips accordingly — that's the whole point of auto.
export const Auto: Story = {
  render: () => (
    <div className="flex justify-center pt-1">
      <Tooltip position="auto" content="No room above → auto opens below.">
        <button type="button" className={triggerClass}>
          Hover me (near the top edge)
        </button>
      </Tooltip>
    </div>
  ),
};

// AllVariants — ALWAYS last: the four fixed positions, with room around the row so none clip.
export const AllVariants: Story = {
  render: () => (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 px-20">
      {(["top", "bottom", "left", "right"] as const).map((pos) => (
        <Tooltip key={pos} content={`Tooltip ${pos}`} position={pos}>
          <button type="button" className={triggerClass}>
            {pos.charAt(0).toUpperCase() + pos.slice(1)}
          </button>
        </Tooltip>
      ))}
    </div>
  ),
};
