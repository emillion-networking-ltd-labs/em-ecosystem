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

// AllVariants — ALWAYS last: an overview of the two kinds (throttle / lockout).
export const AllVariants: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">kind=throttle</p>
        <RateLimitBanner
          kind="throttle"
          retryAfter={30}
          message="Too many attempts. Try again in a few seconds."
        />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">kind=lockout</p>
        <RateLimitBanner
          kind="lockout"
          retryAfter={300}
          message="Account temporarily locked after several failed attempts."
        />
      </div>
    </div>
  ),
};
