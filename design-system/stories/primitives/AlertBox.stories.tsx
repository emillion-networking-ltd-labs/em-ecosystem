import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import AlertBox from "@/components/ui/AlertBox";

const meta = {
  title: "Primitives/AlertBox",
  component: AlertBox,
  tags: ["autodocs"],
  args: { variant: "info", children: "Your session expires in 5 minutes." },
  argTypes: {
    variant: { control: "select", options: ["warning", "error", "info", "success"] },
  },
} satisfies Meta<typeof AlertBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Warning: Story = { args: { variant: "warning", children: "Double-check the details." } };
export const Error: Story = { args: { variant: "error", children: "Couldn't save." } };
export const Success: Story = { args: { variant: "success", children: "Changes saved." } };

const variantCopy: Record<"warning" | "error" | "info" | "success", string> = {
  warning: "This action will make your account less secure.",
  error: "Invalid verification code. Please try again.",
  info: "Your email is managed by an external provider.",
  success: "Your changes were saved successfully.",
};

// AllVariants — ALWAYS last: the four semantic variants (warning · error · info · success).
export const AllVariants: Story = {
  render: () => (
    // items-start → cada alerta ajusta a su contenido (AlertBox es inline-flex), sin estirarse.
    <div className="flex flex-col items-start gap-2">
      {(["warning", "error", "info", "success"] as const).map((v) => (
        <AlertBox key={v} variant={v}>
          {variantCopy[v]}
        </AlertBox>
      ))}
    </div>
  ),
};
