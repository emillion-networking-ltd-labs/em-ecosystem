// Presentación compartida de las Foundations (ECO-95). NO es una story (sin sufijo `.stories`),
// el glob del catálogo no la carga; las stories de Foundations la importan. Lee el valor COMPUTADO
// de cada token en el árbol actual → refleja en vivo el preset de marca y el tema activos.
import React, { useEffect, useRef, useState } from "react";

/** Valor computado de una CSS var en este punto del árbol (sigue al preset/tema de la toolbar). */
export function useVar(token: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [val, setVal] = useState("");
  useEffect(() => {
    if (ref.current) setVal(getComputedStyle(ref.current).getPropertyValue(token).trim());
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
        <p className="mt-1 mb-4 max-w-2xl text-body text-content-secondary">{description}</p>
      )}
      {children}
    </section>
  );
}

export function TokenMeta({ token, value }: { token: string; value?: string }) {
  return (
    <div className="flex flex-col">
      <code className="text-caption font-mono text-content-tertiary">{token}</code>
      {value !== undefined && (
        <code className="text-caption font-mono text-content-tertiary">{value || "—"}</code>
      )}
    </div>
  );
}

export function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
  );
}

/** Muestra de color: el cuadro pinta `var(--token)` y debajo se lee su valor computado. */
export function ColorSwatch({ token, note }: { token: string; note?: string }) {
  const [ref, val] = useVar(token);
  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div
        className="h-16 w-full rounded-lg border border-border-default"
        style={{ background: `var(${token})` }}
      />
      <TokenMeta token={token} value={val} />
      {note && <span className="text-caption text-content-secondary">{note}</span>}
    </div>
  );
}
