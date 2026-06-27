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

export const Default: Story = {};

export const RequiredField: Story = {
  args: { message: "Este campo es obligatorio" },
};
