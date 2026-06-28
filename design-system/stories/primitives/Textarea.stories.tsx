import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Textarea from "@/components/ui/Textarea";

const meta = {
  title: "Primitives/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: { placeholder: "Tell us about your project…", rows: 4 },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-96">
      <Textarea {...args} />
    </div>
  ),
};

// hasError — red outline (orchestrated by FormField when the field is invalid).
export const WithError: Story = {
  args: { hasError: true, defaultValue: "Too short" },
  render: (args) => (
    <div className="w-96">
      <Textarea {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Read-only content." },
  render: (args) => (
    <div className="w-96">
      <Textarea {...args} />
    </div>
  ),
};
