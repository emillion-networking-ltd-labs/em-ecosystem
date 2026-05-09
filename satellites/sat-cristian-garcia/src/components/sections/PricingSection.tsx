"use client";

import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useFadeInOnView } from "@/lib/useFadeInOnView";
import { pricingPlans } from "@/lib/data";

type Plan = (typeof pricingPlans)[number];

function PricingPlanCard({ plan, index }: { plan: Plan; index: number }) {
  // Per-card IntersectionObserver. On mobile the 3 plan cards stack vertically
  // (~500px each) — total > 1 viewport. Section-level stagger would fire all
  // 3 at once when the first comes into view. Same fix as /sobre-mi timeline.
  const { ref, className, style } = useFadeInOnView<HTMLDivElement>({
    delay: index * 100,
  });
  return (
    <div
      ref={ref}
      style={style}
      className={`card-flat relative flex flex-col ${plan.highlighted ? "border-accent ring-1 ring-accent/20" : ""} ${className}`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-6">
          <Badge variant="warning" size="sm">
            Mas elegido
          </Badge>
        </div>
      )}
      <h3 className="text-h2 font-semibold text-content-primary">
        {plan.name}
      </h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-black text-content-primary">
          {plan.price}&euro;
        </span>
        <span className="text-caption text-content-tertiary">
          {plan.period}
        </span>
      </div>
      <p className="mt-2 text-body text-content-secondary">
        {plan.description}
      </p>
      <ul className="mt-5 flex-1 space-y-2">
        {plan.features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-body text-content-secondary"
          >
            <span className="mt-0.5 text-accent">&#10003;</span>
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Button
          variant={plan.highlighted ? "primary" : "outline"}
          size="lg"
          fullWidth
          href="/contacto"
        >
          {plan.cta}
        </Button>
      </div>
    </div>
  );
}

/**
 * PricingSection — bloque de contenido (sin <section> wrapper). Diseñado para
 * vivir DENTRO de una sección padre que controla bg/parallax. La página padre
 * combina este bloque con la intro (Free Trial) en una sola sección, igual que
 * Sobre-mi/Portfolio/Testimonios combinan intro + content en su Sec 1.
 */
export default function PricingSection() {
  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="mb-12 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">
            Precios »»
          </span>
          <h2 className="text-[18px] leading-7 md:text-h1 font-bold text-content-primary">
            Invierte en ti
          </h2>
        </div>
        <p className="mx-auto mt-3 max-w-xl text-base text-content-secondary">
          Elige el plan que mejor se adapte a tus objetivos.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {pricingPlans.map((plan, i) => (
          <PricingPlanCard key={plan.name} plan={plan} index={i} />
        ))}
      </div>
    </div>
  );
}
