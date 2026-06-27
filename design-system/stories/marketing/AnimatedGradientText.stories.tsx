import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnimatedGradientText } from "@/components/ui/AnimatedGradientText";

// Magic UI (MIT), adoptado verbatim en ECO-82. Requiere el keyframe `gradient` (tokens.css).
const meta = {
  title: "Marketing/AnimatedGradientText",
  component: AnimatedGradientText,
  tags: ["autodocs"],
  args: {
    children: "NexaCore",
    speed: 1,
    colorFrom: "#ffaa40",
    colorTo: "#9c40ff",
  },
} satisfies Meta<typeof AnimatedGradientText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <span className="text-display-2 font-display">
      <AnimatedGradientText {...args} />
    </span>
  ),
};

export const BrandColors: Story = {
  args: { colorFrom: "#1b5e20", colorTo: "#2e7d32", children: "Diseño con marca" },
};
