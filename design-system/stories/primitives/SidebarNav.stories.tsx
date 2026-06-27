import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LayoutDashboard, FolderKanban, Users, Settings } from "lucide-react";
import SidebarNav, { type SidebarNavSection } from "@/components/ui/SidebarNav";

const sections: SidebarNavSection[] = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, active: true },
      { href: "/dashboard/proyectos", label: "Proyectos", icon: FolderKanban },
      { href: "/dashboard/equipo", label: "Equipo", icon: Users },
    ],
  },
  {
    label: "Cuenta",
    items: [{ href: "/dashboard/ajustes", label: "Ajustes", icon: Settings }],
  },
];

const meta = {
  title: "Primitives/SidebarNav",
  component: SidebarNav,
  tags: ["autodocs"],
  args: {
    sections,
  },
} satisfies Meta<typeof SidebarNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
