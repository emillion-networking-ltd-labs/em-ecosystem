import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import AlertBox from "@/components/ui/AlertBox";

const meta = {
  title: "Primitives/AlertBox",
  component: AlertBox,
  tags: ["autodocs"],
  args: { variant: "info", children: "Tu sesión expira en 5 minutos." },
  argTypes: {
    variant: { control: "select", options: ["warning", "error", "info", "success"] },
  },
} satisfies Meta<typeof AlertBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Warning: Story = { args: { variant: "warning", children: "Revisa los datos." } };
export const Error: Story = { args: { variant: "error", children: "No se pudo guardar." } };
export const Success: Story = { args: { variant: "success", children: "Cambios guardados." } };

const variantCopy: Record<"warning" | "error" | "info" | "success", string> = {
  warning: "Esta acción hará tu cuenta menos segura.",
  error: "Código de verificación inválido. Inténtalo de nuevo.",
  info: "Tu correo lo gestiona un proveedor externo.",
  success: "Tus cambios se guardaron correctamente.",
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {(["warning", "error", "info", "success"] as const).map((v) => (
        <AlertBox key={v} variant={v}>
          {variantCopy[v]}
        </AlertBox>
      ))}
    </div>
  ),
};
