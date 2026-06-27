import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import InlineError from "@/components/ui/InlineError";

const meta = {
  title: "Primitives/InlineError",
  component: InlineError,
  tags: ["autodocs"],
  args: {
    message: "El correo electrónico no es válido",
  },
} satisfies Meta<typeof InlineError>;

export default meta;
type Story = StoryObj<typeof meta>;

// InlineError no tiene sizes ni variants ni estados: solo recibe el mensaje
// (icono AlertTriangle 16px + texto text-caption text-error).
export const Default: Story = {};

export const RequiredField: Story = {
  args: { message: "Este campo es obligatorio" },
};

export const LongMessage: Story = {
  render: (args) => (
    <div className="max-w-sm">
      <InlineError
        {...args}
        message="La contraseña debe tener al menos 8 caracteres, una mayúscula y un número."
      />
    </div>
  ),
};
