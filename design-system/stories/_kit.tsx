// Shared building blocks for the catalog's story conventions (ECO-110). NOT a story (the catalog glob only
// loads *.stories.{ts,tsx}), so it is imported, never catalogued. It encodes the norm documented in
// Foundations/Story Conventions so every story is built the same way — and new components inherit it for free.
import type { ReactNode } from "react";
import Card from "@/components/ui/Card";

const FRAME = "flex min-h-[140px] items-center justify-center";

// DemoCard — the project Card frame every story's element sits in (centered). `className` tunes the
// interior per need (e.g. "overflow-hidden" to host a full-bleed effect tile) without losing the frame.
// `block` drops the centering frame for full-width compositions (card grids) that must keep their own width.
export function DemoCard({
  className = "",
  block = false,
  children,
}: {
  className?: string;
  block?: boolean;
  children: ReactNode;
}) {
  return <Card className={`${block ? "" : FRAME} ${className}`.trim()}>{children}</Card>;
}

export interface Variant {
  /** The variant name — must match an existing named story (section). Shown above its card. */
  label: string;
  /** What renders inside the card. */
  node: ReactNode;
  /** Optional interior tuning for this card (e.g. "overflow-hidden" for an effect tile). */
  className?: string;
  /** Drop the centering frame — for full-width compositions (card grids). */
  block?: boolean;
}

// Variants — the AllVariants overview: one project Card per REAL variant, with its name above each card.
// ALWAYS the last export of a file. Pass only variants that exist as their own named story — never invent.
export function Variants({ items }: { items: Variant[] }) {
  return (
    <div className="flex flex-col gap-6">
      {items.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
          <DemoCard className={v.className ?? ""} block={v.block ?? false}>
            {v.node}
          </DemoCard>
        </div>
      ))}
    </div>
  );
}
