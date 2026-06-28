import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Group, TokenMeta, useVar } from "./_helpers";

// Foundations/Typography — familias y escalas tipográficas (ECO-95). La familia DISPLAY/SERIF cambia
// con el preset de marca (toolbar); las escalas (tamaños) son semánticas y no cambian.
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
        title="Familias"
        description="display y serif son MARCA (cambian con el preset); sans es la base semántica del producto."
      >
        <Family token="--font-display" className="text-display-3 font-display" label="Display — titulares de marketing" />
        <Family token="--font-serif" className="text-h1 font-serif" label="Serif — cuerpo editorial" />
        <Family token="--font-sans" className="text-h1 font-sans" label="Sans — UI y cuerpo del producto" />
      </Group>

      <Group
        title="Escala display"
        description="Tipografía fluida (clamp) para hero/marketing — cosechada del benchmark sat-cristian-garcia."
      >
        <Size utility="text-display-1 font-display" token="--text-display-1" className="text-display-1 font-display" />
        <Size utility="text-display-2 font-display" token="--text-display-2" className="text-display-2 font-display" />
        <Size utility="text-display-3 font-display" token="--text-display-3" className="text-display-3 font-display" />
      </Group>

      <Group title="Escala base" description="Escala de producto (dashboard): titulares h1–h3, cuerpo y caption.">
        <Size utility="text-h1" token="--text-h1" className="text-h1 font-semibold" />
        <Size utility="text-h2" token="--text-h2" className="text-h2 font-semibold" />
        <Size utility="text-h3" token="--text-h3" className="text-h3 font-semibold" />
        <Size utility="text-body" token="--text-body" className="text-body" />
        <Size utility="text-caption" token="--text-caption" className="text-caption" />
      </Group>
    </div>
  ),
};
