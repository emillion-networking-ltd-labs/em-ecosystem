import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Group } from "./_helpers";

// Foundations/Story Conventions — the CANONICAL rules EVERY catalog story follows, in ALL sections
// (Primitives, Layout, Marketing, Sections, Charts, Decoration, Showcase). It documents the catalog itself —
// it registers no component. (ECO-109.)
const meta = {
  title: "Foundations/Story Conventions",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Rule({ children }: { children: ReactNode }) {
  return <li className="text-body text-content-secondary">{children}</li>;
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-surface-secondary px-1.5 py-0.5 text-caption font-mono text-content-primary">
      {children}
    </code>
  );
}

function Snippet({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border border-border-default bg-surface-secondary p-4 text-caption font-mono text-content-secondary">
      {children}
    </pre>
  );
}

export const StoryConventions: Story = {
  name: "Story Conventions",
  render: () => (
    <div className="mx-auto max-w-3xl px-6 py-10 text-content-primary">
      <h1 className="text-display-3 font-display font-bold">Story conventions</h1>
      <p className="mt-3 max-w-2xl text-body text-content-secondary">
        Every story in the catalog follows the same shape, in <strong>all</strong> sections. The rules
        below are the standard; a gate keeps coverage honest (<Code>npm run coverage</Code>). All catalog
        copy is in English, all colour comes from tokens, and stories never change a registered component —
        they only present it.
      </p>

      <Group
        title="The card frame"
        description="Every story shows its element inside the project Card (the card-flat surface) — centered, never floating loose in a corner of the canvas. This is what makes the whole catalog read as one."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            Wrap the element in <Code>{`<Card className="flex min-h-[140px] items-center justify-center">`}</Code>.
          </Rule>
          <Rule>
            <strong>Full-bleed effects</strong> (animated backgrounds like Aurora/Meteors/Spotlight/Ripple)
            can&apos;t use the padded card directly — host the effect as a <strong>tile inside</strong> the
            Card (a dark tile for light-on-dark effects; a taller tile for radial ones).
          </Rule>
          <Rule>
            <strong>Self-contained compositions</strong> (card grids like BentoGrid/CardHoverEffect) go
            inside the Card as a whole — one card around the composition.
          </Rule>
          <Rule>
            Don&apos;t override the global <Code>layout: &quot;fullscreen&quot;</Code> with{" "}
            <Code>padded</Code>/<Code>centered</Code> — that re-adds margins and breaks the full-width frame.
          </Rule>
        </ul>
        <Snippet>{`export const Default: Story = {
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <Component {...args} />
    </Card>
  ),
};`}</Snippet>
      </Group>

      <Group
        title="AllVariants — the final overview"
        description="The closing story of every file: one project Card per real variant, with the variant name ABOVE each card. It lets the component be read at a glance."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            One <Code>{`<Card>`}</Code> per <strong>real variant</strong> — a variant is a configuration
            that EXISTS as its own named story (section). Two sections → two cards; one → one.
          </Rule>
          <Rule>
            <strong>Never invent variants.</strong> If a configuration is worth showing in AllVariants, it
            must first exist as its own named story (e.g. Meteors&apos; <Code>Dense</Code>/<Code>Sparse</Code>).
          </Rule>
          <Rule>
            The variant name sits <strong>above</strong> each card, in a mono caption:{" "}
            <Code>text-caption text-content-tertiary font-mono</Code>.
          </Rule>
          <Rule>
            <strong>ALWAYS last</strong>, preceded by the marker comment{" "}
            <Code>{`// AllVariants — ALWAYS last:`}</Code> directly above the export.
          </Rule>
        </ul>
        <Snippet>{`// AllVariants — ALWAYS last: one project Card per real variant, name above.
const VARIANTS = [
  { label: "Default", node: <Component /> },
  { label: "Brand", node: <Component brand /> },   // each label = an existing section
];

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
          <Card className="flex min-h-[140px] items-center justify-center">{v.node}</Card>
        </div>
      ))}
    </div>
  ),
};`}</Snippet>
      </Group>

      <Group
        title="Ordering & naming"
        description="So the sidebar reads predictably."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            Order: <Code>Default</Code> (the playground) → one section per real variant/state → then{" "}
            <Code>AllVariants</Code> last.
          </Rule>
          <Rule>
            A literal size axis is named <Code>AllSizes</Code> (never a bare <Code>Sizes</Code>).
          </Rule>
          <Rule>All story names, captions and copy are in English.</Rule>
        </ul>
      </Group>
    </div>
  ),
};
