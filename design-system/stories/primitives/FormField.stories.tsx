import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import EmailSelector from "@/components/ui/EmailSelector";
import Card from "@/components/ui/Card";

const meta = {
  title: "Primitives/FormField",
  component: FormField,
  tags: ["autodocs"],
  args: {
    label: "Full name",
    htmlFor: "name",
    children: <Input id="name" placeholder="Type your name" />,
  },
  // Constrain in the catalog so fields don't stretch across the full-bleed canvas.
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

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

// FormField wraps ANY control (Input, EmailSelector, …). A realistic form: several fields stacked
// in a Card, including required and error states.
export const Form: Story = {
  render: () => (
    <Card className="flex flex-col gap-4">
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
    </Card>
  ),
};

// AllVariants — ALWAYS last: an overview walking every axis (states · required · error).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5 max-w-md">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">default</p>
        <FormField label="Full name" htmlFor="av-default">
          <Input id="av-default" placeholder="Type your name" />
        </FormField>
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">required</p>
        <FormField label="Email" htmlFor="av-required" required>
          <Input id="av-required" placeholder="name@company.com" />
        </FormField>
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">with error</p>
        <FormField label="Email" htmlFor="av-error" error="This field is required">
          <Input id="av-error" placeholder="name@company.com" hasError />
        </FormField>
      </div>
    </div>
  ),
};
