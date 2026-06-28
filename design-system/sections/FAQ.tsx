"use client";

import Accordion from "@/components/ui/Accordion";
import { useReveal } from "@/hooks/useReveal";

// Sección FAQ del design-system — REFINADA ECO-93 siguiendo el sat (página /precios): cabecera estándar + el
// primitivo `Accordion` (animación de apertura grid-rows; indicador `plus` `+`→`×` por defecto). Surface a
// elegir (`grouped` caja única / `separated` tarjetas con separación). Preguntas REALES del cliente (del brief
// — nunca inventadas; sin items, se omite). Lenguaje NEUTRO, primitivos. Reveal below-the-fold, a11y.
export interface FAQItem {
  question: string;
  answer: string;
}
export interface FAQProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: FAQItem[];
  /** Disposición del acordeón: `grouped` (caja única, default) o `separated` (tarjetas). */
  surface?: "grouped" | "separated";
  /** Indicador de apertura. Default `plus` (`+`→`×`). */
  indicator?: "chevron" | "plus";
}

export default function FAQ({ eyebrow, title, subtitle, items, surface = "grouped", indicator = "plus" }: FAQProps) {
  const { ref, style } = useReveal<HTMLDivElement>();
  return (
    <section className="bg-surface-secondary">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          {eyebrow ? (
            <p className="text-caption font-semibold uppercase tracking-wider text-content-secondary">{eyebrow}</p>
          ) : null}
          <h2 className="font-display text-display-2 font-bold text-content-primary">{title}</h2>
          {subtitle ? <p className="mx-auto mt-1 max-w-xl text-body text-content-secondary">{subtitle}</p> : null}
        </div>
        <div ref={ref} style={style}>
          <Accordion
            surface={surface}
            indicator={indicator}
            items={items.map((i) => ({
              title: i.question,
              children: <p className="text-body leading-relaxed text-content-secondary">{i.answer}</p>,
            }))}
          />
        </div>
      </div>
    </section>
  );
}
