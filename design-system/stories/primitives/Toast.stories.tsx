import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Toast from "@/components/ui/Toast";

const meta = {
  title: "Primitives/Toast",
  component: Toast,
  tags: ["autodocs"],
  args: {
    id: 1,
    variant: "success",
    title: "Cambios guardados",
    description: "Tu perfil se ha actualizado correctamente.",
    onClose: () => {},
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["error", "success", "warning", "info"],
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
