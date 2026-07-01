import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { DemoCard } from "../_kit";

// Magic UI (MIT), adopted verbatim in ECO-82. Requires the `shimmer-slide` / `spin-around` keyframes (tokens.css).
// A single Default (upstream fill). The accent-driven "Brand" variant is dropped — accent is a placeholder
// brand colour, not real; theming happens per satellite, not as a showcased variant. So no AllVariants.
const meta = {
  title: "Marketing/ShimmerButton",
  component: ShimmerButton,
  tags: ["autodocs"],
  args: {
    children: "Get started",
    shimmerDuration: "3s",
  },
} satisfies Meta<typeof ShimmerButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <ShimmerButton {...args} />
    </DemoCard>
  ),
};
