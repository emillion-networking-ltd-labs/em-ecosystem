"use client";

import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";
import Button from "@/components/ui/Button";

// Sección CTA del design system (ECO-54, nivel 2). Panel centrado con titular, descripción y llamada(s) a la
// acción. Variante `brand` (panel con el token de marca) o `surface`. Reveal on-scroll, token-safe, a11y.
export interface CTAProps {
  title: string;
  description?: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  note?: string;
  variant?: "brand" | "surface";
}

export default function CTA({
  title,
  description,
  primaryCtaText,
  primaryCtaHref,
  secondaryCtaText,
  secondaryCtaHref,
  note,
  variant = "brand",
}: CTAProps) {
  const { ref, style } = useReveal<HTMLDivElement>();
  const onBrand = variant === "brand";
  return (
    <section className="bg-surface-primary">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div
          ref={ref}
          style={style}
          className={`mx-auto rounded-3xl px-8 py-14 text-center sm:py-16 ${
            onBrand ? "bg-gradient-to-br from-accent to-accent-dark text-white" : "border border-border-default bg-surface-secondary text-content-primary"
          }`}
        >
          <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">{title}</h2>
          {description ? (
            <p className={`mx-auto mt-4 max-w-xl text-lg leading-relaxed ${onBrand ? "text-white/90" : "text-content-secondary"}`}>
              {description}
            </p>
          ) : null}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={primaryCtaHref}
              className={`inline-flex h-12 items-center justify-center rounded-md px-8 text-h3 font-semibold transition-opacity hover:opacity-90 ${
                onBrand ? "bg-white text-accent" : "bg-accent text-white"
              }`}
            >
              {primaryCtaText}
            </Link>
            {secondaryCtaText && secondaryCtaHref ? (
              <Button as="a" href={secondaryCtaHref} variant="outline" size="lg"
                className={onBrand ? "border-white/40 text-white hover:bg-white/10" : ""}>
                {secondaryCtaText}
              </Button>
            ) : null}
          </div>
          {note ? <p className={`mt-6 text-caption ${onBrand ? "text-white/70" : "text-content-tertiary"}`}>{note}</p> : null}
        </div>
      </div>
    </section>
  );
}
