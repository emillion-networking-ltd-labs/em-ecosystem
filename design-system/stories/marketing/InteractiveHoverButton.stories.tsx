import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InteractiveHoverButton } from "@/components/ui/InteractiveHoverButton";

// Marketing/InteractiveHoverButton — CTA whose dot grows on hover to cover the button and reveals the label
// + arrow sliding in. Colors by token (surface-primary base, surface-inverse fill, content-inverse label).
const meta = {
  title: "Marketing/InteractiveHoverButton",
  component: InteractiveHoverButton,
  tags: ["autodocs"],
  args: { children: "Get started" },
} satisfies Meta<typeof InteractiveHoverButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — hover to see the dot expand and the arrow slide in.
export const Default: Story = {};

// Disabled — dimmed, no hover effect.
export const Disabled: Story = { args: { disabled: true, className: "opacity-50 pointer-events-none" } };

// AllVariants — ALWAYS last: the interaction states (hover to see the reveal on `default`).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {[
        { label: "default", props: {} },
        {
          label: "disabled",
          props: { disabled: true, className: "opacity-50 pointer-events-none" },
        },
      ].map(({ label, props }) => (
        <div key={label} className="flex flex-col items-start gap-1.5">
          <InteractiveHoverButton {...props}>Get started</InteractiveHoverButton>
          <span className="text-caption text-content-tertiary font-mono">{label}</span>
        </div>
      ))}
    </div>
  ),
};
