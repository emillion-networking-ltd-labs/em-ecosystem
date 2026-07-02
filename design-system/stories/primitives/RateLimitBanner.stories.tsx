import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RateLimitBanner from "@/components/ui/RateLimitBanner";
import { DemoCard } from "../_kit";

const meta = {
  title: "Primitives/RateLimitBanner",
  component: RateLimitBanner,
  tags: ["autodocs"],
  args: {
    retryAfter: 30,
    message: "Too many attempts. Try again in a few seconds.",
    kind: "throttle",
  },
  argTypes: {
    kind: { control: "inline-radio", options: ["throttle", "lockout"] },
  },
  render: (args) => (
    <DemoCard>
      <div className="w-full max-w-md">
        <RateLimitBanner {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof RateLimitBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

// A single story: RateLimitBanner has no design-variant or color axis (always error-styled). `kind` only
// swaps the icon (throttle=AlertTriangle / lockout=Lock) and `message`/`retryAfter` are props for its many
// uses — all adjustable from the Controls. So there's nothing to overview.
export const Default: Story = {};
