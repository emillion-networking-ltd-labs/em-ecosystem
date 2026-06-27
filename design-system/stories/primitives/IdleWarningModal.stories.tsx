import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import IdleWarningModal from "@/components/ui/IdleWarningModal";

const meta = {
  title: "Primitives/IdleWarningModal",
  component: IdleWarningModal,
  tags: ["autodocs"],
  args: {
    secondsLeft: 60,
    onKeepAlive: () => {},
  },
} satisfies Meta<typeof IdleWarningModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
