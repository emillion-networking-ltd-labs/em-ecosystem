"use client";

import { useReveal } from "@/hooks/useReveal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// Sección PRECIOS del design system (ECO-55, nivel 2). Planes con PRECIOS REALES del cliente (del brief —
// JAMÁS inventados; sin precios, el generador omite la sección). Plan destacado en marca (accent). Reveal
// escalonado, token-safe (sin card-flat ni tamaños ad-hoc), a11y.
export interface Plan {
  name: string;
  price: string;        // verbatim del brief (p.ej. "45€", "Desde 30€") — no se reformatea
  period?: string;      // p.ej. "/mes"
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
  ctaHref?: string;     // destino del botón de cada plan (default /contact)
  highlightLabel?: string;
}

function PricingCard({ plan, index, ctaHref, highlightLabel }: { plan: Plan; index: number; ctaHref: string; highlightLabel: string }) {
  const { ref, style } = useReveal<HTMLDivElement>({ delay: (index % 3) * 90 });
  return (
    <div
      ref={ref}
      style={style}
      className={`relative flex flex-col rounded-2xl border bg-surface-primary p-6 ${
        plan.highlighted ? "border-accent ring-1 ring-accent/20" : "border-border-default"
      }`}
    >
      {plan.highlighted ? (
        <div className="absolute -top-3 left-6">
          <Badge variant="warning" size="sm">
            {highlightLabel}
          </Badge>
        </div>
      ) : null}
      <h3 className="text-h2 font-semibold text-content-primary">{plan.name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-content-primary">{plan.price}</span>
        {plan.period ? <span className="text-caption text-content-tertiary">{plan.period}</span> : null}
      </div>
      {plan.description ? <p className="mt-2 text-body text-content-secondary">{plan.description}</p> : null}
      {plan.features && plan.features.length ? (
        <ul className="mt-5 flex-1 space-y-2">
          {plan.features.map((feat, i) => (
            <li key={i} className="flex items-start gap-2 text-body text-content-secondary">
              <span aria-hidden="true" className="mt-0.5 text-accent">&#10003;</span>
              {feat}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-6">
        <Button as="a" href={ctaHref} variant={plan.highlighted ? "primary" : "outline"} size="lg" fullWidth>
          {plan.cta || "Empezar"}
        </Button>
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
  highlightLabel = "Más elegido",
}: PricingProps) {
  return (
    <section className="bg-surface-secondary">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="flex flex-col items-center gap-2 text-center">
          {eyebrow ? (
            <Badge variant="default" size="sm" className="text-accent">
              {eyebrow}
            </Badge>
          ) : null}
          <h2 className="text-3xl font-bold text-content-primary sm:text-4xl">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-xl text-body text-content-secondary">{subtitle}</p> : null}
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <PricingCard key={`${plan.name}-${i}`} plan={plan} index={i} ctaHref={ctaHref} highlightLabel={highlightLabel} />
          ))}
        </div>
      </div>
    </section>
  );
}
