"use client";

import Button from "@/components/ui/Button";
import { useReveal } from "@/hooks/useReveal";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";

// Sección CTA del design-system — REFINADA ECO-93 siguiendo el sat (CTASection): banda de CIERRE a ancho
// completo, forzada a tema OSCURO (clase `dark`, como el footer) para máximo contraste — titular display +
// descripción + acciones (primitivo Button) + nota. Se usa al FINAL de las páginas (en el sat aparece en
// servicios/portfolio/testimonios/precios). Lenguaje NEUTRO: el oscuro sale de los tokens surface/content, NO
// de un color de marca. El CONTENIDO entra por props (nunca inventado). Reveal on-scroll, a11y.
export interface CTAProps {
  title: string;
  description?: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  note?: string;
}

export default function CTA({
  title,
  description,
  primaryCtaText,
  primaryCtaHref,
  secondaryCtaText,
  secondaryCtaHref,
  note,
}: CTAProps) {
  const { ref, style } = useReveal<HTMLDivElement>();
  return (
    // ECO-120 — compuesta con primitivas: `Section surface="inverse"` abre el scope de tema OSCURO (ECO-131) →
    // banda siempre oscura con los tokens hijos invertidos, sin `.dark` a mano. Container da la medida centrada.
    <Section surface="inverse" spacing="lg">
      <Container size="sm">
        <div ref={ref} style={style} className="text-center">
          <h2 className="mx-auto max-w-2xl font-display text-display-2 font-bold text-content-primary">
            {title}
          </h2>
          {description ? (
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-content-secondary">
              {description}
            </p>
          ) : null}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button as="a" href={primaryCtaHref} variant="primary" size="lg">
              {primaryCtaText}
            </Button>
            {secondaryCtaText && secondaryCtaHref ? (
              <Button
                as="a"
                href={secondaryCtaHref}
                variant="outline"
                size="lg"
              >
                {secondaryCtaText}
              </Button>
            ) : null}
          </div>
          {note ? (
            <p className="mt-6 text-caption text-content-tertiary">{note}</p>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
