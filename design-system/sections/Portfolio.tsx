"use client";

import { useReveal } from "@/hooks/useReveal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// Sección PORTFOLIO del design system (ECO-55, nivel 2). Galería de trabajos REALES del cliente (del brief —
// nunca inventados; sin items, se omite). La imagen es OPCIONAL y se pinta como background-image (sin <img>/
// next-image → sin config de dominios ni dep de assets): si no hay imagen, un tile de marca con el título.
// Reveal escalonado, token-safe, a11y.
export interface PortfolioItem {
  title: string;
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
  const Wrapper = item.href ? "a" : "div";
  return (
    <article ref={ref} style={style} className={featured && index === 0 ? "sm:col-span-2" : ""}>
      <Wrapper
        {...(item.href ? { href: item.href } : {})}
        className="group block overflow-hidden rounded-2xl border border-border-default bg-surface-primary transition-colors hover:border-accent"
      >
        <div
          className={`flex items-end ${hasImg ? "bg-cover bg-center" : "bg-gradient-to-br from-accent to-accent-dark"} ${featured && index === 0 ? "aspect-[2/1]" : "aspect-[4/3]"}`}
          style={hasImg ? { backgroundImage: `url(${JSON.stringify(item.imageSrc)})` } : undefined}
          role="img"
          aria-label={item.title}
        >
          {!hasImg ? <span className="p-5 text-h3 font-semibold text-white">{item.title}</span> : null}
        </div>
        <div className="p-5">
          <h3 className="text-h3 font-semibold text-content-primary">{item.title}</h3>
          {item.description ? <p className="mt-1 text-body leading-relaxed text-content-secondary">{item.description}</p> : null}
        </div>
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
            <Badge variant="default" size="sm" className="text-accent">
              {eyebrow}
            </Badge>
          ) : null}
          <h2 className="text-3xl font-bold text-content-primary sm:text-4xl">{title}</h2>
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
