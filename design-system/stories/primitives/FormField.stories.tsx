import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";

const meta = {
  title: "Primitives/FormField",
  component: FormField,
  tags: ["autodocs"],
  args: {
    label: "Nombre completo",
    htmlFor: "nombre",
    children: <Input id="nombre" placeholder="Escribe tu nombre" />,
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: {
    label: "Correo electrónico",
    required: true,
    htmlFor: "correo",
    children: <Input id="correo" placeholder="nombre@empresa.com" />,
  },
};

export const WithError: Story = {
  args: {
    label: "Correo electrónico",
    error: "Este campo es obligatorio",
    htmlFor: "correo-error",
    children: <Input id="correo-error" placeholder="nombre@empresa.com" />,
  },
};
