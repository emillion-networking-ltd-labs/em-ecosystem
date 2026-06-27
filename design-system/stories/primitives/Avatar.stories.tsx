import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Avatar from "@/components/ui/Avatar";

const meta = {
  title: "Primitives/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  args: { name: "Ada Lovelace", size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["sm", "md", "lg"] as const).map((s) => (
        <Avatar key={s} name="Ada Lovelace" size={s} />
      ))}
    </div>
  ),
};
