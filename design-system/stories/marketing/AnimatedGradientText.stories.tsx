import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnimatedGradientText } from "@/components/ui/AnimatedGradientText";
import { DemoCard, Variants } from "../_kit";

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
    <DemoCard>
      <span className="text-display-2 font-display">
        <AnimatedGradientText {...args} />
      </span>
    </DemoCard>
  ),
};

// Brand palette — drive the gradient from accent-aligned colors instead of the upstream default.
export const BrandColors: Story = {
  args: { colorFrom: "var(--color-accent)", colorTo: "var(--color-accent-2)", children: "Built for your brand" },
  render: (args) => (
    <DemoCard>
      <span className="text-display-2 font-display">
        <AnimatedGradientText {...args} />
      </span>
    </DemoCard>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, Brand colors) — one project Card each, name above.
const gradient = (colorFrom: string, colorTo: string, text: string) => (
  <span className="text-display-2 font-display">
    <AnimatedGradientText colorFrom={colorFrom} colorTo={colorTo}>
      {text}
    </AnimatedGradientText>
  </span>
);

export const AllVariants: Story = {
  render: () => (
    <Variants
      items={[
        { label: "Default", node: gradient("#ffaa40", "#9c40ff", "NexaCore") },
        {
          label: "Brand colors",
          node: gradient("var(--color-accent)", "var(--color-accent-2)", "Built for your brand"),
        },
      ]}
    />
  ),
};
