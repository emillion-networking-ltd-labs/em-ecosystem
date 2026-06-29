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

// AllVariants — ALWAYS last: the idle warning with its live countdown (a single modal state).
export const AllVariants: Story = {
  render: () => (
    <>
      <p className="fixed left-4 top-4 z-[60] text-caption text-content-tertiary font-mono">
        idle warning — full-screen modal with a live countdown
      </p>
      <IdleWarningModal secondsLeft={60} onKeepAlive={() => {}} />
    </>
  ),
};
