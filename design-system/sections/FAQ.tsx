"use client";

import type { CSSProperties } from "react";
import Accordion from "@/components/ui/Accordion";
import { useReveal } from "@/hooks/useReveal";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";

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

export default function FAQ({
  eyebrow,
  title,
  subtitle,
  items,
  surface = "grouped",
  indicator = "plus",
}: FAQProps) {
  const { ref, style, shown } = useReveal<HTMLDivElement>();
  // ECO-122: en `separated` cada tarjeta se revela UNA A UNA (stagger, delay incremental por índice); en
  // `grouped` (caja única) se mantiene el reveal único del bloque. El observer (ref) va en el contenedor.
  const isSeparated = surface === "separated";
  const cardReveal = (i: number): CSSProperties => ({
    opacity: shown ? 1 : 0,
    transform: shown ? "none" : "translateY(16px)",
    transition: `opacity 500ms ease ${i * 90}ms, transform 500ms ease ${i * 90}ms`,
    willChange: "opacity, transform",
  });
  return (
    // ECO-120 — compuesta con primitivas de layout: Section (banda + surface + ritmo `md`=80→96) + Container.
    // Ancho `md` (896): un acordeón es UI, no prosa pura → medida cómoda que da aire a preguntas/respuestas
    // largas (no las apila en columna estrecha en pantallas grandes) y se topa ahí (responsive, no se estira).
    <Section surface="secondary">
      <Container size="md">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          {eyebrow ? (
            <p className="text-caption font-semibold uppercase tracking-wider text-content-secondary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-display-2 font-bold text-content-primary">
            {title}
          </h2>
          {subtitle ? (
            <p className="mx-auto mt-1 max-w-xl text-body text-content-secondary">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div ref={ref} style={isSeparated ? undefined : style}>
          <Accordion
            surface={surface}
            indicator={indicator}
            itemStyle={isSeparated ? cardReveal : undefined}
            items={items.map((i) => ({
              title: i.question,
              children: (
                <p className="text-body text-content-secondary">
                  {i.answer}
                </p>
              ),
            }))}
          />
        </div>
      </Container>
    </Section>
  );
}
