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

// EmailSelector just shows the email to display plus a callback to change it (no sizes/variants).
export const Default: Story = {};

// AllVariants — ALWAYS last: the selector with a short and a long email (its only real variation).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">short email</p>
        <EmailSelector email="anna.smith@company.com" onChangeEmail={() => {}} />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">long email</p>
        <EmailSelector
          email="alexandra.washington@verylongcompanyname.io"
          onChangeEmail={() => {}}
        />
      </div>
    </div>
  ),
};
