import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ToastContainer from "@/components/ui/ToastContainer";

// App-coupled: consume useToast → @/context/ToastContext (mock en el catálogo con toasts de
// muestra; en la app real lo provee el dashboard). Renderiza los toasts fijos (top, fixed).
const meta = {
  title: "Primitives/ToastContainer",
  component: ToastContainer,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof ToastContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
