import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TurnstileWidget from "@/components/ui/TurnstileWidget";

// App-coupled: uses useTheme → @/context/ThemeContext (mock in the catalog). The real Cloudflare
// Turnstile widget needs a site-key from the environment; here we catalog the container.
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

// AllVariants — ALWAYS last: the Turnstile container (the real widget needs a Cloudflare site-key).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">widget container</p>
        <TurnstileWidget onToken={() => {}} />
      </div>
    </div>
  ),
};
