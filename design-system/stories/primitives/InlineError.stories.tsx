import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import InlineError from "@/components/ui/InlineError";

const meta = {
  title: "Primitives/InlineError",
  component: InlineError,
  tags: ["autodocs"],
  args: {
    message: "Enter a valid email address",
  },
} satisfies Meta<typeof InlineError>;

export default meta;
type Story = StoryObj<typeof meta>;

// InlineError has no sizes, variants or states: it only takes the message
// (AlertTriangle 16px + text-caption text-error). A single message story is enough.
export const Default: Story = {};

// Long message: it wraps and the icon stays aligned to the FIRST line (items-start + mt-1).
export const LongMessage: Story = {
  render: (args) => (
    <div className="max-w-sm">
      <InlineError
        {...args}
        message="Password must be at least 8 characters and include an uppercase letter and a number."
      />
    </div>
  ),
};

// AllVariants — ALWAYS last: an overview walking every axis (default · long message).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5 max-w-sm">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">default</p>
        <InlineError message="Enter a valid email address" />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">long message</p>
        <InlineError message="Password must be at least 8 characters and include an uppercase letter and a number." />
      </div>
    </div>
  ),
};
