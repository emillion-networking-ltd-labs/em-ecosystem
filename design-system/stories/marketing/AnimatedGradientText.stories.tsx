import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnimatedGradientText } from "@/components/ui/AnimatedGradientText";
import { DemoCell, DemoStack } from "./_frame";

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
    <span className="text-display-2 font-display">
      <AnimatedGradientText {...args} />
    </span>
  ),
};

// Brand palette — drive the gradient from accent-aligned colors instead of the upstream default.
export const BrandColors: Story = {
  args: { colorFrom: "var(--color-accent)", colorTo: "var(--color-accent-2)", children: "Built for your brand" },
  render: (args) => (
    <span className="text-display-2 font-display">
      <AnimatedGradientText {...args} />
    </span>
  ),
};

// AllVariants — ALWAYS last: speed axis (faster → slower) × the real color props.
const VARIANTS = [
  { label: "speed 2 · default palette", speed: 2, colorFrom: "#ffaa40", colorTo: "#9c40ff", text: "Move fast" },
  { label: "speed 1 · default palette", speed: 1, colorFrom: "#ffaa40", colorTo: "#9c40ff", text: "Stay sharp" },
  { label: "speed 1 · brand palette", speed: 1, colorFrom: "var(--color-accent)", colorTo: "var(--color-accent-2)", text: "Ship beautifully" },
  { label: "speed 0.5 · brand palette", speed: 0.5, colorFrom: "var(--color-accent)", colorTo: "var(--color-accent-2)", text: "On message" },
] as const;

export const AllVariants: Story = {
  render: () => (
    <DemoStack>
      {VARIANTS.map((v) => (
        <DemoCell key={v.label} caption={v.label}>
          <span className="text-display-3 font-display">
            <AnimatedGradientText speed={v.speed} colorFrom={v.colorFrom} colorTo={v.colorTo}>
              {v.text}
            </AnimatedGradientText>
          </span>
        </DemoCell>
      ))}
    </DemoStack>
  ),
};
