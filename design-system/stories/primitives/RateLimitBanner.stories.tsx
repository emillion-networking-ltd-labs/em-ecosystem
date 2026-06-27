import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RateLimitBanner from "@/components/ui/RateLimitBanner";

const meta = {
  title: "Primitives/RateLimitBanner",
  component: RateLimitBanner,
  tags: ["autodocs"],
  args: {
    retryAfter: 30,
    message: "Demasiados intentos. Vuelve a probar en unos segundos.",
    kind: "throttle",
  },
  argTypes: {
    kind: { control: "inline-radio", options: ["throttle", "lockout"] },
  },
} satisfies Meta<typeof RateLimitBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
