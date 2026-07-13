import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import IdleWarningModal from "@/components/ui/IdleWarningModal";

const meta = {
  title: "Migration/IdleWarningModal",
  component: IdleWarningModal,
  tags: ["autodocs"],
  args: {
    secondsLeft: 60,
    onKeepAlive: () => {},
  },
} satisfies Meta<typeof IdleWarningModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// A single full-screen modal state (live countdown) — no design-variant/size axis, so no AllVariants.
export const Default: Story = {};
