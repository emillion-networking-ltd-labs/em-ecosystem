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

function Family({
  token,
  className,
  label,
}: {
  token: string;
  className: string;
  label: string;
}) {
  const [ref, val] = useVar(token);
  return (
    <div ref={ref} className="border-b border-border-default py-4">
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
    <div
      ref={ref}
      className="flex items-baseline justify-between gap-6 border-b border-border-default py-3"
    >
      <span className={`${className} text-content-primary`}>
        The quick brown fox
      </span>
      <div className="shrink-0 text-right">
        <code className="text-caption font-mono text-content-secondary">
          {utility}
        </code>
        <br />
        <code className="text-caption font-mono text-content-secondary">
          {val || "—"}
        </code>
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
        <Family
          token="--font-display"
          className="text-display-3 font-display"
          label="Display — marketing headlines"
        />
        <Family
          token="--font-serif"
          className="text-h1 font-serif"
          label="Serif — editorial body"
        />
        <Family
          token="--font-sans"
          className="text-h1 font-sans"
          label="Sans — product UI and body"
        />
      </Group>

      <Group
        title="Display scale"
        description="Fluid typography (clamp) for hero/marketing — harvested from the sat-cristian-garcia benchmark."
      >
        <Size
          utility="text-display-1 font-display"
          token="--text-display-1"
          className="text-display-1 font-display"
        />
        <Size
          utility="text-display-2 font-display"
          token="--text-display-2"
          className="text-display-2 font-display"
        />
        <Size
          utility="text-display-3 font-display"
          token="--text-display-3"
          className="text-display-3 font-display"
        />
      </Group>

      <Group
        title="Base scale"
        description="Product scale (dashboard): h1–h3 headings, body and caption."
      >
        <Size
          utility="text-h1"
          token="--text-h1"
          className="text-h1 font-semibold"
        />
        <Size
          utility="text-h2"
          token="--text-h2"
          className="text-h2 font-semibold"
        />
        <Size
          utility="text-h3"
          token="--text-h3"
          className="text-h3 font-semibold"
        />
        <Size utility="text-body" token="--text-body" className="text-body" />
        <Size
          utility="text-caption"
          token="--text-caption"
          className="text-caption"
        />
      </Group>
    </div>
  ),
};

// One usage pattern: the real example + its class (mono) + when to use it.
function UsageRow({
  sample,
  cls,
  when,
}: {
  sample: ReactNode;
  cls: string;
  when: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border-default py-3">
      <div className="min-w-0 text-content-primary">{sample}</div>
      <div className="shrink-0 text-right">
        <code className="text-caption font-mono text-content-secondary">
          {cls}
        </code>
        <p className="text-caption text-content-secondary">{when}</p>
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
        <UsageRow
          sample={<h1 className="text-h1 font-semibold">Page heading</h1>}
          cls="text-h1 font-semibold"
          when="Page / card heading (most used)"
        />
        <UsageRow
          sample={<h2 className="text-h2 font-semibold">Section title</h2>}
          cls="text-h2 font-semibold"
          when="Section title"
        />
        <UsageRow
          sample={
            <h3 className="text-h3 font-semibold">Card / subsection title</h3>
          }
          cls="text-h3 font-semibold"
          when="Card / subsection title (e.g. CardHoverEffect)"
        />
        <UsageRow
          sample={
            <p className="text-caption font-semibold uppercase tracking-wider text-content-secondary">
              Eyebrow label
            </p>
          }
          cls="text-caption font-semibold uppercase tracking-wider"
          when="Eyebrow / subsection label"
        />
        <UsageRow
          sample={
            <p className="text-body">
              Body copy for paragraphs and descriptions.
            </p>
          }
          cls="text-body"
          when="Body / paragraph — content primary|secondary|tertiary by hierarchy (14px · 21px lh)"
        />
        <UsageRow
          sample={
            <p className="text-body font-semibold text-content-primary">
              Label / strong body
            </p>
          }
          cls="text-body font-semibold text-content-primary"
          when="Label, name, emphasised body (very common)"
        />
        <UsageRow
          sample={
            <p className="text-caption text-content-secondary">
              Caption / metadata
            </p>
          }
          cls="text-caption text-content-secondary"
          when="Caption, meta, mono labels"
        />
        <UsageRow
          sample={
            <p className="text-caption font-semibold text-content-secondary">
              Highlighted meta
            </p>
          }
          cls="text-caption font-semibold text-content-secondary"
          when="Emphasised subtitle / meta (e.g. testimonial role)"
        />
        <UsageRow
          sample={<span className="text-h1 font-black">500+</span>}
          cls="text-h1 font-black"
          when="Marketing / hero stat (HeroStatCard, NumberTicker)"
        />
        <UsageRow
          sample={<span className="text-h1">1,284</span>}
          cls="text-h1"
          when="Dashboard metric (MetricCard)"
        />
        <UsageRow
          sample={<span className="text-display-3 font-display">Display</span>}
          cls="text-display-* font-display"
          when="Marketing hero / display headlines"
        />
      </Group>

      <Group title="Rules">
        <ul className="flex flex-col gap-2 text-body text-content-secondary">
          <li>
            <span className="font-semibold text-content-primary">Weight:</span>{" "}
            font-semibold for UI headings (text-h*); font-bold / font-black for
            marketing display; font-normal for body.
          </li>
          <li>
            <span className="font-semibold text-content-primary">
              Line-height:
            </span>{" "}
            always from the token (px). Never leading-relaxed (a ratio → off the
            px scale).
          </li>
          <li>
            <span className="font-semibold text-content-primary">
              Don&apos;t invent sizes:
            </span>{" "}
            match the equivalent component of the project (dashboard /
            sections).
          </li>
        </ul>
      </Group>
    </div>
  ),
};

// ── Usage guide (canonical) — the authoritative pattern per text role. Born from the ECO-135 typography
//    concordance study (404 usages harvested + verified). New components MUST copy the role's class here.
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-surface-secondary px-1.5 py-0.5 text-caption font-mono text-content-primary">
      {children}
    </code>
  );
}

// GuideTable — one row per text role: role · exact class · when. The header + <code> dogfood the very tokens
// this table documents (table header = caption/semibold/uppercase/secondary; code = mono/caption/primary).
function GuideTable({
  rows,
}: {
  rows: readonly { role: string; cls: string; when: string }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {["Role", "Class", "When"].map((h) => (
              <th
                key={h}
                className="border-b border-border-strong px-3 py-2 text-caption font-semibold uppercase tracking-wider text-content-secondary"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.role} className="align-top">
              <td className="border-b border-border-default px-3 py-2 text-body text-content-primary">
                {r.role}
              </td>
              <td className="border-b border-border-default px-3 py-2">
                <code className="rounded bg-surface-secondary px-1.5 py-0.5 text-caption font-mono text-content-primary">
                  {r.cls}
                </code>
              </td>
              <td className="border-b border-border-default px-3 py-2 text-body text-content-secondary">
                {r.when}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const G_HEADINGS = [
  { role: "Page / section heading (h2)", cls: "text-h2 font-semibold text-content-primary", when: "Dashboard page header, modal title, in-app section heading." },
  { role: "Card / widget / subsection title (h3)", cls: "text-h3 font-semibold text-content-primary", when: "Canonical card/widget title (charts, portfolio cards, sidebar wordmark). Marketing sections deliberately scale it to h2." },
  { role: "Marketing headline — hero (h1)", cls: "font-display text-display-1 font-bold text-content-inverse", when: "Hero headline over a dark / media surface (use text-content-primary over light)." },
  { role: "Marketing headline — section (h2)", cls: "font-display text-display-2 font-bold text-content-primary", when: "Marketing section headings. Use text-content-inverse over dark." },
  { role: "Marketing headline — demo (h3)", cls: "font-display text-display-3 font-bold text-content-primary", when: "Small display specimens / demos." },
] as const;

const G_BODY = [
  { role: "Body / paragraph (subtitle, description, lead)", cls: "text-body font-normal text-content-secondary", when: "Supporting copy under a title — subtitles, descriptions, leads. Muted by default." },
  { role: "Label / strong body", cls: "text-body font-semibold text-content-primary", when: "Inline emphasis, author names, figcaptions. (font-medium is NOT a DS weight.)" },
  { role: "Input label (above the field)", cls: "text-body font-semibold text-content-primary", when: "Form label above the control. Error: text-error/75. Inline labels beside a checkbox/toggle/slider stay font-normal." },
  { role: "Eyebrow / kicker (uppercase)", cls: "text-caption font-semibold uppercase tracking-wider text-content-secondary", when: "Small uppercase kicker above a marketing heading." },
] as const;

const G_CONTROLS = [
  { role: "Button label — primary", cls: "text-body font-normal text-content-inverse", when: "Primary button (dark fill). Size: sm→text-caption, md→text-body, lg→text-h3." },
  { role: "Button label — secondary", cls: "text-body font-normal text-content-secondary", when: "Secondary button (bg-surface-tertiary)." },
  { role: "Button label — outline", cls: "text-body font-normal text-content-primary", when: "Outline button, Cancel actions." },
  { role: "Button label — danger", cls: "text-body font-normal text-error", when: "Destructive button (paired with border-error-border)." },
  { role: "Inline link", cls: "text-body font-normal text-content-primary/75 hover:text-content-primary", when: "In-flow link. Inactive /75 → full primary on hover (the DS link idiom)." },
  { role: "Nav link / item", cls: "text-body font-normal text-content-primary/75 hover:text-content-primary", when: "Tabs nav, breadcrumbs, sidebar leaves. Active item: text-content-primary." },
  { role: "Input value", cls: "text-body font-normal text-content-primary", when: "The typed value — it IS the data, so primary." },
  { role: "Placeholder", cls: "text-body text-content-placeholder", when: "Placeholder text. Use the dedicated token, not a faded gray." },
  { role: "Helper / error text", cls: "text-caption font-normal text-error", when: "Field validation / inline error under a control." },
  { role: "Code / mono value", cls: "font-mono text-body font-normal text-content-primary", when: "Copyable codes, recovery codes, MFA digits, QR value." },
] as const;

const G_DATA = [
  { role: "Table header", cls: "text-caption font-semibold uppercase tracking-wider text-content-secondary", when: "The th of a data table." },
  { role: "Table cell", cls: "text-body font-normal text-content-primary", when: "The td datum." },
  { role: "Table empty message", cls: "text-body font-normal text-content-secondary", when: "No results / empty row." },
  { role: "Badge text", cls: "text-caption font-normal text-content-primary", when: "Default badge (sm). md→text-body; overlay→text-content-inverse; kbd→font-mono; variants use their semantic colour." },
  { role: "Caption / metadata", cls: "text-caption font-normal text-content-secondary", when: "Informational meta (rating counts, kit labels, emails). Overview / token labels may add font-mono." },
  { role: "Stat / metric (dashboard)", cls: "text-h1 font-normal text-content-primary", when: "MetricCard number, NumberTicker base. Tabular figures via tabular-nums. No weight = normal." },
  { role: "Stat / metric (marketing / hero)", cls: "text-h1 font-black text-content-primary", when: "Hero / marketing stat. Over media use text-content-inverse; a true hero may scale to text-display-*." },
] as const;

const G_FEEDBACK = [
  { role: "Toast title", cls: "text-caption font-semibold text-content-primary", when: "Toast heading." },
  { role: "Toast description", cls: "text-caption font-normal text-content-secondary", when: "Toast body." },
  { role: "Tooltip", cls: "text-caption font-normal text-content-primary", when: "Tooltip content." },
  { role: "Empty state title", cls: "text-body font-semibold text-content-primary", when: "EmptyState heading." },
  { role: "Empty state description", cls: "text-caption font-normal text-content-secondary", when: "EmptyState body — canonical is content-secondary (matches the Toast / modal description pattern)." },
] as const;

// Usage guide — CANONICAL text pattern per role. ECO-102: don't invent a size/weight; find the role, copy the class.
export const UsageGuide: Story = {
  name: "Usage guide",
  render: () => (
    <div className="mx-auto max-w-4xl px-6 py-10 text-content-primary">
      <h1 className="text-display-3 font-display font-bold">Typography — usage guide</h1>
      <p className="mt-3 max-w-2xl text-body text-content-secondary">
        The canonical pattern for every text role in the catalog.{" "}
        <span className="font-semibold text-content-primary">ECO-102 — never invent a size or weight</span>:
        find the equivalent role below and copy its exact class. Loose Tailwind sizes (<Code>text-sm</Code>/
        <Code>lg</Code>/<Code>2xl</Code>), <Code>text-[Npx]</Code> and arbitrary <Code>leading</Code>/
        <Code>tracking</Code> are non-DS — line-height and letter-spacing already live inside each size token.
      </p>

      <Group title="Headings &amp; display">
        <GuideTable rows={G_HEADINGS} />
      </Group>
      <Group title="Body &amp; labels">
        <GuideTable rows={G_BODY} />
      </Group>
      <Group title="Controls — buttons, inputs, links">
        <GuideTable rows={G_CONTROLS} />
      </Group>
      <Group title="Data &amp; meta — tables, badges, captions, stats">
        <GuideTable rows={G_DATA} />
      </Group>
      <Group title="Feedback &amp; overlays — toast, tooltip, empty state">
        <GuideTable rows={G_FEEDBACK} />
      </Group>

      <Group title="Intensity rule" description="Pick the colour by the text's job, not its size.">
        <ul className="ml-5 list-disc space-y-2 text-body text-content-secondary">
          <li>
            <Code>content-primary</Code> — the actual content: titles, input values, table cells, body being
            read, dashboard metrics.
          </li>
          <li>
            <Code>content-secondary</Code> — anything that labels, describes or accompanies: subtitles, leads,
            descriptions, functional captions, chart legends, eyebrows, table headers, muted meta.
          </li>
          <li>
            <Code>content-tertiary</Code> — ONLY enumerated faint decoration: price <Code>/period</Code>,
            lightbox counter, calendar other-month day, separators / chevrons / ellipsis. Never for functional
            labels, captions or legends.
          </li>
          <li>
            <Code>content-inverse</Code> — any text on a dark surface or dark fill (primary button, overlay
            badge, hero over media).
          </li>
          <li>
            <Code>content-primary/75</Code> — the inactive state of a link / nav item only (→ full{" "}
            <Code>content-primary</Code> on hover).
          </li>
          <li>
            <Code>text-error</Code> / <Code>text-warning</Code> / <Code>text-success</Code> /{" "}
            <Code>text-info</Code> — semantic states. Don&apos;t fake them with a gray.
          </li>
        </ul>
      </Group>

      <Group title="Never">
        <ul className="ml-5 list-disc space-y-2 text-body text-content-secondary">
          <li>
            Loose Tailwind sizes (<Code>text-sm/lg/xl/2xl/3xl</Code>) — use a{" "}
            <Code>text-h1/h2/h3/body/caption/display-*</Code> token.
          </li>
          <li>
            Arbitrary sizes: <Code>text-[14px]</Code>, any <Code>text-[…]</Code>.
          </li>
          <li>
            Arbitrary <Code>leading-*</Code> / <Code>tracking-*</Code> — the size token already carries them
            (only sanctioned exception: <Code>uppercase tracking-wider</Code> on eyebrow &amp; table header).
          </li>
          <li>
            Invented weights: <Code>font-medium</Code>, <Code>font-light</Code>, <Code>font-extrabold</Code>{" "}
            are not DS weights. Allowed: <Code>font-normal</Code> (body / values / buttons),{" "}
            <Code>font-semibold</Code> (UI titles / labels), <Code>font-bold</Code> / <Code>font-black</Code>{" "}
            (marketing display &amp; stats).
          </li>
          <li>
            Raw hex colours — always a <Code>content-*</Code>, <Code>content-inverse</Code>,{" "}
            <Code>content-primary/75</Code> or semantic <Code>text-*</Code> token.
          </li>
        </ul>
      </Group>
    </div>
  ),
};
