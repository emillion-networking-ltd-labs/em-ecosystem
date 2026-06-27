import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bell, Trash2, Copy } from "lucide-react";
import IconButton from "@/components/ui/IconButton";

const meta = {
  title: "Primitives/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  args: {
    variant: "default",
    size: "sm",
    "aria-label": "Notifications",
    children: <Bell size={16} />,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "danger", "boxed", "boxed-hover"],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ["default", "danger", "boxed", "boxed-hover"] as const;

export const Default: Story = {};

// Las cuatro variantes del tipo IconButtonVariant.
export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {VARIANTS.map((v) => (
        <IconButton key={v} variant={v} aria-label={v}>
          <Bell size={16} />
        </IconButton>
      ))}
    </div>
  ),
};

// Tamaños sm (p-2) y md (p-3).
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["sm", "md"] as const).map((s) => (
        <IconButton key={s} size={s} variant="boxed" aria-label={`size ${s}`}>
          <Bell size={16} />
        </IconButton>
      ))}
    </div>
  ),
};

// Estados: normal, loading (spinner), disabled (opacity-50).
export const States: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton variant="boxed" aria-label="Normal">
        <Bell size={16} />
      </IconButton>
      <IconButton variant="boxed" loading aria-label="Cargando" />
      <IconButton variant="boxed" disabled aria-label="Deshabilitado">
        <Bell size={16} />
      </IconButton>
    </div>
  ),
};

// Variante boxed con aria-pressed=true → anillo (estado activo, p.ej. SidebarNav colapsado).
export const Pressed: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton variant="boxed" aria-label="Inactivo">
        <Bell size={16} />
      </IconButton>
      <IconButton variant="boxed" aria-pressed="true" aria-label="Activo">
        <Bell size={16} />
      </IconButton>
    </div>
  ),
};

// danger — para acciones destructivas (hover bg-error-bg).
export const Danger: Story = {
  args: { variant: "danger", "aria-label": "Eliminar", children: <Trash2 size={16} /> },
};

// Con tooltip (usa aria-label si tooltip=true, o un texto propio).
export const WithTooltip: Story = {
  args: {
    variant: "default",
    tooltip: "Copiar",
    "aria-label": "Copiar",
    children: <Copy size={16} />,
  },
};
