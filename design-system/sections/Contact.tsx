"use client";

import { useReveal } from "@/hooks/useReveal";
import Button from "@/components/ui/Button";

// Sección CONTACTO del design system (ECO-54, nivel 2). Muestra los HECHOS de contacto reales del cliente
// (email/teléfono/dirección — del brief, nunca inventados) como enlaces accionables (mailto:/tel:) + un CTA.
// NO es un formulario: un form que no postea a ningún backend sería engañoso en un satélite estático; cuando
// haya endpoint, será otra sección. Variantes `card` (default) y `split`. Reveal on-scroll, token-safe, a11y.
export interface ContactProps {
  title?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  ctaText?: string;
  ctaHref?: string;
  variant?: "card" | "split";
}

export default function Contact({
  title = "Contacto",
  description,
  email,
  phone,
  address,
  ctaText,
  ctaHref = "/contact",
  variant = "card",
}: ContactProps) {
  const { ref, style } = useReveal<HTMLDivElement>();
  const split = variant === "split";
  const rows: Array<{ label: string; value: string; href?: string }> = [];
  if (email) rows.push({ label: "Email", value: email, href: `mailto:${email}` });
  if (phone) rows.push({ label: "Teléfono", value: phone, href: `tel:${phone.replace(/\s+/g, "")}` });
  if (address) rows.push({ label: "Dirección", value: address });

  return (
    <section className="bg-surface-primary">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <div
          ref={ref}
          style={style}
          className={`rounded-3xl border border-border-default bg-surface-secondary p-8 sm:p-12 ${
            split ? "grid gap-10 lg:grid-cols-2 lg:items-center" : "text-center"
          }`}
        >
          <div className={split ? "" : "mx-auto max-w-xl"}>
            <h2 className="text-3xl font-bold text-content-primary sm:text-4xl">{title}</h2>
            {description ? (
              <p className="mt-3 text-body leading-relaxed text-content-secondary">{description}</p>
            ) : null}
          </div>
          <div className={split ? "" : "mx-auto mt-8 max-w-md"}>
            {rows.length ? (
              <dl className={`space-y-3 ${split ? "" : "text-left"}`}>
                {rows.map((r) => (
                  <div key={r.label} className="flex flex-col gap-0.5">
                    <dt className="text-caption font-semibold uppercase tracking-wide text-content-tertiary">{r.label}</dt>
                    <dd className="text-body text-content-primary">
                      {r.href ? (
                        <a href={r.href} className="text-accent transition-colors hover:underline">
                          {r.value}
                        </a>
                      ) : (
                        r.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {ctaText ? (
              <div className={`mt-8 ${split ? "" : "flex justify-center"}`}>
                <Button as="a" href={ctaHref} variant="primary" size="lg">
                  {ctaText}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
