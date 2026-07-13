import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Textarea from "@/components/ui/Textarea";
import { DemoCard } from "../_kit";

const meta = {
  title: "Migration/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: { placeholder: "Tell us about your project…", rows: 4 },
  // Full-width card, the field centered at a form width inside it.
  render: (args) => (
    <DemoCard>
      <div className="w-96">
        <Textarea {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

// A Textarea has no design-variant axis (no size axis either) — its axes are visual states, each its own
// story. So there is no AllVariants/AllSizes.

// Default — playground.
export const Default: Story = {};

// hasError — red outline (orchestrated by FormField when the field is invalid).
export const WithError: Story = {
  args: { hasError: true, defaultValue: "Too short" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Read-only content." },
};
