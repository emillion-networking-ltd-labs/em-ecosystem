import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EmailSelector from "@/components/ui/EmailSelector";

const meta = {
  title: "Primitives/EmailSelector",
  component: EmailSelector,
  tags: ["autodocs"],
  args: {
    email: "ana.garcia@empresa.com",
    onChangeEmail: () => {},
  },
} satisfies Meta<typeof EmailSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
