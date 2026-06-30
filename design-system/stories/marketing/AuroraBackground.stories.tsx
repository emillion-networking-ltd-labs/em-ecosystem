import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import Card from "@/components/ui/Card";

// Aceternity UI (MIT), adopted verbatim in ECO-88. Decorative animated light field.
// The component is full-height by default; the demos bound it to a card so it never goes full-bleed.
const meta = {
  title: "Marketing/AuroraBackground",
  component: AuroraBackground,
  tags: ["autodocs"],
  args: { showRadialGradient: true },
} satisfies Meta<typeof AuroraBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card className="overflow-hidden">
      <div className="overflow-hidden rounded-xl">
        <AuroraBackground {...args} className="h-72">
          <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center">
            <h2 className="text-display-2 font-display">Launch in days, not quarters</h2>
            <p className="max-w-xl text-content-secondary">
              A living backdrop for hero sections — quiet motion that keeps the headline center stage.
            </p>
          </div>
        </AuroraBackground>
      </div>
    </Card>
  ),
};

// Radial mask off — the gradient fills the whole surface instead of fading from a corner.
export const FullField: Story = {
  args: { showRadialGradient: false },
  render: (args) => (
    <Card className="overflow-hidden">
      <div className="overflow-hidden rounded-xl">
        <AuroraBackground {...args} className="h-72">
          <h2 className="relative z-10 text-display-2 font-display">Edge to edge</h2>
        </AuroraBackground>
      </div>
    </Card>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, FullField) — one project Card each, name above.
// The full-bleed effect is hosted as a tile inside the card.
const VARIANTS = [
  { label: "Default", showRadialGradient: true },
  { label: "FullField", showRadialGradient: false },
] as const;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
          <Card className="overflow-hidden">
            <div className="overflow-hidden rounded-xl">
              <AuroraBackground showRadialGradient={v.showRadialGradient} className="h-56">
                <span className="relative z-10 text-display-3 font-display">Aurora</span>
              </AuroraBackground>
            </div>
          </Card>
        </div>
      ))}
    </div>
  ),
};
