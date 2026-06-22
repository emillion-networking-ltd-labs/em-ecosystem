"use client";

import { useReveal } from "@/hooks/useReveal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// Sección TESTIMONIOS del design system (ECO-55, nivel 2). Tarjetas con testimonios REALES del cliente
// (del brief — JAMÁS inventados; sin testimonios reales, el generador omite la sección). Iniciales en círculo
// de marca (sin depender del átomo Avatar, acoplado a la API del dashboard). Reveal escalonado, token-safe, a11y.
export interface Testimonial {
  name: string;
  quote: string;
  result?: string;
}
export interface TestimonialsProps {
  eyebrow?: string;
  title: string;
  items: Testimonial[];
  viewAllText?: string;
  viewAllHref?: string;
  variant?: "cards" | "list";
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function TestimonialCard({ t, index, list }: { t: Testimonial; index: number; list: boolean }) {
  const { ref, style } = useReveal<HTMLElement>({ delay: (index % 3) * 90 });
  return (
    <figure
      ref={ref}
      style={style}
      className={`flex flex-col rounded-2xl border border-border-default bg-surface-primary p-6 ${list ? "sm:flex-row sm:items-start sm:gap-6" : ""}`}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-caption font-semibold text-white">
          {initials(t.name)}
        </span>
        <div>
          <figcaption className="text-body font-semibold text-content-primary">{t.name}</figcaption>
          {t.result ? (
            <Badge variant="success" size="sm">
              {t.result}
            </Badge>
          ) : null}
        </div>
      </div>
      <blockquote className="mt-4 flex-1 text-body italic leading-relaxed text-content-secondary">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
    </figure>
  );
}

export default function Testimonials({
  eyebrow,
  title,
  items,
  viewAllText,
  viewAllHref,
  variant = "cards",
}: TestimonialsProps) {
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
          {items.map((t, i) => (
            <TestimonialCard key={`${t.name}-${i}`} t={t} index={i} list={list} />
          ))}
        </div>
        {viewAllText && viewAllHref ? (
          <div className="mt-10 text-center">
            <Button as="a" href={viewAllHref} variant="link-underline" size="md">
              {viewAllText}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
