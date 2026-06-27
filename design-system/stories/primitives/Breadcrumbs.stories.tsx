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
