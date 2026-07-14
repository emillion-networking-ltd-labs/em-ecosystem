"use client";

import { Check } from "lucide-react";
import Icon from "@/components/ui/Icon";
import { useReveal } from "@/hooks/useReveal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Grid } from "@/components/ui/Grid";

// Sección PRECIOS del design-system (ECO-55; REFINADA ECO-93: lenguaje NEUTRO + primitivos). Planes con
// PRECIOS REALES del cliente (del brief — JAMÁS inventados; sin precios, el generador omite la sección). El
// plan destacado se distingue por un borde fuerte NEUTRO + elevación (no por el accent placeholder). Eyebrow
// neutro (sin Badge), título en `display`, check con icono PRIMITIVO (lucide), CTA con el primitivo `Button`,
// label del destacado con el primitivo `Badge` (neutro). Reveal escalonado, a11y.
export interface Plan {
  name: string;
  price: string; // verbatim del brief (p.ej. "45€", "Desde 30€") — no se reformatea
  period?: string; // p.ej. "/mes"
  description?: string;
  features?: string[];
  highlighted?: boolean;
  cta?: string;
}
export interface PricingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  plans: Plan[];
  ctaHref?: string; // destino del botón de cada plan (default /contact)
  highlightLabel?: string;
}

function PricingCard({
  plan,
  index,
  ctaHref,
  highlightLabel,
}: {
  plan: Plan;
  index: number;
  ctaHref: string;
  highlightLabel: string;
}) {
  const { ref, style } = useReveal<HTMLDivElement>({ delay: (index % 3) * 90 });
  return (
    <div ref={ref} style={style} className="h-full">
      <div
        className={`relative flex h-full flex-col rounded-2xl border bg-surface-elevated p-6 transition-[border-color,box-shadow] duration-[var(--duration-fast)] hover:border-border-strong hover:shadow-card ${
          plan.highlighted
            ? "border-border-strong shadow-card"
            : "border-border-default"
        }`}
      >
        {plan.highlighted ? (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge variant="overlay" size="sm">
              {highlightLabel}
            </Badge>
          </div>
        ) : null}
        <h3 className="text-h2 font-semibold text-content-primary">
          {plan.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-h1 font-bold text-content-primary">
            {plan.price}
          </span>
          {plan.period ? (
            <span className="text-caption text-content-tertiary">
              {plan.period}
            </span>
          ) : null}
        </div>
        {plan.description ? (
          <p className="mt-2 text-body text-content-secondary">
            {plan.description}
          </p>
        ) : null}
        {plan.features && plan.features.length ? (
          <ul className="mt-5 flex-1 space-y-2">
            {plan.features.map((feat, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-body text-content-secondary"
              >
                <Icon
                  icon={Check}
                  size="md"
                  aria-hidden
                  className="mt-0.5 shrink-0 text-content-primary"
                />
                {feat}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-6">
          <Button
            as="a"
            href={ctaHref}
            variant={plan.highlighted ? "primary" : "outline"}
            size="lg"
            fullWidth
          >
            {plan.cta || "Get started"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Pricing({
  eyebrow,
  title,
  subtitle,
  plans,
  ctaHref = "/contact",
  highlightLabel = "Most popular",
}: PricingProps) {
  return (
    // ECO-120 — compuesta con primitivas: Section (banda + surface + ritmo `md`) + Container (ancho canónico
    // `xl`=1280) + Grid. `cols={{ base: 1, md: 3 }}` reproduce EXACTO el 1→3 original (el objeto responsive que
    // ECO-131 añadió a Grid), en vez de max-w/py/grid ad-hoc.
    <Section surface="secondary">
      <Container size="xl">
        <div className="flex flex-col items-center gap-2 text-center">
          {eyebrow ? (
            <p className="text-caption font-semibold uppercase tracking-wider text-content-secondary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-display-2 font-bold text-content-primary">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 max-w-xl text-body text-content-secondary">
              {subtitle}
            </p>
          ) : null}
        </div>
        <Grid cols={{ base: 1, md: 3 }} gap="md" className="mt-12">
          {plans.map((plan, i) => (
            <PricingCard
              key={`${plan.name}-${i}`}
              plan={plan}
              index={i}
              ctaHref={ctaHref}
              highlightLabel={highlightLabel}
            />
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
