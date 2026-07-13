import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import InlineError from "@/components/ui/InlineError";
import { DemoCard } from "../_kit";

const meta = {
  title: "Migration/InlineError",
  component: InlineError,
  tags: ["autodocs"],
  args: {
    message: "Enter a valid email address.",
  },
  render: (args) => (
    <DemoCard>
      <div className="max-w-sm">
        <InlineError {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof InlineError>;

export default meta;
type Story = StoryObj<typeof meta>;

// InlineError has no size/variant/state axis: it only takes the message (AlertTriangle 16px +
// text-caption text-error). So there is no AllVariants — just the message and its long-message wrap.

// Default — a single-line message.
export const Default: Story = {};

// Long message: it wraps and the icon stays aligned to the FIRST line (items-start + mt-1).
export const LongMessage: Story = {
  args: {
    message:
      "Password must be at least 8 characters and include an uppercase letter and a number.",
  },
};
