import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import EmailSelector from "@/components/ui/EmailSelector";
import { DemoCard } from "../_kit";

const meta = {
  title: "Migration/FormField",
  component: FormField,
  tags: ["autodocs"],
  args: {
    label: "Full name",
    htmlFor: "name",
    children: <Input id="name" placeholder="Type your name" />,
  },
  // Full-width card, the field centered at a form width inside it.
  render: (args) => (
    <DemoCard>
      <div className="w-96">
        <FormField {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

// FormField has no design-variant axis — its axes are states (required / error), each its own story, plus a
// realistic Form composition. So there is no AllVariants.

// Default — playground.
export const Default: Story = {};

export const Required: Story = {
  args: {
    label: "Email",
    required: true,
    htmlFor: "email",
    children: <Input id="email" placeholder="name@company.com" />,
  },
};

// On error the label turns red (general rule across inputs) + the InlineError shows below.
export const WithError: Story = {
  args: {
    label: "Email",
    error: "This field is required",
    htmlFor: "email-error",
    children: <Input id="email-error" placeholder="name@company.com" hasError />,
  },
};

// Form — FormField wraps ANY control (Input, EmailSelector, …). A realistic form: several fields stacked,
// including required and error states.
export const Form: Story = {
  render: () => (
    <DemoCard>
      <div className="flex w-96 flex-col gap-4">
        <FormField label="Full name" htmlFor="f-name">
          <Input id="f-name" placeholder="Type your name" />
        </FormField>
        <FormField label="Email">
          <EmailSelector email="user@example.com" onChangeEmail={() => {}} />
        </FormField>
        <FormField label="Password" htmlFor="f-pass" required>
          <Input id="f-pass" type="password" placeholder="At least 8 characters" />
        </FormField>
        <FormField label="Confirm password" htmlFor="f-confirm" error="Passwords don't match">
          <Input id="f-confirm" type="password" hasError />
        </FormField>
      </div>
    </DemoCard>
  ),
};
