import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Zap, Accessibility, ShieldCheck, Blocks, type LucideIcon } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { DemoCard, Variants } from "../_kit";

// Aceternity UI (MIT), adopted verbatim in ECO-88. Asymmetric grid for highlighting features.
// The icon enters via the `icon` prop — a feature glyph above the title: a bare lucide glyph at the default
// 16px size, in `content-primary` (same colour as the title, for visibility).
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

// A feature glyph: a bare lucide icon at the default 16px size, in the title's colour (content-primary).
const Glyph = ({ icon: Icon }: { icon: LucideIcon }) => (
  <Icon size={16} className="text-content-primary" />
);

const items: { title: string; description: string; className: string; icon: LucideIcon }[] = [
  { title: "Fast by default", description: "Production performance out of the box.", className: "md:col-span-2", icon: Zap },
  { title: "Accessible", description: "WCAG AA by construction.", className: "", icon: Accessibility },
  { title: "Governed", description: "Tokens and a component registry.", className: "", icon: ShieldCheck },
  { title: "Composable", description: "Assembled per sector preset.", className: "md:col-span-2", icon: Blocks },
];

const Grid = ({ withIcons = false }: { withIcons?: boolean }) => (
  <BentoGrid>
    {items.map((it) => (
      <BentoGridItem
        key={it.title}
        title={it.title}
        description={it.description}
        header={<Header />}
        icon={withIcons ? <Glyph icon={it.icon} /> : undefined}
        className={it.className}
      />
    ))}
  </BentoGrid>
);

export const Default: Story = {
  render: () => (
    <DemoCard block>
      <Grid />
    </DemoCard>
  ),
};

// WithIcons — the `icon` prop populated on every item.
export const WithIcons: Story = {
  render: () => (
    <DemoCard block>
      <Grid withIcons />
    </DemoCard>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, WithIcons) — one project Card each (block, since the
// grid keeps its own width), name above.
const VARIANTS = [
  { label: "Default", node: <Grid />, block: true },
  { label: "WithIcons", node: <Grid withIcons />, block: true },
];

export const AllVariants: Story = {
  render: () => <Variants items={VARIANTS} />,
};
