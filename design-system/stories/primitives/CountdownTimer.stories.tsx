import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CountdownTimer from "@/components/ui/CountdownTimer";

const meta = {
  title: "Primitives/CountdownTimer",
  component: CountdownTimer,
  tags: ["autodocs"],
  args: { seconds: 120, variant: "error", size: "sm" },
  argTypes: {
    variant: { control: "inline-radio", options: ["error", "warning"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof CountdownTimer>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ["error", "warning"] as const;
// Largest to smallest, like the rest. sm is the component default.
const SIZES = ["lg", "md", "sm"] as const;

// Playground — use the controls (variant, size).
export const Default: Story = {};

// The 2 variants (md size).
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      {VARIANTS.map((v) => (
        <div key={v} className="flex flex-col items-center gap-1">
          <CountdownTimer seconds={120} variant={v} size="md" />
          <span className="text-caption text-content-tertiary font-mono">{v}</span>
        </div>
      ))}
    </div>
  ),
};

// AllSizes — the 3 sizes (error variant).
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      {SIZES.map((s) => (
        <div key={s} className="flex flex-col items-center gap-1">
          <CountdownTimer seconds={120} variant="error" size={s} />
          <span className="text-caption text-content-tertiary font-mono">
            {s}
            {s === "sm" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: full variant × size matrix.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      {VARIANTS.map((v) => (
        <div key={v}>
          <p className="mb-2 text-caption text-content-tertiary font-mono">{v}</p>
          <div className="flex flex-wrap items-end gap-6">
            {SIZES.map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <CountdownTimer seconds={120} variant={v} size={s} />
                <span className="text-caption text-content-tertiary font-mono">
                  {s}
                  {s === "sm" ? " (default)" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
