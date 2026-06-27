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

// length define el número de celdas (no hay prop size: el ancho de cada celda
// se auto-ajusta — compacto a <348px, máx 48px por celda).
export const FourDigits: Story = {
  args: { length: 4 },
  render: (args) => {
    const [value, setValue] = useState<string[]>(["1", "2", "3", "4"]);
    return <MfaDigitInput {...args} value={value} onChange={setValue} />;
  },
};

// El componente auto-encoge sus celdas cuando el contenedor es estrecho
// (ResizeObserver): celdas de 40px y gap menor por debajo de 348px.
export const Compact: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(["1", "2", "3", "4", "5", "6"]);
    return (
      <div className="flex flex-col gap-6">
        <div className="w-[280px]">
          <p className="mb-2 text-caption text-content-tertiary">
            contenedor estrecho · celdas 40px
          </p>
          <MfaDigitInput length={6} value={value} onChange={setValue} />
        </div>
        <div className="w-[400px]">
          <p className="mb-2 text-caption text-content-tertiary">
            contenedor amplio · celdas 48px
          </p>
          <MfaDigitInput length={6} value={value} onChange={setValue} />
        </div>
      </div>
    );
  },
};
