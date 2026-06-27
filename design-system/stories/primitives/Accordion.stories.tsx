import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Accordion from "@/components/ui/Accordion";

const meta = {
  title: "Primitives/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  args: {
    defaultOpen: 0,
    items: [
      {
        title: "¿Cómo creo un nuevo proyecto?",
        children:
          "Ve al panel de Proyectos y pulsa el botón «Nuevo proyecto». Rellena el nombre y asigna un responsable.",
      },
      {
        title: "¿Puedo invitar a mi equipo?",
        children:
          "Sí. Desde la sección Equipo puedes enviar invitaciones por correo y asignar roles a cada miembro.",
      },
      {
        title: "¿Cómo gestiono la facturación?",
        children:
          "La facturación se administra en Ajustes → Facturación, donde puedes ver tus planes y métodos de pago.",
      },
    ],
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
