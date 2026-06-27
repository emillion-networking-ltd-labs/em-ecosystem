import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Pencil, Copy, Archive, Trash2 } from "lucide-react";
import Select from "@/components/ui/Select";

const opciones = [
  { label: "España", value: "es" },
  { label: "México", value: "mx" },
  { label: "Argentina", value: "ar" },
  { label: "Colombia", value: "co" },
];

const opcionesConIcono = [
  { label: "Editar", value: "edit", icon: <Pencil size={16} /> },
  { label: "Duplicar", value: "dup", icon: <Copy size={16} /> },
  { label: "Archivar", value: "arch", icon: <Archive size={16} /> },
  {
    label: "Eliminar",
    value: "del",
    icon: <Trash2 size={16} />,
    variant: "danger" as const,
  },
];

const meta = {
  title: "Primitives/Select",
  component: Select,
  tags: ["autodocs"],
  args: {
    options: opciones,
    placeholder: "Selecciona un país",
    size: "sm",
    onChange: () => {},
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string>();
    return <Select {...args} value={value} onChange={setValue} />;
  },
};

export const WithValue: Story = {
  render: (args) => {
    const [value, setValue] = useState<string>("mx");
    return <Select {...args} value={value} onChange={setValue} />;
  },
};

export const WithIcons: Story = {
  args: { options: opcionesConIcono, placeholder: "Elige una acción…" },
  render: (args) => {
    const [value, setValue] = useState<string>();
    return <Select {...args} value={value} onChange={setValue} />;
  },
};

// Una opción puede declarar variant: "danger" (texto de error, hover bg-error-bg).
export const DangerOption: Story = {
  args: { options: opcionesConIcono, placeholder: "Elige una acción…" },
  render: (args) => {
    const [value, setValue] = useState<string>("del");
    return <Select {...args} value={value} onChange={setValue} />;
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => {
    const [value, setValue] = useState<string>();
    return <Select {...args} value={value} onChange={setValue} />;
  },
};

const sizes = ["sm", "md"] as const;

// Select solo tiene sizes para el trigger (sm: h-10, md: h-12).
export const AllSizes: Story = {
  render: () => {
    const [value, setValue] = useState<string>("es");
    return (
      <div className="flex flex-col items-start gap-4">
        {sizes.map((size) => (
          <div key={size} className="flex items-center gap-3">
            <Select
              options={opciones}
              size={size}
              value={value}
              onChange={setValue}
              placeholder="Selecciona un país"
            />
            <span className="text-caption text-content-tertiary">
              {size === "sm" ? "sm · 40px" : "md · 48px"}
            </span>
          </div>
        ))}
      </div>
    );
  },
};
