import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TurnstileWidget from "@/components/ui/TurnstileWidget";
import { DemoCard } from "../_kit";

// App-coupled: uses useTheme → @/context/ThemeContext (mock in the catalog). The real Cloudflare
// Turnstile widget needs a site-key from the environment; here we catalog the container.
const meta = {
  title: "Migration/TurnstileWidget",
  component: TurnstileWidget,
  tags: ["autodocs"],
  args: { onToken: () => {} },
  // The widget uses Turnstile size "flexible" (expands to its container); constrain to the standard ~300px.
  render: (args) => (
    <DemoCard>
      <div className="w-[300px]">
        <TurnstileWidget {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof TurnstileWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

// A single container (no variants/sizes) — so no AllVariants. The real widget needs a Cloudflare site-key.
export const Default: Story = {};
