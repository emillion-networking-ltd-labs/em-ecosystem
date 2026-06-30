import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InteractiveHoverButton } from "@/components/ui/InteractiveHoverButton";
import Card from "@/components/ui/Card";

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
export const Default: Story = {
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <InteractiveHoverButton {...args} />
    </Card>
  ),
};

// Disabled — dimmed, no hover effect.
export const Disabled: Story = {
  args: { disabled: true, className: "opacity-50 pointer-events-none" },
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <InteractiveHoverButton {...args} />
    </Card>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, Disabled) — one project Card each, name above.
const VARIANTS = [
  { label: "Default", node: <InteractiveHoverButton>Get started</InteractiveHoverButton> },
  {
    label: "Disabled",
    node: (
      <InteractiveHoverButton disabled className="opacity-50 pointer-events-none">
        Get started
      </InteractiveHoverButton>
    ),
  },
];

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
          <Card className="flex min-h-[140px] items-center justify-center">{v.node}</Card>
        </div>
      ))}
    </div>
  ),
};
