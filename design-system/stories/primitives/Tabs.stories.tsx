import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { BarChart3, ShoppingCart, Settings } from "lucide-react";
import Tabs from "@/components/ui/Tabs";

const meta = {
  title: "Primitives/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["subtle", "nav", "nav-horizontal"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    fullWidth: { control: "boolean" },
    wrap: { control: "boolean" },
  },
  args: {
    tabs: [
      { label: "General", value: "general" },
      { label: "Miembros", value: "miembros" },
      { label: "Facturación", value: "facturacion" },
    ],
    activeTab: "general",
    onChange: () => {},
  },
  render: (args) => {
    const [activeTab, setActiveTab] = useState(args.activeTab);
    return <Tabs {...args} activeTab={activeTab} onChange={setActiveTab} />;
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const navItems = [
  { label: "Panel", value: "panel", icon: <BarChart3 size={16} /> },
  { label: "Pedidos", value: "pedidos", icon: <ShoppingCart size={16} /> },
  { label: "Ajustes", value: "ajustes", icon: <Settings size={16} /> },
];

// variant=nav — navegación vertical (sidebar). Activo: bg-surface-subtle;
// inactivo muestra ChevronRight + icono opcional (16px).
export const Nav: Story = {
  args: { variant: "nav", tabs: navItems, activeTab: "panel" },
  render: (args) => {
    const [active, setActive] = useState(args.activeTab);
    return (
      <div className="w-[240px]">
        <Tabs {...args} activeTab={active} onChange={setActive} />
      </div>
    );
  },
};

// variant=nav-horizontal — misma intención que nav pero en barra superior.
export const NavHorizontal: Story = {
  args: { variant: "nav-horizontal", tabs: navItems, activeTab: "panel" },
  render: (args) => {
    const [active, setActive] = useState(args.activeTab);
    return <Tabs {...args} activeTab={active} onChange={setActive} />;
  },
};

// variant=subtle — selector con borde/contenedor (Figma). Activo:
// bg-surface-secondary + borde; inactivo: font-semibold + hover.
export const Subtle: Story = {
  args: { variant: "subtle", activeTab: "general" },
  render: (args) => {
    const [active, setActive] = useState(args.activeTab);
    return <Tabs {...args} activeTab={active} onChange={setActive} />;
  },
};

// Todas las variantes una junto a otra.
export const AllVariants: Story = {
  render: () => {
    const [a, setA] = useState("panel");
    const [b, setB] = useState("panel");
    const [c, setC] = useState("general");
    return (
      <div className="flex flex-col gap-8">
        <div>
          <p className="mb-2 text-caption text-content-tertiary">nav</p>
          <div className="w-[240px]">
            <Tabs tabs={navItems} activeTab={a} onChange={setA} variant="nav" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-caption text-content-tertiary">
            nav-horizontal
          </p>
          <Tabs
            tabs={navItems}
            activeTab={b}
            onChange={setB}
            variant="nav-horizontal"
          />
        </div>
        <div>
          <p className="mb-2 text-caption text-content-tertiary">subtle</p>
          <Tabs
            tabs={[
              { label: "General", value: "general" },
              { label: "Miembros", value: "miembros" },
              { label: "Facturación", value: "facturacion" },
            ]}
            activeTab={c}
            onChange={setC}
            variant="subtle"
          />
        </div>
      </div>
    );
  },
};

// Tamaños sm/md/lg — solo aplican a la variante subtle.
export const AllSizes: Story = {
  render: () => {
    const sizes = ["sm", "md", "lg"] as const;
    const tabs = [
      { label: "Uno", value: "uno" },
      { label: "Dos", value: "dos" },
      { label: "Tres", value: "tres" },
    ];
    const Row = ({ size }: { size: "sm" | "md" | "lg" }) => {
      const [active, setActive] = useState("uno");
      return (
        <div>
          <p className="mb-2 text-caption text-content-tertiary">{size}</p>
          <Tabs
            tabs={tabs}
            activeTab={active}
            onChange={setActive}
            variant="subtle"
            size={size}
          />
        </div>
      );
    };
    return (
      <div className="flex flex-col gap-6">
        {sizes.map((s) => (
          <Row key={s} size={s} />
        ))}
      </div>
    );
  },
};

// fullWidth — las pestañas (subtle) reparten el ancho del contenedor.
export const FullWidth: Story = {
  args: { variant: "subtle", fullWidth: true, activeTab: "general" },
  render: (args) => {
    const [active, setActive] = useState(args.activeTab);
    return (
      <div className="w-[420px]">
        <Tabs {...args} activeTab={active} onChange={setActive} />
      </div>
    );
  },
};
