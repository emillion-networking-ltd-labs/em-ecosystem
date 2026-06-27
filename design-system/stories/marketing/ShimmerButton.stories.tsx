import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ShimmerButton } from "@/components/ui/ShimmerButton";

// Magic UI (MIT), adoptado verbatim en ECO-82.
const meta = {
  title: "Marketing/ShimmerButton",
  component: ShimmerButton,
  tags: ["autodocs"],
  args: {
    children: "Empezar ahora",
    shimmerDuration: "3s",
  },
} satisfies Meta<typeof ShimmerButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Brand: Story = {
  args: {
    children: "Reservar demo",
    background: "var(--color-accent)",
    shimmerColor: "#ffffff",
  },
};
