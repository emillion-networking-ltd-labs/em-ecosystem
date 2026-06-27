import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bell } from "lucide-react";
import IconButton from "@/components/ui/IconButton";

const meta = {
  title: "Primitives/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  args: {
    variant: "default",
    size: "sm",
    "aria-label": "Notifications",
    children: <Bell size={16} />,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "danger", "boxed", "boxed-hover"],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
    loading: { control: "boolean" },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["default", "danger", "boxed", "boxed-hover"] as const).map((v) => (
        <IconButton key={v} variant={v} aria-label={v}>
          <Bell size={16} />
        </IconButton>
      ))}
    </div>
  ),
};
