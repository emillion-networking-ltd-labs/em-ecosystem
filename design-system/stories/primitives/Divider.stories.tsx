import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Divider from "@/components/ui/Divider";

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

export const Default: Story = {
  render: (args) => (
    <div className="w-64">
      <Divider {...args} />
    </div>
  ),
};

// Label dividers render the label UPPERCASE (eyebrow style).
export const WithLabel: Story = {
  args: { label: "or" },
  render: (args) => (
    <div className="w-64">
      <Divider {...args} />
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div className="flex h-16 items-center gap-3">
      <p className="text-body text-content-tertiary">Left</p>
      <Divider {...args} />
      <p className="text-body text-content-tertiary">Right</p>
    </div>
  ),
};

export const VerticalWithLabel: Story = {
  args: { orientation: "vertical", label: "or" },
  render: (args) => (
    <div className="flex h-16 items-center gap-3">
      <p className="text-body text-content-tertiary">Left</p>
      <Divider {...args} />
      <p className="text-body text-content-tertiary">Right</p>
    </div>
  ),
};

// AllVariants — ALWAYS last: horizontal and vertical dividers, with and without a label.
export const AllVariants: Story = {
  render: () => (
    <div className="w-64 space-y-6">
      <div className="space-y-4">
        <p className="text-body text-content-tertiary">Content above</p>
        <Divider />
        <p className="text-body text-content-tertiary">Content below</p>
      </div>
      <div className="space-y-4">
        <p className="text-body text-content-tertiary">Content above</p>
        <Divider label="or" />
        <p className="text-body text-content-tertiary">Content below</p>
      </div>
      <div className="flex items-center gap-6 h-16">
        <div className="flex items-center gap-3 h-full">
          <p className="text-body text-content-tertiary">Left</p>
          <Divider orientation="vertical" />
          <p className="text-body text-content-tertiary">Right</p>
        </div>
        <div className="flex items-center gap-3 h-full">
          <p className="text-body text-content-tertiary">Left</p>
          <Divider orientation="vertical" label="or" />
          <p className="text-body text-content-tertiary">Right</p>
        </div>
      </div>
    </div>
  ),
};
