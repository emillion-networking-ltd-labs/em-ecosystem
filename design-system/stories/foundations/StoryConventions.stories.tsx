import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Group } from "./_helpers";
import { DemoCard, Variants, Sizes } from "../_kit";

// Foundations/Story Conventions — the CANONICAL rules EVERY catalog story follows, in ALL sections
// (Primitives, Layout, Marketing, Sections, Charts, Decoration, Showcase). It documents the catalog itself —
// it registers no component. A guard ENFORCES it (`npm run coverage` → check-story-norm), so nothing enters
// off-norm. (ECO-109 / ECO-112.)
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

// A stand-in "element" for the live examples — looks like a real CTA so the framing reads. `size` lets the
// AllSizes example show three real sizes.
function Sample({ children, size = "md" }: { children: ReactNode; size?: "sm" | "md" | "lg" }) {
  const pad =
    size === "sm" ? "px-3 py-1.5 text-caption" : size === "lg" ? "px-7 py-3.5 text-h3" : "px-5 py-2.5 text-body";
  return (
    <span className={`rounded-md bg-surface-inverse font-medium text-content-inverse ${pad}`}>{children}</span>
  );
}

export const StoryConventions: Story = {
  name: "Story Conventions",
  render: () => (
    <div className="mx-auto max-w-3xl px-6 py-10 text-content-primary">
      <h1 className="text-display-3 font-display font-bold">Story conventions</h1>
      <p className="mt-3 max-w-2xl text-body text-content-secondary">
        Every story in the catalog follows the same shape, in <strong>all</strong> sections. One principle
        drives it — <strong>three orthogonal axes</strong> — and a gate keeps it honest (
        <Code>npm run coverage</Code>). All copy is in English, all colour comes from tokens, and stories
        never change a registered component — they only present it.
      </p>

      <Group
        title="The three axes"
        description="Every component is described by three independent axes. Each has a FIXED home — they never mix or repeat."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            <strong>Style</strong> (variant / shape / brand) → <Code>AllVariants</Code>.
          </Rule>
          <Rule>
            <strong>Size</strong> (sm / md / lg) → <Code>AllSizes</Code> — only when the component has a size axis.
          </Rule>
          <Rule>
            <strong>State</strong> (disabled / loading / hover / pressed) → its own named story.
          </Rule>
        </ul>
        <p className="mt-3 text-body text-content-secondary">
          So <Code>AllVariants</Code> shows <strong>only style</strong>; sizes live in <Code>AllSizes</Code>.
          Never repeat a size inside AllVariants.
        </p>
      </Group>

      <Group
        title="Live example"
        description="The same rules, rendered with the shared kit. A single story shows its element in the project card; the overviews are one card per real item, with its label above."
      >
        <p className="mb-2 text-caption font-mono text-content-tertiary">a single story → DemoCard</p>
        <DemoCard>
          <Sample>Your element</Sample>
        </DemoCard>
        <p className="mb-2 mt-6 text-caption font-mono text-content-tertiary">
          AllVariants (style) → Variants — one card per real variant
        </p>
        <Variants
          items={[
            { label: "Default", node: <Sample>Default</Sample> },
            { label: "Brand", node: <Sample>Brand</Sample> },
          ]}
        />
        <p className="mb-2 mt-6 text-caption font-mono text-content-tertiary">
          AllSizes (size) → Sizes — one card per real size
        </p>
        <Sizes
          items={[
            { label: "sm · 32px", node: <Sample size="sm">Button</Sample> },
            { label: "md · 40px (default)", node: <Sample size="md">Button</Sample> },
            { label: "lg · 48px", node: <Sample size="lg">Button</Sample> },
          ]}
        />
      </Group>

      <Group
        title="Which frame, by section type"
        description="The element-in-a-card frame covers most cases; two kinds need a different treatment. Pick by what the component IS."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            <strong>Simple element</strong> (badge, marketing CTA, animated text) → <Code>DemoCard</Code>{" "}
            (centered). AllVariants = one card per style; AllSizes = one card per size.
          </Rule>
          <Rule>
            <strong>&quot;Matrix&quot; primitive</strong> (Button, Input, Select — variant × size × state) →{" "}
            <Code>AllVariants</Code> is an overview <strong>by variant</strong> (in the default size),{" "}
            <Code>AllSizes</Code> an overview <strong>by size</strong> (in the default variant). Never the full
            cartesian product — that&apos;s noise.
          </Rule>
          <Rule>
            <strong>Composition / grid</strong> (BentoGrid, CardHoverEffect, Pricing) → the whole composition
            inside one card: <Code>{`<DemoCard block>`}</Code>.
          </Rule>
          <Rule>
            <strong>Full-bleed effect</strong> (Aurora, Meteors, Ripple, Blob) → host it as a tile inside the
            card: <Code>{`<DemoCard block className="overflow-hidden">`}</Code> with a bounded height.
          </Rule>
          <Rule>
            <strong>Page section</strong> (Hero, FAQ, Testimonials) → full width, NOT inside a 140px card. Keep{" "}
            <Code>layout: &quot;fullscreen&quot;</Code>.
          </Rule>
          <Rule>
            <strong>Layout</strong> (Container, Grid, Stack, Split) → at real width, with placeholder content
            that reveals the structure.
          </Rule>
          <Rule>
            <strong>Charts</strong> → <Code>DemoCard</Code>; AllVariants = the real data states (data / empty).
          </Rule>
        </ul>
      </Group>

      <Group
        title="AllVariants — the style overview (always last)"
        description="The closing story of every file: one project Card per real STYLE variant, name above. Built with the kit."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            One card per <strong>real variant</strong> — a configuration that EXISTS as its own named story.
            Two sections → two cards. <strong>Never invent variants.</strong>
          </Rule>
          <Rule>
            Each variant is its <strong>own named story</strong> (<Code>Radial</Code>, <Code>Linear</Code>,{" "}
            <Code>Primary</Code>…); AllVariants only <strong>groups</strong> them. Never a single story that
            bundles several variants (no <Code>Variants</Code> story with Radial+Linear inside).
          </Rule>
          <Rule>
            <strong>Only when there are ≥2 style variants.</strong> With 0–1, <strong>omit</strong> AllVariants
            — an overview of one adds nothing (e.g. a pattern whose only style axis is a free color).
          </Rule>
          <Rule>
            AllVariants <strong>groups</strong> variants that already have a story — it never{" "}
            <strong>introduces</strong> one here for the first time. The bad pattern (which the guard rejects):
            just <Code>Default</Code> + an AllVariants full of variants never shown on their own.
          </Rule>
          <Rule>
            <strong>ALWAYS last</strong>, preceded by the marker <Code>{`// AllVariants — ALWAYS last:`}</Code>.
          </Rule>
          <Rule>
            Each card&apos;s <strong>label is the NAME of the story it mirrors</strong> (<Code>Default</Code>,{" "}
            <Code>Subtle</Code>, <Code>Bold</Code>…), not a different descriptive caption — so the
            correspondence with its own stories is obvious.
          </Rule>
          <Rule>
            <strong>No measures here</strong> (px, %, opacity, sizes). AllVariants is style <em>names</em> only;
            every measurement lives in <Code>AllSizes</Code> or in the measure stories — never in AllVariants.
          </Rule>
        </ul>
        <Snippet>{`// AllVariants — ALWAYS last: one project Card per real STYLE variant, name above.
import { Variants } from "../_kit";

const VARIANTS = [
  { label: "Default", node: <Component /> },
  { label: "Brand",   node: <Component brand /> },   // each label = an existing named story
];

export const AllVariants: Story = { render: () => <Variants items={VARIANTS} /> };`}</Snippet>
      </Group>

      <Group
        title="AllSizes — the size overview"
        description="When the component has a size axis: one card per real size, label above — right BEFORE AllVariants. Same kit, the Sizes helper."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            One card per <strong>real size</strong>, size only — no style mixed in.
          </Rule>
          <Rule>
            The label is the <strong>size token + its real measure</strong> for THIS component (e.g.{" "}
            <Code>sm · 12px</Code>, <Code>lg · 48px</Code>) — never a bare <Code>sm</Code>. It gives the reader
            (and the AI) the concrete value each size maps to. Mark the default, e.g.{" "}
            <Code>md · 16px (default)</Code>.
          </Rule>
          <Rule>
            Named <Code>AllSizes</Code> (never a bare <Code>Sizes</Code>); second-to-last, just before{" "}
            <Code>AllVariants</Code> — or <strong>last</strong> if the component has no AllVariants.
          </Rule>
          <Rule>
            <strong>Only for NAMED scales</strong> (sm/md/lg, declared in <Code>sizeClasses</Code> — e.g.
            Button, Blob). <strong>Continuous measures</strong> (gap, radius, stroke — arbitrary px) are NOT
            AllSizes: they go as <strong>parameter stories</strong> (<Code>Gaps</Code>, <Code>Radii</Code>,{" "}
            <Code>Strokes</Code>) with the measure in the label, before AllSizes/AllVariants.
          </Rule>
        </ul>
        <Snippet>{`// AllSizes — size overview. Label = size token + its real measure for this component.
import { Sizes } from "../_kit";

const SIZES = [
  { label: "sm · 12px",            node: <Component size="sm" /> },
  { label: "md · 16px (default)",  node: <Component size="md" /> },
  { label: "lg · 20px",            node: <Component size="lg" /> },
];

export const AllSizes: Story = { render: () => <Sizes items={SIZES} /> };`}</Snippet>
      </Group>

      <Group title="A single story — the card frame" description="Every non-overview story shows its element inside the project Card, centered, via DemoCard.">
        <Snippet>{`import { DemoCard } from "../_kit";

export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <Component {...args} />
    </DemoCard>
  ),
};`}</Snippet>
      </Group>

      <Group title="Ordering & naming" description="So the sidebar reads predictably.">
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            Order: <Code>Default</Code> (the playground, with <Code>args</Code>) → one section per real
            variant/state → <Code>AllSizes</Code> (if any — <strong>second-to-last</strong>, immediately before
            AllVariants) → <Code>AllVariants</Code> last.
          </Rule>
          <Rule>The size axis is named <Code>AllSizes</Code> (never a bare <Code>Sizes</Code>).</Rule>
          <Rule>Each story carries a <Code>{`// Name — what it is / when to use`}</Code> comment. All copy in English.</Rule>
        </ul>
      </Group>

      <Group
        title="Enforced, not just documented"
        description="A guard makes this non-optional — so new components inherit the norm by construction, with no hand-fixing later."
      >
        <p className="text-body text-content-secondary">
          <Code>npm run coverage</Code> runs <Code>check-story-norm</Code>, which FAILS the build if a component
          story is missing <Code>AllVariants</Code> (or it isn&apos;t last), if a component with a size axis is
          missing <Code>AllSizes</Code>, if <Code>AllSizes</Code> isn&apos;t second-to-last (right before
          AllVariants), if <Code>AllVariants</Code> mixes in sizes, or if a style variant (from{" "}
          <Code>variantClasses</Code>) appears only inside AllVariants without its own story. The doc
          explains; the guard obliges.
        </p>
      </Group>
    </div>
  ),
};
