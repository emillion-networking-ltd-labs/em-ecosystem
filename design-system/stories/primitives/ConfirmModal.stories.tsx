import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ConfirmModal from "@/components/ui/ConfirmModal";

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
