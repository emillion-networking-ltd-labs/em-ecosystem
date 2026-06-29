import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { Group, TokenMeta, useVar } from "./_helpers";

// Foundations/Typography — type families and scales (ECO-95). The DISPLAY/SERIF family changes with the
// brand preset (toolbar); the scales (sizes) are semantic and don't change.
const meta = {
  title: "Foundations/Typography",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Family({ token, className, label }: { token: string; className: string; label: string }) {
  const [ref, val] = useVar(token);
  return (
    <div ref={ref} className="border-b border-border-subtle py-4">
      <p className={`${className} text-content-primary`}>{label}</p>
      <TokenMeta token={token} value={val} />
    </div>
  );
}

function Size({
  utility,
  token,
  className,
}: {
  utility: string;
  token: string;
  className: string;
}) {
  const [ref, val] = useVar(token);
  return (
    <div ref={ref} className="flex items-baseline justify-between gap-6 border-b border-border-subtle py-3">
      <span className={`${className} text-content-primary`}>The quick brown fox</span>
      <div className="shrink-0 text-right">
        <code className="text-caption font-mono text-content-tertiary">{utility}</code>
        <br />
        <code className="text-caption font-mono text-content-tertiary">{val || "—"}</code>
      </div>
    </div>
  );
}

export const Typography: Story = {
  render: () => (
    <div className="text-content-primary">
      <Group
        title="Families"
        description="display and serif are BRAND (they change with the preset); sans is the product's semantic base."
      >
        <Family token="--font-display" className="text-display-3 font-display" label="Display — marketing headlines" />
        <Family token="--font-serif" className="text-h1 font-serif" label="Serif — editorial body" />
        <Family token="--font-sans" className="text-h1 font-sans" label="Sans — product UI and body" />
      </Group>

      <Group
        title="Display scale"
        description="Fluid typography (clamp) for hero/marketing — harvested from the sat-cristian-garcia benchmark."
      >
        <Size utility="text-display-1 font-display" token="--text-display-1" className="text-display-1 font-display" />
        <Size utility="text-display-2 font-display" token="--text-display-2" className="text-display-2 font-display" />
        <Size utility="text-display-3 font-display" token="--text-display-3" className="text-display-3 font-display" />
      </Group>

      <Group title="Base scale" description="Product scale (dashboard): h1–h3 headings, body and caption.">
        <Size utility="text-h1" token="--text-h1" className="text-h1 font-semibold" />
        <Size utility="text-h2" token="--text-h2" className="text-h2 font-semibold" />
        <Size utility="text-h3" token="--text-h3" className="text-h3 font-semibold" />
        <Size utility="text-body" token="--text-body" className="text-body" />
        <Size utility="text-caption" token="--text-caption" className="text-caption" />
      </Group>
    </div>
  ),
};

// One usage pattern: the real example + its class (mono) + when to use it.
function UsageRow({ sample, cls, when }: { sample: ReactNode; cls: string; when: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border-subtle py-3">
      <div className="min-w-0 text-content-primary">{sample}</div>
      <div className="shrink-0 text-right">
        <code className="text-caption font-mono text-content-tertiary">{cls}</code>
        <p className="text-caption text-content-tertiary">{when}</p>
      </div>
    </div>
  );
}

// In use — how we use type across the project (dashboard + sections). The canonical usage guide:
// don't invent sizes/weights, take the pattern of the equivalent component (ECO-102).
export const InUse: Story = {
  name: "In use",
  render: () => (
    <div className="text-content-primary">
      <Group
        title="In use"
        description="Real usage patterns from the dashboard & sections. Don't invent sizes/weights — take the pattern of the equivalent component."
      >
        <UsageRow sample={<h1 className="text-h1 font-semibold">Page heading</h1>} cls="text-h1 font-semibold" when="Page / card heading (most used)" />
        <UsageRow sample={<h2 className="text-h2 font-semibold">Section title</h2>} cls="text-h2 font-semibold" when="Section title" />
        <UsageRow sample={<h3 className="text-h3 font-semibold">Card / subsection title</h3>} cls="text-h3 font-semibold" when="Card / subsection title (e.g. CardHoverEffect)" />
        <UsageRow
          sample={<p className="text-h3 font-semibold uppercase tracking-wider text-content-secondary">Eyebrow label</p>}
          cls="text-h3 font-semibold uppercase tracking-wider"
          when="Eyebrow / subsection label"
        />
        <UsageRow sample={<p className="text-body">Body copy for paragraphs and descriptions.</p>} cls="text-body" when="Body / paragraph — content primary|secondary|tertiary by hierarchy (21px token)" />
        <UsageRow
          sample={<p className="text-body font-semibold text-content-primary">Label / strong body</p>}
          cls="text-body font-semibold text-content-primary"
          when="Label, name, emphasised body (very common)"
        />
        <UsageRow sample={<p className="text-caption text-content-tertiary">Caption / metadata</p>} cls="text-caption text-content-tertiary" when="Caption, meta, mono labels" />
        <UsageRow
          sample={<p className="text-caption font-semibold text-content-secondary">Highlighted meta</p>}
          cls="text-caption font-semibold text-content-secondary"
          when="Emphasised subtitle / meta (e.g. testimonial role)"
        />
        <UsageRow sample={<span className="text-h1 font-black">500+</span>} cls="text-h1 font-black" when="Marketing / hero stat (HeroStatCard, NumberTicker)" />
        <UsageRow sample={<span className="text-h1">1,284</span>} cls="text-h1" when="Dashboard metric (MetricCard)" />
        <UsageRow sample={<span className="text-display-3 font-display">Display</span>} cls="text-display-* font-display" when="Marketing hero / display headlines" />
      </Group>

      <Group title="Rules">
        <ul className="flex flex-col gap-2 text-body text-content-secondary">
          <li>
            <span className="font-semibold text-content-primary">Weight:</span> font-semibold for UI
            headings (text-h*); font-bold / font-black for marketing display; font-normal for body.
          </li>
          <li>
            <span className="font-semibold text-content-primary">Line-height:</span> always from the token
            (px). Never leading-relaxed (a ratio → off the px scale).
          </li>
          <li>
            <span className="font-semibold text-content-primary">Don&apos;t invent sizes:</span> match the
            equivalent component of the project (dashboard / sections).
          </li>
        </ul>
      </Group>
    </div>
  ),
};
