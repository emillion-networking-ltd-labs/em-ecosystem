import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
