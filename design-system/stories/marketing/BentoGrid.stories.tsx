import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";

// Aceternity UI (MIT), adopted verbatim in ECO-88. Asymmetric grid for highlighting features.
// The icon enters via the `icon` prop (no external icon dep in the component itself).
const meta = {
  title: "Marketing/BentoGrid",
  component: BentoGrid,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof BentoGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const Header = () => (
  <div className="flex h-full min-h-24 w-full rounded-xl [background-image:var(--gradient-brand)] opacity-80" />
);

// A token-driven glyph standing in for a real icon (passed through the `icon` prop).
const Glyph = () => (
  <div className="flex size-9 items-center justify-center rounded-lg bg-surface-secondary text-accent">
    <span className="text-body font-display">N</span>
  </div>
);

const items = [
  { title: "Fast by default", description: "Production performance out of the box.", className: "md:col-span-2" },
  { title: "Accessible", description: "WCAG AA by construction.", className: "" },
  { title: "Governed", description: "Tokens and a component registry.", className: "" },
  { title: "Composable", description: "Assembled per sector preset.", className: "md:col-span-2" },
];

export const Default: Story = {
  render: () => (
    <BentoGrid>
      {items.map((it) => (
        <BentoGridItem
          key={it.title}
          title={it.title}
          description={it.description}
          header={<Header />}
          className={it.className}
        />
      ))}
    </BentoGrid>
  ),
};

// WithIcons — the `icon` prop populated on every item.
export const WithIcons: Story = {
  render: () => (
    <BentoGrid>
      {items.map((it) => (
        <BentoGridItem
          key={it.title}
          title={it.title}
          description={it.description}
          header={<Header />}
          icon={<Glyph />}
          className={it.className}
        />
      ))}
    </BentoGrid>
  ),
};

// AllVariants — ALWAYS last: every real BentoGridItem prop combination.
export const AllVariants: Story = {
  render: () => (
    <BentoGrid>
      <BentoGridItem
        title="Header + icon + wide"
        description="Full item across two columns."
        header={<Header />}
        icon={<Glyph />}
        className="md:col-span-2"
      />
      <BentoGridItem
        title="Header only"
        description="No icon, single column."
        header={<Header />}
      />
      <BentoGridItem
        title="Icon, no header"
        description="Text-forward, glyph above the title."
        icon={<Glyph />}
      />
      <BentoGridItem
        title="Title + description only"
        description="The bare item with no header and no icon."
        className="md:col-span-2"
      />
    </BentoGrid>
  ),
};
