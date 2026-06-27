import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ErrorAlert from "@/components/ui/ErrorAlert";

const meta = {
  title: "Primitives/ErrorAlert",
  component: ErrorAlert,
  tags: ["autodocs"],
  args: {
    message: "No se pudo guardar los cambios. Inténtalo de nuevo.",
    onDismiss: () => {},
  },
} satisfies Meta<typeof ErrorAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
