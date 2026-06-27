import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlurFade } from "@/components/ui/BlurFade";

// Magic UI (MIT), adoptado verbatim en ECO-82. Usa `motion/react`.
const meta = {
  title: "Marketing/BlurFade",
  component: BlurFade,
  tags: ["autodocs"],
  args: {
    duration: 0.6,
    delay: 0,
    direction: "down",
    inView: true,
  },
} satisfies Meta<typeof BlurFade>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <BlurFade {...args}>
      <h2 className="text-display-3 font-display text-content-primary">
        Aparece con clase
      </h2>
    </BlurFade>
  ),
};

export const Staggered: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {["Fiel a los hechos", "Bello por sector", "Código propio"].map((t, i) => (
        <BlurFade key={t} {...args} delay={i * 0.15}>
          <p className="text-content-secondary">{t}</p>
        </BlurFade>
      ))}
    </div>
  ),
};
