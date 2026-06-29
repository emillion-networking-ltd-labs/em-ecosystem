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

// Sin fecha seleccionada — solo el día de hoy aparece resaltado (bg-surface-subtle).
export const NoSelection: Story = {
  render: (args) => {
    const [value, setValue] = useState<Date | undefined>(undefined);
    return <Calendar {...args} value={value} onChange={setValue} />;
  },
};

// disabled — calendario completo inhabilitado (flechas y días bloqueados).
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => {
    const [value, setValue] = useState<Date | undefined>(new Date());
    return <Calendar {...args} value={value} onChange={setValue} />;
  },
};

// Rango acotado con minDate/maxDate — los días fuera del rango quedan
// opacos (opacity-30, cursor-not-allowed).
export const WithMinMax: Story = {
  render: (args) => {
    const today = new Date();
    const min = new Date(today.getFullYear(), today.getMonth(), 5);
    const max = new Date(today.getFullYear(), today.getMonth(), 24);
    const [value, setValue] = useState<Date | undefined>(
      new Date(today.getFullYear(), today.getMonth(), 15),
    );
    return (
      <Calendar
        {...args}
        value={value}
        onChange={setValue}
        minDate={min}
        maxDate={max}
      />
    );
  },
};

function CalendarDemo({
  initial,
  disabled,
  minDate,
  maxDate,
}: {
  initial?: Date;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}) {
  const [value, setValue] = useState<Date | undefined>(initial);
  return (
    <Calendar
      value={value}
      onChange={setValue}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
}

// AllVariants — ALWAYS last: the states (selection · no-selection · disabled · min/max range).
export const AllVariants: Story = {
  render: () => {
    const today = new Date();
    const min = new Date(today.getFullYear(), today.getMonth(), 5);
    const max = new Date(today.getFullYear(), today.getMonth(), 24);
    const mid = new Date(today.getFullYear(), today.getMonth(), 15);
    return (
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="mb-2 text-caption text-content-tertiary font-mono">with selection</p>
          <CalendarDemo initial={today} />
        </div>
        <div>
          <p className="mb-2 text-caption text-content-tertiary font-mono">no selection</p>
          <CalendarDemo />
        </div>
        <div>
          <p className="mb-2 text-caption text-content-tertiary font-mono">disabled</p>
          <CalendarDemo initial={today} disabled />
        </div>
        <div>
          <p className="mb-2 text-caption text-content-tertiary font-mono">min / max range</p>
          <CalendarDemo initial={mid} minDate={min} maxDate={max} />
        </div>
      </div>
    );
  },
};
