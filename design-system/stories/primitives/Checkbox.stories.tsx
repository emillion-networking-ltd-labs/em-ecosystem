import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Checkbox from "@/components/ui/Checkbox";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: { label: "Acepto los términos", size: "md" },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [on, setOn] = useState(false);
    return <Checkbox {...args} checked={on} onChange={setOn} />;
  },
};

export const Indeterminate: Story = {
  args: { indeterminate: true, label: "Selección parcial" },
  render: (args) => <Checkbox {...args} checked={false} />,
};
