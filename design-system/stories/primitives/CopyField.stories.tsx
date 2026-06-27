import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CopyField from "@/components/ui/CopyField";

const meta = {
  title: "Primitives/CopyField",
  component: CopyField,
  tags: ["autodocs"],
  args: {
    value: "https://nexacore.app/invite/ab12cd34",
    size: "md",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof CopyField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
