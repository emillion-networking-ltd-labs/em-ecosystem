import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Calendar from "@/components/ui/Calendar";

const meta = {
  title: "Primitives/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  args: {
    onChange: () => {},
  },
  render: (args) => {
    const [value, setValue] = useState<Date | undefined>(new Date());
    return <Calendar {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
