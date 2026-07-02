import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Tooltip from "@/components/ui/Tooltip";
import { DemoCard, Variants } from "../_kit";

const triggerClass =
  "rounded-lg border border-border-components bg-surface-primary px-4 py-2 text-body text-content-primary";

const meta = {
  title: "Primitives/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  args: {
    content: "Hover to see more details.",
    position: "top",
    // Must be a real DOM element: Tooltip cloneElement()s the child to attach hover + a ref.
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
  // The tooltip renders in a portal (fixed), so the DemoCard never clips it. min-h gives the (top) tooltip
  // room so it isn't cut by the canvas edge. `auto` (flips to the free viewport edge) is on the control.
  render: (args) => (
    <DemoCard>
      <div className="flex min-h-[120px] items-center justify-center">
        <Tooltip {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — playground: hover the trigger; change the position (incl. `auto`) from the controls.
export const Default: Story = {};

const POSITIONS = ["top", "bottom", "left", "right"] as const;
const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

// Positions — the four fixed placements (a placement parameter, not a design variant), each in its own card
// with room so the tooltip reads. Hover each trigger.
export const Positions: Story = {
  render: () => (
    <Variants
      items={POSITIONS.map((pos) => ({
        label: cap(pos),
        node: (
          <div className="flex min-h-[80px] items-center justify-center px-10">
            <Tooltip content={`Tooltip ${pos}`} position={pos}>
              <button type="button" className={triggerClass}>
                Hover me
              </button>
            </Tooltip>
          </div>
        ),
      }))}
    />
  ),
};
