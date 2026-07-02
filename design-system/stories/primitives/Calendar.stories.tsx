import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Calendar from "@/components/ui/Calendar";
import { DemoCard } from "../_kit";

const meta = {
  title: "Primitives/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  args: {
    onChange: () => {},
  },
  render: (args) => {
    const [value, setValue] = useState<Date | undefined>(new Date());
    return (
      <DemoCard>
        <Calendar {...args} value={value} onChange={setValue} />
      </DemoCard>
    );
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// No design-variant/size axis — its axes are visual states (selection / no-selection / disabled / min-max
// range), each its own story. So there is no AllVariants.

// Default — a date selected (today highlighted).
export const Default: Story = {};

// No date selected — only today is highlighted (bg-surface-subtle).
export const NoSelection: Story = {
  render: (args) => {
    const [value, setValue] = useState<Date | undefined>(undefined);
    return (
      <DemoCard>
        <Calendar {...args} value={value} onChange={setValue} />
      </DemoCard>
    );
  },
};

// disabled — the whole calendar is disabled (arrows and days blocked).
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => {
    const [value, setValue] = useState<Date | undefined>(new Date());
    return (
      <DemoCard>
        <Calendar {...args} value={value} onChange={setValue} />
      </DemoCard>
    );
  },
};

// Bounded range with minDate/maxDate — days outside the range are dimmed (opacity-30, cursor-not-allowed).
export const WithMinMax: Story = {
  render: (args) => {
    const today = new Date();
    const min = new Date(today.getFullYear(), today.getMonth(), 5);
    const max = new Date(today.getFullYear(), today.getMonth(), 24);
    const [value, setValue] = useState<Date | undefined>(
      new Date(today.getFullYear(), today.getMonth(), 15),
    );
    return (
      <DemoCard>
        <Calendar {...args} value={value} onChange={setValue} minDate={min} maxDate={max} />
      </DemoCard>
    );
  },
};
