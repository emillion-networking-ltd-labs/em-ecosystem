import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnimatedGradientText } from "@/components/ui/AnimatedGradientText";
import Card from "@/components/ui/Card";

// Magic UI (MIT), adopted verbatim in ECO-82. Requires the `gradient` keyframe (tokens.css).
// colorFrom/colorTo default to the upstream palette (#ffaa40 → #9c40ff) — respected in the Default demo.
const meta = {
  title: "Marketing/AnimatedGradientText",
  component: AnimatedGradientText,
  tags: ["autodocs"],
  args: {
    children: "NexaCore",
    speed: 1,
    colorFrom: "#ffaa40",
    colorTo: "#9c40ff",
  },
} satisfies Meta<typeof AnimatedGradientText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <span className="text-display-2 font-display">
        <AnimatedGradientText {...args} />
      </span>
    </Card>
  ),
};

// Brand palette — drive the gradient from accent-aligned colors instead of the upstream default.
export const BrandColors: Story = {
  args: { colorFrom: "var(--color-accent)", colorTo: "var(--color-accent-2)", children: "Built for your brand" },
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <span className="text-display-2 font-display">
        <AnimatedGradientText {...args} />
      </span>
    </Card>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, Brand colors) — one project Card each, name above.
const VARIANTS = [
  { label: "Default", colorFrom: "#ffaa40", colorTo: "#9c40ff", text: "NexaCore" },
  {
    label: "Brand colors",
    colorFrom: "var(--color-accent)",
    colorTo: "var(--color-accent-2)",
    text: "Built for your brand",
  },
] as const;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
          <Card className="flex min-h-[140px] items-center justify-center">
            <span className="text-display-2 font-display">
              <AnimatedGradientText colorFrom={v.colorFrom} colorTo={v.colorTo}>
                {v.text}
              </AnimatedGradientText>
            </span>
          </Card>
        </div>
      ))}
    </div>
  ),
};
