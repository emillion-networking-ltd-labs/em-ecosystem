import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EmailSelector from "@/components/ui/EmailSelector";

const meta = {
  title: "Primitives/EmailSelector",
  component: EmailSelector,
  tags: ["autodocs"],
  args: {
    email: "ana.garcia@empresa.com",
    onChangeEmail: () => {},
  },
} satisfies Meta<typeof EmailSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

// EmailSelector no tiene sizes ni variants ni estados disabled/error:
// solo recibe el email a mostrar y un callback para cambiarlo.
export const Default: Story = {};

export const LongEmail: Story = {
  args: { email: "nombre.muy.largo.de.usuario@dominio-extenso.com" },
};
