import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Toggle from "@/components/ui/Toggle";

const meta = {
  title: "Primitives/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  args: { label: "Notificaciones", size: "md" },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [on, setOn] = useState(true);
    return <Toggle {...args} checked={on} onChange={setOn} />;
  },
};

export const Disabled: Story = {
  args: { disabled: true, label: "No editable" },
  render: (args) => <Toggle {...args} checked={false} />,
};
