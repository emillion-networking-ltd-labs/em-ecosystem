"use client";

import { Check } from "lucide-react";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Accordion from "@/components/ui/Accordion";
import { useReveal } from "@/hooks/useReveal";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";

// Sección SERVICIOS del design-system — REFINADA ECO-93 replicando la ESTRUCTURA EXACTA de la PÁGINA de
// servicios (/servicios) de sat-cristian-garcia (NO el teaser de la home), con lenguaje NEUTRO (tokens).
// Estructura del benchmark: cabecera centrada (etiqueta + título display + subtítulo) y una LISTA VERTICAL
// (max-w-4xl) de servicios detallados; cada tarjeta `card-flat` (primitivo) con hover de borde ACTIVO trae un
// NÚMERO de índice grande + (título + badge de categoría) + descripción completa + un `Accordion` (primitivo)
// "qué incluye" con la lista de features (check con icono primitivo lucide). Marca por token (--color-accent):
// lienzo en blanco. El CONTENIDO entra por props (nunca inventado). Reveal escalonado, a11y.
export interface ServiceItem {
  /** Categoría/etiqueta (badge). */
  label: string;
  title: string;
  /** Descripción completa del servicio. */
  fullDesc: string;
  /** Lo que incluye (acordeón). Opcional. */
  features?: string[];
}
export interface ServicesProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  services: ServiceItem[];
  /** Título del acordeón "qué incluye" (default "What's included"). */
  featuresTitle?: string;
}

function ServiceCard({
  service,
  index,
  featuresTitle,
}: {
  service: ServiceItem;
  index: number;
  featuresTitle: string;
}) {
  const { ref, style } = useReveal<HTMLDivElement>({
    delay: (index % 3) * 120,
  });
  return (
    <div ref={ref} style={style}>
      <div className="card-flat scroll-mt-24 transition-[border-color,box-shadow] duration-[var(--duration-fast)] hover:border-border-strong hover:shadow-card">
        <div className="flex items-start gap-5">
          <span className="text-h1 font-black text-content-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
              <h2 className="text-h2 font-semibold text-content-primary">
                {service.title}
              </h2>
              <Badge variant="default" size="sm">
                {service.label}
              </Badge>
            </div>
            <p className="mt-2 text-body text-content-secondary">
              {service.fullDesc}
            </p>
            {service.features && service.features.length ? (
              <div className="mt-4">
                <Accordion
                  items={[
                    {
                      title: featuresTitle,
                      children: (
                        <ul className="space-y-1">
                          {service.features.map((f) => (
                            <li
                              key={f}
                              className="flex items-start gap-2 text-body text-content-secondary"
                            >
                              <Icon
                                icon={Check}
                                size="md"
                                aria-hidden
                                className="mt-0.5 shrink-0 text-content-primary"
                              />
                              {f}
                            </li>
                          ))}
                        </ul>
                      ),
                    },
                  ]}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Services({
  eyebrow,
  title,
  subtitle,
  services,
  featuresTitle = "What's included",
}: ServicesProps) {
  return (
    // ECO-120 — Section (banda + surface + ritmo `md`=80→96, antes py-20 plano sin escalar) + Container `md`
    // (=896, la medida de la lista) → un único ancho gobernado, sin el max-w-4xl interno ad-hoc.
    <Section surface="secondary">
      <Container size="md">
        <div className="mb-12 text-center">
          {eyebrow ? (
            <p className="text-caption font-semibold uppercase tracking-wider text-content-secondary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 font-display text-display-2 font-bold text-content-primary">
            {title}
          </h2>
          {subtitle ? (
            <p className="mx-auto mt-3 max-w-xl text-body text-content-secondary">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="space-y-6">
          {services.map((s, i) => (
            <ServiceCard
              key={s.label}
              service={s}
              index={i}
              featuresTitle={featuresTitle}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
