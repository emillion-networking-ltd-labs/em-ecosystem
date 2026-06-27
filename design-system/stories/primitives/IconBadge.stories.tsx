import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bell } from "lucide-react";
import IconBadge from "@/components/ui/IconBadge";

const meta = {
  title: "Primitives/IconBadge",
  component: IconBadge,
  tags: ["autodocs"],
  args: {
    variant: "default",
    size: "md",
    children: <Bell size={24} />,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "success", "warning", "error", "info"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof IconBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["default", "success", "warning", "error", "info"] as const).map((v) => (
        <IconBadge key={v} variant={v}>
          <Bell size={24} />
        </IconBadge>
      ))}
    </div>
  ),
};
