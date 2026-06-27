import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TurnstileWidget from "@/components/ui/TurnstileWidget";

// App-coupled: usa useTheme → @/context/ThemeContext (mock en el catálogo). El widget real de
// Cloudflare Turnstile requiere una site-key del entorno; aquí se cataloga el contenedor.
const meta = {
  title: "Primitives/TurnstileWidget",
  component: TurnstileWidget,
  tags: ["autodocs"],
  args: { onToken: () => {} },
} satisfies Meta<typeof TurnstileWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
