import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CopyCell from "@/components/ui/CopyCell";
import { DemoCard } from "../_kit";

const meta = {
  title: "Migration/CopyCell",
  component: CopyCell,
  tags: ["autodocs"],
  args: {
    value: "user_2fA9kQ2xY",
    maxWidth: "max-w-[200px]",
    className: "text-body text-content-secondary",
  },
  render: (args) => (
    // CopyCell clamps its hover tooltip to the nearest `.card-flat` ancestor, so demo it inside one.
    <DemoCard>
      <div className="card-flat w-80 p-4">
        <CopyCell {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof CopyCell>;

export default meta;
type Story = StoryObj<typeof meta>;

// No design-variant or size axis — the cell is a fixed interaction (truncate + hover tooltip + click to
// copy) parameterised only by value / maxWidth. The "Copied!" state is transient (resets after 1.5s) and
// is exercised via interaction. So there is no AllVariants / AllSizes.

// Default — a short-ish id that fits; hover to reveal, click to copy.
export const Default: Story = {};

// Truncated — a long value clipped by maxWidth; the hover tooltip shows it in full.
export const Truncated: Story = {
  args: {
    value: "audit_log_7f3c9b1e-4a2d-4c8e-9f1a-2b6d8e0c4a11",
    maxWidth: "max-w-[160px]",
    className: "text-body font-normal text-content-primary",
  },
};

// Empty — a value of "—" renders as a plain dash (nothing to copy).
export const Empty: Story = {
  args: {
    value: "—",
    maxWidth: "max-w-[160px]",
  },
};
