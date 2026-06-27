import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import MfaDigitInput from "@/components/ui/MfaDigitInput";

const meta = {
  title: "Primitives/MfaDigitInput",
  component: MfaDigitInput,
  tags: ["autodocs"],
  args: {
    length: 6,
  },
} satisfies Meta<typeof MfaDigitInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(["", "", "", "", "", ""]);
    return <MfaDigitInput {...args} value={value} onChange={setValue} />;
  },
};

export const Filled: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(["1", "2", "3", "4", "5", "6"]);
    return <MfaDigitInput {...args} value={value} onChange={setValue} />;
  },
};

export const WithError: Story = {
  args: { error: true },
  render: (args) => {
    const [value, setValue] = useState<string[]>(["1", "2", "3", "", "", ""]);
    return <MfaDigitInput {...args} value={value} onChange={setValue} />;
  },
};
