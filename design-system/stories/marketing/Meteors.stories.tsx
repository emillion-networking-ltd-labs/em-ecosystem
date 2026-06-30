import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Meteors } from "@/components/ui/Meteors";
import Card from "@/components/ui/Card";

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
    <Card className="overflow-hidden">
      <Tile number={args.number} />
    </Card>
  ),
};

// Dense — a thicker shower (higher `number`).
export const Dense: Story = {
  render: () => (
    <Card className="overflow-hidden">
      <Tile number={40} />
    </Card>
  ),
};

// Sparse — fewer meteors (lower `number`).
export const Sparse: Story = {
  render: () => (
    <Card className="overflow-hidden">
      <Tile number={8} />
    </Card>
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
    <div className="flex flex-col gap-6">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
          <Card className="overflow-hidden">
            <Tile number={v.number} height="h-56" />
          </Card>
        </div>
      ))}
    </div>
  ),
};
