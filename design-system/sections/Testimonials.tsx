"use client";

import { Star } from "lucide-react";
import Icon, { type IconSize } from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { useReveal } from "@/hooks/useReveal";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Grid } from "@/components/ui/Grid";

// Sección TESTIMONIOS del design-system — RECONSTRUIDA ECO-93 replicando la PÁGINA /testimonios de
// sat-cristian-garcia (no el teaser): cabecera + bloque de RATING AGREGADO opcional (número grande + estrellas
// + total) + GRID de reseñas (cada card `card-flat` = Avatar + nombre + meta + StarRating opcional + texto) +
// enlace opcional. Lenguaje NEUTRO (estrellas y rating en content-primary; Avatar primitivo neutro). La misma
// pieza sirve para "reseñas" (avatar+estrellas+fecha) o "testimonios" (avatar+rol+cita) según qué props traiga.
// Testimonios REALES del cliente (del brief — nunca inventados; sin items, se omite). Reveal escalonado, a11y.
export interface Testimonial {
  name: string;
  quote: string;
  /** Rol/empresa o fecha — meta bajo el nombre. Opcional. */
  role?: string;
  /** Valoración 1–5 (estrellas). Opcional. */
  rating?: number;
  /** Foto del autor. Opcional → el Avatar muestra iniciales neutras. */
  avatarSrc?: string;
  /** Enlace a la reseña completa. Si está, la tarjeta es clicable (hover de borde activo + cursor). */
  href?: string;
}
export interface TestimonialsProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: Testimonial[];
  /** Rating agregado (número grande + estrellas). Opcional. */
  rating?: number;
  /** Total que acompaña al rating (p.ej. "128 reviews"). */
  ratingCount?: string;
  viewAllText?: string;
  viewAllHref?: string;
}

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: IconSize;
}) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          icon={Star}
          key={n}
          size={size}
          aria-hidden
          className={
            n <= rating
              ? "fill-content-primary text-content-primary"
              : "fill-content-placeholder text-content-placeholder"
          }
        />
      ))}
    </div>
  );
}

function TestimonialCard({ t, index }: { t: Testimonial; index: number }) {
  const { ref, style } = useReveal<HTMLElement>({ delay: (index % 3) * 90 });
  const interactive = !!t.href;
  const cls = `card-flat flex h-full flex-col ${
    interactive
      ? "transition-[border-color,box-shadow] duration-[var(--duration-fast)] hover:border-line-strong hover:shadow-card"
      : ""
  }`;
  const inner = (
    <>
      <div className="flex items-center gap-3">
        <Avatar src={t.avatarSrc} name={t.name} size="md" />
        <div className="flex-1">
          <figcaption className="text-body font-semibold text-content-primary">
            {t.name}
          </figcaption>
          {t.role ? (
            <p className="text-caption font-semibold text-content-secondary">
              {t.role}
            </p>
          ) : null}
        </div>
      </div>
      {t.rating ? (
        <div className="mt-3">
          <StarRating rating={t.rating} />
        </div>
      ) : null}
      <blockquote className="mt-3 flex-1 text-body text-content-secondary">
        {t.quote}
      </blockquote>
    </>
  );
  return (
    <figure ref={ref} style={style} className="h-full">
      {interactive ? (
        <a
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Read ${t.name}'s full review`}
          className={cls}
        >
          {inner}
        </a>
      ) : (
        <div className={cls}>{inner}</div>
      )}
    </figure>
  );
}

export default function Testimonials({
  eyebrow,
  title,
  subtitle,
  items,
  rating,
  ratingCount,
  viewAllText,
  viewAllHref,
}: TestimonialsProps) {
  return (
    // ECO-120 — Section (banda + surface + ritmo `md`) + Container (ancho canónico `xl`) + Grid.
    <Section surface="secondary">
      <Container size="xl">
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
        {rating ? (
          <div className="mx-auto mb-10 flex max-w-md flex-col items-center gap-3 text-center">
            <p className="font-display text-display-2 font-black leading-none text-content-primary">
              {rating.toFixed(1)}
            </p>
            <StarRating rating={Math.round(rating)} size="lg" />
            {ratingCount ? (
              <p className="text-body text-content-secondary">{ratingCount}</p>
            ) : null}
          </div>
        ) : null}
        <Grid cols={{ base: 1, md: 2, lg: 3 }} gap="md">
          {items.map((t, i) => (
            <TestimonialCard key={`${t.name}-${i}`} t={t} index={i} />
          ))}
        </Grid>
        {viewAllText && viewAllHref ? (
          <div className="mt-10 text-center">
            <Button
              as="a"
              href={viewAllHref}
              variant="link-underline"
              size="md"
            >
              {viewAllText}
            </Button>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
