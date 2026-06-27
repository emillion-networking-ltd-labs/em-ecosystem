import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";
import Input from "@/components/ui/Input";

const meta = {
  title: "Primitives/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    label: "Correo electrónico",
    placeholder: "nombre@empresa.com",
    size: "md",
    variant: "default",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    variant: { control: "inline-radio", options: ["default", "filled"] },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Password: Story = {
  args: { label: "Contraseña", type: "password", placeholder: "Tu contraseña" },
};

export const WithLeftIcon: Story = {
  args: {
    label: "Buscar",
    placeholder: "Buscar…",
    leftIcon: <Search size={16} />,
  },
};

export const WithError: Story = {
  args: { label: "Correo electrónico", error: "El correo no es válido" },
};

export const Loading: Story = {
  args: { label: "Buscando", loading: true, placeholder: "Cargando…" },
};

export const Disabled: Story = {
  args: { label: "No editable", placeholder: "No se puede editar", disabled: true },
};

export const Filled: Story = {
  args: { label: "Buscar", variant: "filled", placeholder: "Escribe para buscar" },
};

const sizes = ["sm", "md"] as const;

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col gap-1.5">
          <Input
            size={size}
            label={`Tamaño ${size}`}
            placeholder={size === "sm" ? "sm · 40px" : "md · 48px (por defecto)"}
          />
          <span className="text-caption text-content-tertiary">
            {size === "sm" ? "sm · 40px" : "md · 48px (por defecto)"}
          </span>
        </div>
      ))}
    </div>
  ),
};

const variants = ["default", "filled"] as const;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {variants.map((variant) => (
        <div key={variant} className="flex flex-col gap-1.5">
          <Input
            variant={variant}
            label={`Variante ${variant}`}
            placeholder={
              variant === "filled" ? "filled · sin outline" : "default · con outline"
            }
          />
          <span className="text-caption text-content-tertiary">
            {variant === "filled"
              ? "filled · bg-surface-primary, sin outline"
              : "default · con outline"}
          </span>
        </div>
      ))}
    </div>
  ),
};
