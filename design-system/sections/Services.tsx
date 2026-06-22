"use client";

import { useReveal } from "@/hooks/useReveal";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// Sección SERVICIOS del design system (ECO-54, nivel 2; foto real opcional ECO-61/F7a). Rejilla de servicios
// reales (del brief), con reveal escalonado y acento de marca. `imageSrc` (foto REAL del cliente, opcional)
// ilustra la tarjeta con `next/image`; sin ella, tarjeta de solo texto (omit-if-absent, nunca placeholder).
// Variantes `cards` (default) y `list`. Token-safe y a11y.
export interface ServiceItem {
  title: string;
  description?: string;
  /** Foto REAL del cliente (ya ingerida a /images/). Opcional. */
  imageSrc?: string;
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
  const hasImg = !!item.imageSrc;
  return (
    <div
      ref={ref}
      style={style}
      className={`overflow-hidden rounded-2xl border border-border-default bg-surface-primary transition-colors hover:border-accent ${
        list ? "flex items-start gap-4 p-6" : ""
      }`}
    >
      {hasImg && !list ? (
        <div className="relative aspect-[16/9]">
          <Image src={item.imageSrc!} alt={item.title} fill sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        </div>
      ) : null}
      <div className={list ? "flex-1" : "p-6"}>
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
