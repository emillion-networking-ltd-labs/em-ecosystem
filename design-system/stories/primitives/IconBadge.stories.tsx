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

export const AllVariants: Story = {
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

// sm → 32px (icon 16) · md → 40px (icon 24) · lg → 56px (icon 32)
export const AllSizes: Story = {
  render: () => {
    const iconSize = { sm: 16, md: 24, lg: 32 } as const;
    return (
      <div className="flex items-center gap-3">
        {(["sm", "md", "lg"] as const).map((s) => (
          <IconBadge key={s} variant="info" size={s}>
            <Bell size={iconSize[s]} />
          </IconBadge>
        ))}
      </div>
    );
  },
};
