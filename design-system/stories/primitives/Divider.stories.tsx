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

export const WithLabel: Story = {
  args: { label: "or" },
  render: (args) => (
    <div className="w-64">
      <Divider {...args} />
    </div>
  ),
};
