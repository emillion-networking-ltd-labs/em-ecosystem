import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TurnstileWidget from "@/components/ui/TurnstileWidget";

// App-coupled: usa useTheme → @/context/ThemeContext (mock en el catálogo). El widget real de
// Cloudflare Turnstile requiere una site-key del entorno; aquí se cataloga el contenedor.
const meta = {
  title: "Primitives/TurnstileWidget",
  component: TurnstileWidget,
  tags: ["autodocs"],
  args: { onToken: () => {} },
  // The widget uses Turnstile size "flexible" (expands to its container). Constrain to the standard
  // ~300px so it doesn't stretch full-bleed in the catalog; the real auth form sets its own width.
  decorators: [
    (Story) => (
      <div className="max-w-[300px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TurnstileWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
