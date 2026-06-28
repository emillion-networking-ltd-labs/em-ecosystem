import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EmailSelector from "@/components/ui/EmailSelector";

const meta = {
  title: "Primitives/EmailSelector",
  component: EmailSelector,
  tags: ["autodocs"],
  args: {
    email: "anna.smith@company.com",
    onChangeEmail: () => {},
  },
} satisfies Meta<typeof EmailSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

// EmailSelector has no sizes, variants or disabled/error states: it just shows the email to display
// plus a callback to change it. So a single Default story is enough.
export const Default: Story = {};
