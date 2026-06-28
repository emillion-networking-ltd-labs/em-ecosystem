import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuroraBackground } from "@/components/ui/AuroraBackground";

// Aceternity UI (MIT), adopted verbatim in ECO-88. Decorative animated light field.
// The component is full-height by default; the demos bound it to a card so it never goes full-bleed.
const meta = {
  title: "Marketing/AuroraBackground",
  component: AuroraBackground,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { showRadialGradient: true },
} satisfies Meta<typeof AuroraBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="overflow-hidden rounded-2xl border border-border-default">
      <AuroraBackground {...args} className="h-80">
        <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center">
          <h2 className="text-display-2 font-display">Launch in days, not quarters</h2>
          <p className="max-w-xl text-content-secondary">
            A living backdrop for hero sections — quiet motion that keeps the headline center stage.
          </p>
        </div>
      </AuroraBackground>
    </div>
  ),
};

// Radial mask off — the gradient fills the whole surface instead of fading from a corner.
export const FullField: Story = {
  args: { showRadialGradient: false },
  render: (args) => (
    <div className="overflow-hidden rounded-2xl border border-border-default">
      <AuroraBackground {...args} className="h-80">
        <h2 className="relative z-10 text-display-2 font-display">Edge to edge</h2>
      </AuroraBackground>
    </div>
  ),
};

// AllVariants — ALWAYS last: the real boolean prop (showRadialGradient on / off).
const VARIANTS = [
  { showRadialGradient: true, label: "radial mask (default)" },
  { showRadialGradient: false, label: "full field" },
] as const;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <div className="overflow-hidden rounded-2xl border border-border-default">
            <AuroraBackground showRadialGradient={v.showRadialGradient} className="h-56">
              <span className="relative z-10 text-display-3 font-display">Aurora</span>
            </AuroraBackground>
          </div>
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
        </div>
      ))}
    </div>
  ),
};
