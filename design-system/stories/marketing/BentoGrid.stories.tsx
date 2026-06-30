import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import Card from "@/components/ui/Card";

// Aceternity UI (MIT), adopted verbatim in ECO-88. Asymmetric grid for highlighting features.
// The icon enters via the `icon` prop (no external icon dep in the component itself).
const meta = {
  title: "Marketing/BentoGrid",
  component: BentoGrid,
  tags: ["autodocs"],
} satisfies Meta<typeof BentoGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const Header = () => (
  <div className="flex h-full min-h-24 w-full rounded-xl [background-image:var(--gradient-brand)] opacity-80" />
);

// A token-driven glyph standing in for a real icon (passed through the `icon` prop).
const Glyph = () => (
  <div className="flex size-9 items-center justify-center rounded-lg bg-surface-secondary text-content-primary">
    <span className="text-body font-display">N</span>
  </div>
);

const items = [
  { title: "Fast by default", description: "Production performance out of the box.", className: "md:col-span-2" },
  { title: "Accessible", description: "WCAG AA by construction.", className: "" },
  { title: "Governed", description: "Tokens and a component registry.", className: "" },
  { title: "Composable", description: "Assembled per sector preset.", className: "md:col-span-2" },
];

const Grid = ({ withIcons = false }: { withIcons?: boolean }) => (
  <BentoGrid>
    {items.map((it) => (
      <BentoGridItem
        key={it.title}
        title={it.title}
        description={it.description}
        header={<Header />}
        icon={withIcons ? <Glyph /> : undefined}
        className={it.className}
      />
    ))}
  </BentoGrid>
);

export const Default: Story = {
  render: () => (
    <Card>
      <Grid />
    </Card>
  ),
};

// WithIcons — the `icon` prop populated on every item.
export const WithIcons: Story = {
  render: () => (
    <Card>
      <Grid withIcons />
    </Card>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, WithIcons) — one project Card each, name above.
const VARIANTS = [
  { label: "Default", node: <Grid /> },
  { label: "WithIcons", node: <Grid withIcons /> },
];

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
          <Card>{v.node}</Card>
        </div>
      ))}
    </div>
  ),
};
