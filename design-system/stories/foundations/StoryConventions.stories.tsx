import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Group } from "./_helpers";

// Foundations/Story Conventions — the CANONICAL rules every catalog story follows (ECO-109). This is the
// written reference for the standard set in ECO-92/ECO-103: ordering, naming, and the mandatory AllVariants
// overview. It documents the catalog itself — it registers no component.
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
        Every story in the catalog follows the same shape, in <strong>all</strong> sections —
        Primitives, Layout, Marketing, Sections, Charts, Decoration. The rules below are the standard;
        a gate keeps them honest (<Code>npm run coverage</Code>). All catalog copy is in English.
      </p>

      <Group
        title="Ordering"
        description="One story per kind, top to bottom. AllVariants is always the last export."
      >
        <ol className="ml-5 list-decimal space-y-2">
          <Rule>
            <Code>Default</Code> — the playground (the component with its default args).
          </Rule>
          <Rule>
            Per-axis stories — one per real axis (variants, states, ratios…), named after the axis
            (e.g. <Code>Surfaces</Code>, <Code>Ratios</Code>, <Code>Columns</Code>,{" "}
            <Code>Gaps</Code>). The size axis is named <Code>AllSizes</Code> when the component has a
            literal <Code>size</Code> scale.
          </Rule>
          <Rule>Special / dedicated cases — distinct states worth their own story.</Rule>
          <Rule>
            <Code>AllVariants</Code> — <strong>ALWAYS last</strong>: a single overview of the whole
            component.
          </Rule>
        </ol>
      </Group>

      <Group
        title="AllVariants — the final overview"
        description="The closing story of every file. It walks every real axis (variants × sizes × shape × states) so the component can be read at a glance — even for a single-config component (then it is an overview of its real configurations)."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            Preceded by the marker comment{" "}
            <Code>{`// AllVariants — ALWAYS last:`}</Code> directly above the export.
          </Rule>
          <Rule>
            Each sub-group is labeled with a <strong>mono caption</strong>:{" "}
            <Code>text-caption text-content-tertiary font-mono</Code> — no background, no banner.
          </Rule>
          <Rule>
            The default value of each axis is marked <Code>(default)</Code>; size axes show their{" "}
            <Code>px</Code>.
          </Rule>
          <Rule>
            Tokens only — no raw hex, no inline colors. Width is fit-content unless the component is
            inherently full-width.
          </Rule>
        </ul>
        <Snippet>{`// AllVariants — ALWAYS last: every state at each size.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      {STATES.map(({ key, label, props }) => (
        <div key={key}>
          <p className="mb-2 text-caption text-content-tertiary font-mono">{label}</p>
          {/* …each size, mono caption with px + (default)… */}
        </div>
      ))}
    </div>
  ),
};`}</Snippet>
      </Group>

      <Group
        title="Framing — the demo cell"
        description="So the overview reads uniformly, every config that is a loose element (text, button, background, scroller, stat) sits in the SAME bordered demo cell + mono caption — not floating on the bare canvas. Marketing uses the shared `DemoCell`/`DemoStack` helper (stories/marketing/_frame.tsx)."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            The cell frame is fixed: <Code>rounded-2xl border border-border-default</Code>, centered,
            with a height. Text/buttons use a light <Code>bg-surface-secondary</Code> (the gray box);
            light-on-dark effects use <Code>bg-surface-inverse</Code>.
          </Rule>
          <Rule>
            Self-contained compositions that already render their own surface (card grids like
            BentoGrid/CardHoverEffect) are the exception — they are NOT wrapped in a second frame.
          </Rule>
        </ul>
      </Group>

      <Group
        title="Naming & language"
        description="Consistent names so the sidebar reads predictably."
      >
        <ul className="ml-5 list-disc space-y-2">
          <Rule>
            The literal size axis is <Code>AllSizes</Code> (never a bare <Code>Sizes</Code>).
          </Rule>
          <Rule>All story names, captions and copy are in English.</Rule>
          <Rule>
            Stories never change a registered component — they only present it. Catalog work is{" "}
            stories-only.
          </Rule>
        </ul>
      </Group>
    </div>
  ),
};
