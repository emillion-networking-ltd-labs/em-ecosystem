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
    <pre className="mt-3 overflow-x-auto rounded-lg border border-border-default bg-surface-primary p-4 text-caption font-mono text-content-secondary">
      {children}
    </pre>
  );
}

// A stand-in "element" for the live examples — looks like a real CTA so the framing reads. `size` lets the
// AllSizes example show three real sizes.
function Sample({
  children,
  size = "md",
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const pad =
    size === "sm"
      ? "px-3 py-1.5 text-caption"
      : size === "lg"
        ? "px-7 py-3.5 text-h3"
        : "px-5 py-2.5 text-body";
  return (
    <span
      className={`rounded-md bg-surface-inverse font-normal text-content-inverse ${pad}`}
    >
      {children}
    </span>
  );
}

export const StoryConventions: Story = {
  name: "Story Conventions",
  render: () => (
    <div className="mx-auto max-w-3xl px-6 py-10 text-content-primary">
      <h1 className="text-display-3 font-display font-bold">
        Story conventions
      </h1>
      <p className="mt-3 max-w-2xl text-body text-content-secondary">
        Every story in the catalog follows the same shape, in{" "}
        <strong>all</strong> sections. One principle drives it —{" "}
        <strong>five buckets</strong> (three axes: variant / size / shape, plus
        state and content) — and a gate keeps it honest (
        <Code>npm run coverage</Code>). All copy is in English, all colour comes
        from tokens, and stories never change a registered component — they only
        present it.
      </p>

      <Group
        title="The five buckets"
        description="Every story falls into one of five buckets, each with a FIXED home — they never mix or repeat. The three AXES (variant / size / shape) change how it LOOKS and compose with each other; State and Content are orthogonal to all of them."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            <strong>Variant</strong> (the style/colour axis: primary, danger,
            brand…) → one story each, grouped by <Code>AllVariants</Code>{" "}
            (always last).
          </Rule>
          <Rule>
            <strong>Size</strong> (sm / md / lg) → <Code>AllSizes</Code> — when
            the component has a size axis.
          </Rule>
          <Rule>
            <strong>Shape</strong> (default / circle…) → its OWN story (e.g.{" "}
            <Code>Shape</Code>), NOT inside AllVariants — a separate axis, like
            size.
          </Rule>
          <Rule>
            <strong>State</strong> (disabled / loading / hover / pressed) → a{" "}
            <Code>States</Code> overview (grouped — one card per state, like
            AllVariants). Runtime state, not a variant.
          </Rule>
          <Rule>
            <strong>Content</strong> (an icon in the children, a back-link
            arrow…) → a <Code>Content</Code> overview (grouped). It is{" "}
            <em>what goes inside</em> — orthogonal to every axis; any variant
            accepts it.
          </Rule>
        </ul>
        <p className="mt-3 text-body text-content-secondary">
          So <Code>AllVariants</Code> shows{" "}
          <strong>only the variant axis</strong>; sizes live in{" "}
          <Code>AllSizes</Code>, shape in its own story. Never mix two axes in
          one overview. Order in the file: Variant → State → Content →
          Size/Shape overviews → <Code>AllVariants</Code> last.
        </p>
      </Group>

      <Group
        title="Live example"
        description="The same rules, rendered with the shared kit. A single story shows its element in the project card; the overviews are one card per real item, with its label above."
      >
        <p className="mb-2 text-caption font-mono text-content-secondary">
          a single story → DemoCard
        </p>
        <DemoCard>
          <Sample>Your element</Sample>
        </DemoCard>
        <p className="mb-2 mt-6 text-caption font-mono text-content-secondary">
          AllVariants (style) → Variants — one card per real variant
        </p>
        <Variants
          items={[
            { label: "Default", node: <Sample>Default</Sample> },
            { label: "Brand", node: <Sample>Brand</Sample> },
          ]}
        />
        <p className="mb-2 mt-6 text-caption font-mono text-content-secondary">
          AllSizes (size) → Sizes — one card per real size
        </p>
        <Sizes
          items={[
            { label: "sm · 32px", node: <Sample size="sm">Button</Sample> },
            {
              label: "md · 40px (default)",
              node: <Sample size="md">Button</Sample>,
            },
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
            <strong>Simple element</strong> (badge, marketing CTA, animated
            text) → <Code>DemoCard</Code> (centered). AllVariants = one card per
            style; AllSizes = one card per size.
          </Rule>
          <Rule>
            <strong>&quot;Matrix&quot; primitive</strong> (Button, Input, Select
            — variant × size × state) → <Code>AllVariants</Code> is an overview{" "}
            <strong>by variant</strong> (in the default size),{" "}
            <Code>AllSizes</Code> an overview <strong>by size</strong> (in the
            default variant). Never the full cartesian product — that&apos;s
            noise.
          </Rule>
          <Rule>
            <strong>Default is CENTERED</strong> (<Code>DemoCard</Code>, no{" "}
            <Code>block</Code>): the element is centered both axes at a prudent,
            uniform width. This is the case for almost everything — a table, a
            trigger, a top-bar row, a scroll demo, a selector: all{" "}
            <strong>centered</strong>, never left-aligned. If a demo looks tiny
            because it shrinks to its content, wrap it in a fixed width (e.g.{" "}
            <Code>w-[560px]</Code>) so all its stories match.
          </Rule>
          <Rule>
            <strong>
              Full-width (<Code>block</Code>) is the EXCEPTION
            </strong>{" "}
            — only for elements that are meant to span full width: a real card
            grid (BentoGrid, CardHoverEffect, Pricing), a full-bleed effect
            tile, or the <Code>Card</Code> surface itself. Having several parts
            does <strong>not</strong> make a demo full-width — a multi-part demo
            is still centered.
          </Rule>
          <Rule>
            <strong>Full-bleed effect</strong> (Aurora, Meteors, Ripple, Blob) →
            host it as a tile inside the card:{" "}
            <Code>{`<DemoCard block className="overflow-hidden">`}</Code> with a
            bounded height.
          </Rule>
          <Rule>
            <strong>Page section</strong> (Hero, FAQ, Testimonials) → full
            width, NOT inside a 140px card. Keep{" "}
            <Code>layout: &quot;fullscreen&quot;</Code>.
          </Rule>
          <Rule>
            <strong>Layout</strong> (Container, Grid, Stack, Split, Section) →
            at real width, with placeholder content that reveals the structure.
            A layout primitive has <strong>no design-variant axis</strong> →{" "}
            <strong>no AllVariants</strong>. A structural axis that reads
            clearly (cols, ratio, align, surface) → its own named story; an
            incidental <Code>gap</Code> → just a Control on <Code>Default</Code>
            . <Code>AllSizes</Code> is{" "}
            <strong>only the element&apos;s OWN size</strong> (e.g.
            Container&apos;s max-width) — a spacing/gap measure is a parameter,
            not AllSizes, even when it has named tiers.
          </Rule>
          <Rule>
            <strong>Charts</strong> → <Code>DemoCard</Code>; AllVariants = the
            real data states (data / empty).
          </Rule>
        </ul>
      </Group>

      <Group
        title="Which border — frame vs element"
        description="Every bordered thing in a story plays one of three roles. The border token follows the ROLE, never a hand-picked value — so a future colour change propagates cleanly to it."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            <strong>Frame drawn ON the container being demonstrated</strong>{" "}
            (the <Code>DemoCard</Code>; or a layout primitive&apos;s own frame
            when the border sits on the container itself — a <Code>Stack</Code>,
            a <Code>Cluster</Code>, a <Code>Section</Code> band showing its
            padding) → <Code>border-default</Code> (the card token). DemoCard
            already <em>is</em> a <Code>Card</Code> ={" "}
            <Code>border-default</Code>, so a hand-rolled frame matches it.
          </Rule>
          <Rule>
            <strong>
              A discrete element / panel / marker drawn as the content
            </strong>{" "}
            (a placeholder box, <Code>Split</Code>&apos;s media panel,{" "}
            <Code>Container</Code>&apos;s measure box, the content box inside a
            padded band) → <Code>border-strong</Code> (the element token).
            Tell-tale: the container is invisible and you border a{" "}
            <em>child</em> to reveal the structure.
          </Rule>
          <Rule>
            <strong>Invisible layout wrapper</strong> (<Code>Container</Code>,{" "}
            <Code>Grid</Code>) → <strong>no border</strong>. It only clamps
            width / lays out — it is not a surface.
          </Rule>
          <Rule>
            <strong>Mandatory by the norm</strong>: an input&apos;s{" "}
            <em>border</em> → <Code>border-components</Code> (WCAG 3:1,
            gate-enforced by <Code>check-contrast</Code>). Its{" "}
            <em>focus ring</em> → <Code>content-primary</Code> (a stronger
            indicator than the resting border). By design{" "}
            <strong>only inputs</strong> carry a custom focus ring — other
            controls keep the browser default. A shadowed popup/dropdown uses{" "}
            <Code>border-strong</Code> (the shadow is the indicator — the border
            is decorative).
          </Rule>
          <Rule>
            <strong>
              Identify by what the element IS, not the token it already has
              (ECO-136).
            </strong>{" "}
            A token can be mis-coded — copied from another pattern. The test is
            visual: <em>if you saw it rendered, what is it?</em> A{" "}
            <strong>card</strong> (a surface box holding content —{" "}
            <Code>bg-surface-*</Code> + <Code>rounded-*</Code> + padding, that
            you don&apos;t fill or toggle) → <Code>border-default</Code>,
            <em>even if it was coded with</em> <Code>border-components</Code>. A
            card wearing the input token{" "}
            <strong>stands out for no reason</strong> — whole sections read as
            highlighted. Keep <Code>border-components</Code>{" "}
            <strong>only</strong> for a real input/control the user fills or
            toggles. Same visual role → same token: uniformity, nothing
            highlighted without cause.
          </Rule>
          <Rule>
            <strong>
              Relleno vs sin-relleno decide en un control interactivo (ECO-136).
            </strong>{" "}
            Un botón/target SIN relleno propio (fondo = la página —{" "}
            <Code>bg-surface-primary</Code> — o transparente), donde el
            <em>borde es la ÚNICA afordancia</em>, lleva{" "}
            <Code>border-components</Code> aunque sea un botón: su límite debe
            percibirse a WCAG 3:1 (ej. un botón de paginación inactivo, un botón{" "}
            <em>outline</em>). Un botón CON relleno propio (
            <Code>bg-surface-inverse/tertiary/subtle</Code>, como Button primary
            / secondary) → <Code>border-strong</Code>: el relleno es la
            afordancia, el borde es secundario.
          </Rule>
          <Rule>
            The deciding question: is the border{" "}
            <strong>ON the container</strong> being demonstrated (→{" "}
            <Code>border-default</Code>) or on a{" "}
            <strong>discrete element/panel</strong> shown as its content (→{" "}
            <Code>border-strong</Code>)? Pick the <em>role</em> —{" "}
            <strong>never a raw value</strong> (a hex, an{" "}
            <Code>rgba()</Code>, or a Tailwind palette colour) that merely matches — {/* raw-color-ok: prose that TEACHES the norm */}
            a non-token value cannot be re-themed and breaks propagation.
          </Rule>
        </ul>
      </Group>

      <Group
        title="AllVariants — the style overview (always last)"
        description="The closing story of every file: one project Card per real STYLE variant, name above. Built with the kit."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            A <strong>design variant</strong> is a visual STYLE choice (variant
            / shape / brand) — <strong>not a parameter or option</strong>{" "}
            (surface, columns, ratio, alignment, count). A parameter gets its
            own named story; it <strong>never</strong> becomes AllVariants. If a
            component has no style axis (e.g. a layout primitive), it has{" "}
            <strong>no AllVariants at all</strong>.
          </Rule>
          <Rule>
            One card per <strong>real variant</strong> — a configuration that
            EXISTS as its own named story. Two sections → two cards.{" "}
            <strong>Never invent variants.</strong>
          </Rule>
          <Rule>
            Each variant is its <strong>own named story</strong> (
            <Code>Radial</Code>, <Code>Linear</Code>, <Code>Primary</Code>…);
            AllVariants only <strong>groups</strong> them. Never a single story
            that bundles several variants (no <Code>Variants</Code> story with
            Radial+Linear inside).
          </Rule>
          <Rule>
            <strong>Only when there are ≥2 style variants.</strong> With 0–1,{" "}
            <strong>omit</strong> AllVariants — an overview of one adds nothing
            (e.g. a pattern whose only style axis is a free color).
          </Rule>
          <Rule>
            AllVariants <strong>groups</strong> variants that already have a
            story — it never <strong>introduces</strong> one here for the first
            time. The bad pattern (which the guard rejects): just{" "}
            <Code>Default</Code> + an AllVariants full of variants never shown
            on their own.
          </Rule>
          <Rule>
            <strong>ALWAYS last</strong>, preceded by the marker{" "}
            <Code>{`// AllVariants — ALWAYS last:`}</Code>.
          </Rule>
          <Rule>
            Each card&apos;s{" "}
            <strong>label is the NAME of the story it mirrors</strong> (
            <Code>Default</Code>, <Code>Subtle</Code>, <Code>Bold</Code>…), not
            a different descriptive caption — so the correspondence with its own
            stories is obvious.
          </Rule>
          <Rule>
            <strong>No measures here</strong> (px, %, opacity, sizes).
            AllVariants is style <em>names</em> only; every measurement lives in{" "}
            <Code>AllSizes</Code> or in the measure stories — never in
            AllVariants.
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
            One card per <strong>real size</strong>, size only — no style mixed
            in.
          </Rule>
          <Rule>
            The label is the <strong>size token + its real measure</strong> for
            THIS component (e.g. <Code>sm · 12px</Code>, <Code>lg · 48px</Code>)
            — never a bare <Code>sm</Code>. It gives the reader (and the AI) the
            concrete value each size maps to. Mark the default, e.g.{" "}
            <Code>md · 16px (default)</Code>.
          </Rule>
          <Rule>
            Named <Code>AllSizes</Code> (never a bare <Code>Sizes</Code>);
            second-to-last, just before <Code>AllVariants</Code> — or{" "}
            <strong>last</strong> if the component has no AllVariants.
          </Rule>
          <Rule>
            <strong>Only for NAMED scales</strong> (sm/md/lg, declared in{" "}
            <Code>sizeClasses</Code> — e.g. Button, Blob).{" "}
            <strong>Continuous measures</strong> (gap, radius, stroke —
            arbitrary px) are NOT AllSizes: they go as{" "}
            <strong>parameter stories</strong> (<Code>Gaps</Code>,{" "}
            <Code>Radii</Code>, <Code>Strokes</Code>) with the measure in the
            label, before AllSizes/AllVariants.
          </Rule>
          <Rule>
            <strong>
              A measure earns a story only if its variation is instructive
            </strong>{" "}
            — when the measure IS the component&apos;s point (DotPattern
            radius/gap define the texture). <strong>Incidental spacing</strong>{" "}
            whose tiers read the same (a layout <Code>gap</Code> between panels)
            does NOT get a story: leave it adjustable from the{" "}
            <Code>Default</Code> Controls. An overview of three near-identical
            measures is noise.
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

      <Group
        title="A single story — the card frame"
        description="Every non-overview story shows its element inside the project Card, centered, via DemoCard."
      >
        <Snippet>{`import { DemoCard } from "../_kit";

export const Default: Story = {
  render: (args) => (
    <DemoCard>
      <Component {...args} />
    </DemoCard>
  ),
};`}</Snippet>
      </Group>

      <Group
        title="Ordering & naming"
        description="So the sidebar reads predictably."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            Order: <Code>Default</Code> (the playground, with <Code>args</Code>)
            → one section per real variant/state → <Code>AllSizes</Code> (if any
            — <strong>second-to-last</strong>, immediately before AllVariants) →{" "}
            <Code>AllVariants</Code> last.
          </Rule>
          <Rule>
            The size axis is named <Code>AllSizes</Code> (never a bare{" "}
            <Code>Sizes</Code>).
          </Rule>
          <Rule>
            Each story carries a{" "}
            <Code>{`// Name — what it is / when to use`}</Code> comment. All
            copy in English.
          </Rule>
          <Rule>
            <strong>Theme is global</strong> — the Storybook toolbar switches
            light/dark; a story renders in the current theme.{" "}
            <strong>Never</strong> <Code>Light</Code>/<Code>Dark</Code> stories
            (that duplicates the toolbar). A prop that forces a specific
            backdrop (e.g. a chart on a dark surface) is a{" "}
            <em>surface/context</em> variant, named as such — not a theme story.
          </Rule>
        </ul>
      </Group>

      <Group
        title="Enforced, not just documented"
        description="A guard makes this non-optional — so new components inherit the norm by construction, with no hand-fixing later."
      >
        <p className="text-body text-content-secondary">
          <Code>npm run coverage</Code> runs <Code>check-story-norm</Code>,
          which FAILS the build if a component story is missing{" "}
          <Code>AllVariants</Code> (or it isn&apos;t last), if a component with
          a size axis is missing <Code>AllSizes</Code>, if <Code>AllSizes</Code>{" "}
          isn&apos;t second-to-last (right before AllVariants), if{" "}
          <Code>AllVariants</Code> mixes in sizes, or if a style variant (from{" "}
          <Code>variantClasses</Code>) appears only inside AllVariants without
          its own story. The doc explains; the guard obliges.
        </p>
      </Group>
    </div>
  ),
};
