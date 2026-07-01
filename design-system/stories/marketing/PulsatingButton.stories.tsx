import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PulsatingButton } from "@/components/ui/PulsatingButton";
import { DemoCard } from "../_kit";

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
export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <PulsatingButton {...args} />
    </DemoCard>
  ),
};

// Disabled — no pulse interaction; dimmed.
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <DemoCard>
      <PulsatingButton {...args} />
    </DemoCard>
  ),
};
