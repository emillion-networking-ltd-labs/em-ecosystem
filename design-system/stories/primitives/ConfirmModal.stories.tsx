import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Input from "@/components/ui/Input";

const meta = {
  title: "Primitives/ConfirmModal",
  component: ConfirmModal,
  tags: ["autodocs"],
  args: {
    open: true,
    onClose: () => {},
    onConfirm: () => {},
    title: "Eliminar proyecto",
    description: "Esta acción no se puede deshacer. ¿Quieres continuar?",
    confirmLabel: "Eliminar",
    cancelLabel: "Cancelar",
    variant: "danger",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "danger"] },
    size: { control: "select", options: ["sm", "md", "lg", "xl"] },
  },
} satisfies Meta<typeof ConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// variant real "primary" — confirmación estándar (botón primario). Tamaño sm,
// el default de las confirmaciones simples (como en ComponentShowcase).
export const Primary: Story = {
  args: {
    variant: "primary",
    size: "sm",
    title: "Confirmar acción",
    description: "¿Seguro que quieres continuar? Esta acción se puede deshacer.",
    confirmLabel: "Confirmar",
  },
};

// variant real "danger" — acción destructiva (botón rojo, autofocus en Cancelar).
export const Danger: Story = {
  args: {
    variant: "danger",
    size: "sm",
    title: "Eliminar elemento",
    description:
      "Esta acción no se puede deshacer. Se borrarán todos los datos asociados.",
    confirmLabel: "Eliminar",
  },
};

// Con children (campos de formulario) → size=md, como el diálogo "Edit Profile"
// del ComponentShowcase. El primer input recibe el autofocus.
export const Form: Story = {
  args: {
    variant: "primary",
    size: "md",
    title: "Editar perfil",
    description: "Actualiza tu información.",
    confirmLabel: "Guardar",
  },
  render: (args) => (
    <ConfirmModal {...args}>
      <div className="mt-4 space-y-4">
        <Input label="Nombre" name="demo-first" placeholder="Juan" />
        <Input label="Apellido" name="demo-last" placeholder="Pérez" />
      </div>
    </ConfirmModal>
  ),
};

// sizes reales del componente: sm/md/lg/xl (max-w 390/480/600/720px). Solo se
// puede mostrar uno a la vez (el modal es a pantalla completa); cambia el
// control `size` para comparar. lg es el que usa ImageCropper.
export const Large: Story = {
  args: {
    size: "lg",
    variant: "primary",
    title: "Diálogo grande (lg)",
    description: "max-w-[600px] — formularios complejos y diálogos multipaso.",
    confirmLabel: "Aceptar",
  },
};

export const ExtraLarge: Story = {
  args: {
    size: "xl",
    variant: "primary",
    title: "Diálogo extra grande (xl)",
    description: "max-w-[720px] — el contenedor más ancho disponible.",
    confirmLabel: "Aceptar",
  },
};
