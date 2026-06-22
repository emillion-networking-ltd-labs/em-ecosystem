"use client";

import { useReveal } from "@/hooks/useReveal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// Sección SERVICIOS del design system (ECO-54, nivel 2). Rejilla de servicios reales (del brief), con
// reveal escalonado y acento de marca. Variantes `cards` (default) y `list`. Token-safe y a11y.
export interface ServiceItem {
  title: string;
  description?: string;
}
export interface ServicesProps {
  eyebrow?: string;
  title: string;
  services: ServiceItem[];
  viewAllText?: string;
  viewAllHref?: string;
  variant?: "cards" | "list";
}

function ServiceCard({ item, index, list }: { item: ServiceItem; index: number; list: boolean }) {
  const { ref, style } = useReveal<HTMLDivElement>({ delay: (index % 3) * 90 });
  return (
    <div
      ref={ref}
      style={style}
      className={`rounded-2xl border border-border-default bg-surface-primary p-6 transition-colors hover:border-accent ${
        list ? "flex items-start gap-4" : ""
      }`}
    >
      <div className={list ? "flex-1" : ""}>
        <h3 className="text-h2 font-semibold text-content-primary">{item.title}</h3>
        {item.description ? (
          <p className="mt-2 text-body leading-relaxed text-content-secondary">{item.description}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function Services({
  eyebrow,
  title,
  services,
  viewAllText,
  viewAllHref,
  variant = "cards",
}: ServicesProps) {
  const list = variant === "list";
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
        </div>
        <div className={`mt-12 grid gap-6 ${list ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
          {services.map((s, i) => (
            <ServiceCard key={`${s.title}-${i}`} item={s} index={i} list={list} />
          ))}
        </div>
        {viewAllText && viewAllHref ? (
          <div className="mt-10 text-center">
            <Button as="a" href={viewAllHref} variant="outline" size="md">
              {viewAllText}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
