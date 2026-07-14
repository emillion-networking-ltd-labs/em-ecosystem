// Shared presentation for the Foundations pages (ECO-95). NOT a story (no `.stories` suffix), so the
// catalog glob doesn't load it; the Foundations stories import it. Reads each token's COMPUTED value in
// the current tree → reflects the active brand preset and theme live.
import React, { useEffect, useRef, useState } from "react";

/** Computed value of a CSS var at this point in the tree (follows the toolbar preset/theme). */
export function useVar(token: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [val, setVal] = useState("");
  useEffect(() => {
    if (ref.current)
      setVal(getComputedStyle(ref.current).getPropertyValue(token).trim());
  });
  return [ref, val] as const;
}

export function Group({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-h2 font-semibold text-content-primary">{title}</h2>
      {description && (
        <p className="mt-1 mb-4 max-w-2xl text-body text-content-secondary">
          {description}
        </p>
      )}
      {children}
    </section>
  );
}

export function TokenMeta({ token, value }: { token: string; value?: string }) {
  return (
    <div className="flex flex-col">
      <code className="text-caption font-mono text-content-secondary">
        {token}
      </code>
      {value !== undefined && (
        <code className="text-caption font-mono text-content-secondary">
          {value || "—"}
        </code>
      )}
    </div>
  );
}

export function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 items-start gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  );
}

/** Color swatch: the box paints `var(--token)` and its computed value is read below. */
export function ColorSwatch({ token, note }: { token: string; note?: string }) {
  const [ref, val] = useVar(token);
  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div
        className="h-16 w-full rounded-xl border border-line-strong"
        style={{ background: `var(${token})` }}
      />
      {note && (
        <span className="text-caption text-content-secondary">{note}</span>
      )}
      <TokenMeta token={token} value={val} />
    </div>
  );
}
