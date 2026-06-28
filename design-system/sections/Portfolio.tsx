"use client";

import { useReveal } from "@/hooks/useReveal";
import Image from "next/image";
import Button from "@/components/ui/Button";

// Sección PORTFOLIO del design system (ECO-55, nivel 2; fotos reales ECO-61/F7a). Galería de trabajos/fotos
// REALES del cliente (del brief — nunca inventados; sin items, se omite). La imagen es OPCIONAL y se pinta con
// `next/image` (optimizado, formatos modernos); sin imagen, un tile NEUTRO (surface-secondary) con el título.
// Refinada ECO-93: lenguaje neutro — cabecera en `display`, eyebrow neutro (sin Badge), tile y hover sin el
// accent placeholder. El `title` es
// OPCIONAL: una galería de fotos reales puede ser solo-imagen (sin barra de texto). Reveal escalonado, a11y.
export interface PortfolioItem {
  /** Título del trabajo. Opcional: una foto de galería puede no tenerlo (tile solo-imagen). */
  title?: string;
  description?: string;
  imageSrc?: string;
  href?: string;
}
export interface PortfolioProps {
  eyebrow?: string;
  title: string;
  items: PortfolioItem[];
  viewAllText?: string;
  viewAllHref?: string;
  variant?: "grid" | "featured";
}

function PortfolioCard({ item, index, featured }: { item: PortfolioItem; index: number; featured: boolean }) {
  const { ref, style } = useReveal<HTMLElement>({ delay: (index % 3) * 90 });
  const hasImg = !!item.imageSrc;
  const big = featured && index === 0;
  const Wrapper = item.href ? "a" : "div";
  return (
    <article ref={ref} style={style} className={big ? "sm:col-span-2" : ""}>
      <Wrapper
        {...(item.href ? { href: item.href } : {})}
        className="group block overflow-hidden rounded-2xl border border-border-default bg-surface-primary transition-colors hover:border-border-strong"
      >
        <div className={`relative ${big ? "aspect-[2/1]" : "aspect-[4/3]"} ${hasImg ? "" : "flex items-end bg-surface-secondary"}`}>
          {hasImg ? (
            <Image
              src={item.imageSrc!}
              alt={item.title || ""}
              fill
              sizes={big ? "(min-width: 1024px) 56rem, 100vw" : "(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : item.title ? (
            <span className="p-5 text-h3 font-semibold text-content-primary">{item.title}</span>
          ) : null}
        </div>
        {item.title || item.description ? (
          <div className="p-5">
            {item.title ? <h3 className="text-h3 font-semibold text-content-primary">{item.title}</h3> : null}
            {item.description ? <p className="mt-1 text-body leading-relaxed text-content-secondary">{item.description}</p> : null}
          </div>
        ) : null}
      </Wrapper>
    </article>
  );
}

export default function Portfolio({
  eyebrow,
  title,
  items,
  viewAllText,
  viewAllHref,
  variant = "grid",
}: PortfolioProps) {
  const featured = variant === "featured";
  return (
    <section className="bg-surface-primary">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="flex flex-col items-center gap-2 text-center">
          {eyebrow ? (
            <p className="text-caption font-semibold uppercase tracking-wider text-content-secondary">{eyebrow}</p>
          ) : null}
          <h2 className="font-display text-display-2 font-bold text-content-primary">{title}</h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <PortfolioCard key={`${item.title}-${i}`} item={item} index={i} featured={featured} />
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
