import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Meteors } from "@/components/ui/Meteors";
import { DemoCard, Variants } from "../_kit";

// Aceternity UI (MIT), adopted verbatim in ECO-88. Decorative meteor shower; needs a bounded, relative parent.
const meta = {
  title: "Marketing/Meteors",
  component: Meteors,
  tags: ["autodocs"],
  args: { number: 20 },
} satisfies Meta<typeof Meteors>;

export default meta;
type Story = StoryObj<typeof meta>;

// The meteor shower needs a dark, bounded tile to read — hosted inside the project Card.
const Tile = ({ number, height = "h-72" }: { number?: number; height?: string }) => (
  <div
    className={`relative isolate flex ${height} w-full items-center justify-center overflow-hidden rounded-xl bg-surface-inverse text-content-inverse`}
  >
    <Meteors number={number} />
    <span className="relative z-10 text-display-3 font-display">Meteors</span>
  </div>
);

export const Default: Story = {
  render: (args) => (
    <DemoCard block className="overflow-hidden">
      <Tile number={args.number} />
    </DemoCard>
  ),
};

// Dense — a thicker shower (higher `number`).
export const Dense: Story = {
  render: () => (
    <DemoCard block className="overflow-hidden">
      <Tile number={40} />
    </DemoCard>
  ),
};

// Sparse — fewer meteors (lower `number`).
export const Sparse: Story = {
  render: () => (
    <DemoCard block className="overflow-hidden">
      <Tile number={8} />
    </DemoCard>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, Dense, Sparse) — one project Card each, name above.
// The effect is hosted as a dark tile inside the card.
const VARIANTS = [
  { label: "Default", number: 20 },
  { label: "Dense", number: 40 },
  { label: "Sparse", number: 8 },
] as const;

export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANTS.map((v) => ({
        label: v.label,
        className: "overflow-hidden",
        block: true,
        node: <Tile number={v.number} height="h-56" />,
      }))}
    />
  ),
};
