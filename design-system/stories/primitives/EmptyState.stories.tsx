import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

const meta = {
  title: "Primitives/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  args: {
    variant: "default",
    title: "No hay proyectos todavía",
    description: "Crea tu primer proyecto para empezar a trabajar.",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "error"] },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    title: "Aún no hay proyectos",
    description: "Crea tu primer proyecto para empezar.",
    action: (
      <Button variant="primary" size="sm" fullWidth={false}>
        Crear proyecto
      </Button>
    ),
  },
};

export const CustomIcon: Story = {
  args: {
    icon: <Search size={48} />,
    title: "Sin resultados",
    description: "Ningún elemento coincide con tu búsqueda.",
  },
};

export const ErrorVariant: Story = {
  args: {
    variant: "error",
    title: "No se pudieron cargar los usuarios",
    description: "Error de red — inténtalo de nuevo.",
    action: (
      <Button variant="primary" size="sm" fullWidth={false}>
        Reintentar
      </Button>
    ),
  },
};
