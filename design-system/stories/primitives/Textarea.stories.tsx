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

// AllVariants — ALWAYS last: an overview walking every axis (states: default · with-error · disabled).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5 w-96">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">default</p>
        <Textarea placeholder="Tell us about your project…" />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">with error</p>
        <Textarea hasError defaultValue="Too short" />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">disabled</p>
        <Textarea disabled defaultValue="Read-only content." />
      </div>
    </div>
  ),
};
