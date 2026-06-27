import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CountdownTimer from "@/components/ui/CountdownTimer";

const meta = {
  title: "Primitives/CountdownTimer",
  component: CountdownTimer,
  tags: ["autodocs"],
  args: { seconds: 120, variant: "error", size: "sm" },
  argTypes: {
    variant: { control: "inline-radio", options: ["error", "warning"] },
    size: { control: "inline-radio", options: ["sm", "lg"] },
  },
} satisfies Meta<typeof CountdownTimer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = {
  args: { seconds: 95, variant: "warning", size: "lg" },
};
