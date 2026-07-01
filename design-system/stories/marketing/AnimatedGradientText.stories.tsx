import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnimatedGradientText } from "@/components/ui/AnimatedGradientText";
import { DemoCard } from "../_kit";

// Magic UI (MIT), adopted verbatim in ECO-82. Requires the `gradient` keyframe (tokens.css).
// A single Default using the BRAND gradient (accent → accent-2): this component's whole point is the brand
// gradient text, so the default IS the brand colours. Themed per satellite via the accent tokens. No AllVariants.
const meta = {
  title: "Marketing/AnimatedGradientText",
  component: AnimatedGradientText,
  tags: ["autodocs"],
  args: {
    children: "NexaCore",
    speed: 1,
    colorFrom: "var(--color-accent)",
    colorTo: "var(--color-accent-2)",
  },
} satisfies Meta<typeof AnimatedGradientText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <span className="text-display-2 font-display">
        <AnimatedGradientText {...args} />
      </span>
    </DemoCard>
  ),
};
