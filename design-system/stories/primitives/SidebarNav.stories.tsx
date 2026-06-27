import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Shield,
  ScrollText,
  Key,
  FileText,
} from "lucide-react";
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

export const Default: Story = {
  render: (args) => (
    <div className="w-[300px] rounded-r-xl border border-border-strong bg-surface-primary shadow-card">
      <SidebarNav {...args} />
    </div>
  ),
};

// Estado colapsado (68px): cada ítem es un IconButton boxed; el activo lleva
// aria-pressed (ring). Las hojas muestran Tooltip a la derecha.
export const Collapsed: Story = {
  args: { collapsed: true },
  render: (args) => (
    <div className="w-[68px] rounded-r-xl border border-border-strong bg-surface-primary shadow-card">
      <SidebarNav {...args} />
    </div>
  ),
};

// Secciones que incluyen un ítem padre con hijos: expandido → acordeón
// (ChevronDown/Right + hijos anidados pl-4); colapsado → flyout al pasar el ratón.
function withChildren(activeItem: string): SidebarNavSection[] {
  return [
    {
      label: "Paneles",
      items: [
        {
          href: "#dashboard",
          label: "Panel",
          icon: LayoutDashboard,
          active: activeItem === "#dashboard",
        },
        {
          href: "#admin",
          label: "Administración",
          icon: Shield,
          active: activeItem === "#admin",
          children: [
            {
              href: "#audit",
              label: "Registros",
              icon: ScrollText,
              active: activeItem === "#audit",
            },
            {
              href: "#permissions",
              label: "Permisos",
              icon: Key,
              active: activeItem === "#permissions",
            },
          ],
        },
      ],
    },
    {
      label: "Cuenta",
      items: [
        {
          href: "#settings",
          label: "Ajustes",
          icon: Settings,
          active: activeItem === "#settings",
        },
        {
          href: "#docs",
          label: "Documentación",
          icon: FileText,
          active: activeItem === "#docs",
        },
      ],
    },
  ];
}

// Expandido con submenú (acordeón) — el padre alterna sus hijos al pulsar.
export const Expanded: Story = {
  render: () => {
    const [active, setActive] = useState("#audit");
    return (
      <div className="w-[300px] rounded-r-xl border border-border-strong bg-surface-primary shadow-card">
        <SidebarNav
          sections={withChildren(active)}
          onNavigate={(href, e) => {
            e.preventDefault();
            setActive(href);
          }}
        />
      </div>
    );
  },
};

// Colapsado con hijos — el ítem padre abre un flyout al pasar el ratón.
export const CollapsedWithChildren: Story = {
  render: () => {
    const [active, setActive] = useState("#audit");
    return (
      <div className="w-[68px] rounded-r-xl border border-border-strong bg-surface-primary shadow-card">
        <SidebarNav
          sections={withChildren(active)}
          collapsed
          onNavigate={(href, e) => {
            e.preventDefault();
            setActive(href);
          }}
        />
      </div>
    );
  },
};
