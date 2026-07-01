import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Divider from "@/components/ui/Divider";
import { DemoCard } from "../_kit";

const meta = {
  title: "Primitives/Divider",
  component: Divider,
  tags: ["autodocs"],
  args: {},
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

// A Divider has no design-variant/size axis — its axes are orientation (h/v) and an optional label, each
// its own story. So there is no AllVariants. Content around each divider shows what it separates.

// Default — horizontal, between two blocks of content.
export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <div className="w-64 space-y-4">
        <p className="text-body text-content-tertiary">Content above</p>
        <Divider {...args} />
        <p className="text-body text-content-tertiary">Content below</p>
      </div>
    </DemoCard>
  ),
};

// Label dividers render the label UPPERCASE (eyebrow style).
export const WithLabel: Story = {
  args: { label: "or" },
  render: (args) => (
    <DemoCard>
      <div className="w-64 space-y-4">
        <p className="text-body text-content-tertiary">Content above</p>
        <Divider {...args} />
        <p className="text-body text-content-tertiary">Content below</p>
      </div>
    </DemoCard>
  ),
};

// Vertical — separates content left/right.
export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <DemoCard>
      <div className="flex h-16 items-center gap-3">
        <p className="text-body text-content-tertiary">Content left</p>
        <Divider {...args} />
        <p className="text-body text-content-tertiary">Content right</p>
      </div>
    </DemoCard>
  ),
};

export const VerticalWithLabel: Story = {
  args: { orientation: "vertical", label: "or" },
  render: (args) => (
    <DemoCard>
      <div className="flex h-16 items-center gap-3">
        <p className="text-body text-content-tertiary">Content left</p>
        <Divider {...args} />
        <p className="text-body text-content-tertiary">Content right</p>
      </div>
    </DemoCard>
  ),
};
