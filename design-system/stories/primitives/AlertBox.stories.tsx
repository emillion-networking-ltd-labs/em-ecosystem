import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import AlertBox from "@/components/ui/AlertBox";
import { DemoCard, Variants } from "../_kit";

const meta = {
  title: "Primitives/AlertBox",
  component: AlertBox,
  tags: ["autodocs"],
  args: { variant: "info", children: "Your session expires in 5 minutes." },
  argTypes: {
    variant: { control: "select", options: ["warning", "error", "info", "success"] },
  },
  render: (args) => (
    <DemoCard>
      <AlertBox {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof AlertBox>;

export default meta;
type Story = StoryObj<typeof meta>;

// One story per variant (the design axis), before AllVariants groups them.
export const Info: Story = {};
export const Warning: Story = { args: { variant: "warning", children: "Double-check the details." } };
export const Error: Story = { args: { variant: "error", children: "Couldn't save." } };
export const Success: Story = { args: { variant: "success", children: "Changes saved." } };

const VARIANTS = ["warning", "error", "info", "success"] as const;
const variantCopy: Record<(typeof VARIANTS)[number], string> = {
  warning: "This action will make your account less secure.",
  error: "Invalid verification code. Please try again.",
  info: "Your email is managed by an external provider.",
  success: "Your changes were saved successfully.",
};
const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

// AllVariants — ALWAYS last: the four semantic variants, grouping the stories above.
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANTS.map((v) => ({
        label: cap(v),
        node: <AlertBox variant={v}>{variantCopy[v]}</AlertBox>,
      }))}
    />
  ),
};
