import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Meteors } from "@/components/ui/Meteors";

// Aceternity UI (MIT), adopted verbatim in ECO-88. Decorative meteor shower; needs a bounded, relative parent.
const meta = {
  title: "Marketing/Meteors",
  component: Meteors,
  tags: ["autodocs"],
  args: { number: 20 },
} satisfies Meta<typeof Meteors>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="relative isolate flex h-80 w-full items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-inverse text-content-inverse">
      <Meteors {...args} />
      <span className="relative z-10 text-display-3 font-display">Meteors</span>
    </div>
  ),
};

// AllVariants — ALWAYS last: the only real prop is `number` (density: dense → sparse).
const DENSITIES = [
  { number: 40, label: "number 40 · dense" },
  { number: 20, label: "number 20 (default)" },
  { number: 8, label: "number 8 · sparse" },
] as const;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {DENSITIES.map((d) => (
        <div key={d.label} className="flex flex-col gap-1.5">
          <div className="relative isolate flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-inverse text-content-inverse">
            <Meteors number={d.number} />
            <span className="relative z-10 text-display-3 font-display">Meteors</span>
          </div>
          <span className="text-caption text-content-tertiary font-mono">{d.label}</span>
        </div>
      ))}
    </div>
  ),
};
