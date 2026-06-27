import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

const meta = {
  title: "Primitives/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
  args: {
    items: [
      { label: "Proyectos", href: "/dashboard/proyectos" },
      { label: "Sitio corporativo", href: "/dashboard/proyectos/sitio-corporativo" },
      { label: "Configuración" },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Solo el ítem raíz (Birdhouse) + un nivel activo, sin enlaces intermedios.
export const SingleLevel: Story = {
  args: {
    items: [{ label: "Inicio" }],
  },
};

// Dos niveles: un enlace intermedio + el activo (último, sin href).
export const TwoLevels: Story = {
  args: {
    items: [
      { label: "Proyectos", href: "/dashboard/proyectos" },
      { label: "Detalle" },
    ],
  },
};

// Cadena larga: auto-colapso vía ResizeObserver (Home / … / Último) al
// desbordar el contenedor. Forzamos un contenedor estrecho para verlo.
export const Collapsed: Story = {
  args: {
    items: [
      { label: "Organización", href: "#" },
      { label: "Proyectos", href: "#" },
      { label: "Sitio corporativo", href: "#" },
      { label: "Páginas", href: "#" },
      { label: "Configuración avanzada de la página de inicio" },
    ],
  },
  render: (args) => (
    <div className="w-[260px] border border-border-components rounded-md p-3">
      <Breadcrumbs {...args} />
    </div>
  ),
};
