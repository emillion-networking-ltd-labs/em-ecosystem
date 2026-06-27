import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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

export const WithError: Story = {
  args: { label: "Correo electrónico", error: "El correo no es válido" },
};

export const Loading: Story = {
  args: { label: "Buscando", loading: true, placeholder: "Cargando…" },
};

export const Filled: Story = {
  args: { label: "Buscar", variant: "filled", placeholder: "Escribe para buscar" },
};
