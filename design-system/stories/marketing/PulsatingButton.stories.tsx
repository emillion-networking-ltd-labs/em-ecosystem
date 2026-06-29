import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PulsatingButton } from "@/components/ui/PulsatingButton";

// Marketing/PulsatingButton — CTA that "breathes": an overlay inherits the button background and pulses
// (animate-pulse). Uses the brand button colors (surface-inverse / content-inverse), like Button primary.
const meta = {
  title: "Marketing/PulsatingButton",
  component: PulsatingButton,
  tags: ["autodocs"],
  args: { children: "Get started" },
} satisfies Meta<typeof PulsatingButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — pulsing CTA.
export const Default: Story = {};

// Disabled — no pulse interaction; dimmed.
export const Disabled: Story = { args: { disabled: true } };

// AllVariants — ALWAYS last: states + pulse speed (the `duration` of the breathing overlay).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {[
        { label: "default · 1.5s", props: {} },
        { label: "fast · 1s", props: { duration: "1s" } },
        { label: "disabled", props: { disabled: true } },
      ].map(({ label, props }) => (
        <div key={label} className="flex flex-col items-start gap-1.5">
          <PulsatingButton {...props}>Get started</PulsatingButton>
          <span className="text-caption text-content-tertiary font-mono">{label}</span>
        </div>
      ))}
    </div>
  ),
};
