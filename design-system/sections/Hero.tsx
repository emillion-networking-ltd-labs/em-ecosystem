import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";

// Sección HERO del design system (ECO-54, nivel 2; imagen real ECO-61/F7a). Diseño/responsive/a11y gobernados;
// el CONTENIDO entra por props (desde el brief — nunca inventado). Marca de primera clase: variante `gradient`
// pinta el fondo con el token de marca (`accent`); el CTA primario va en marca. Above-the-fold → SIN reveal
// (protege LCP). `imageSrc` (foto REAL del cliente, opcional) restaura el visual: layout en split (texto +
// imagen) con `next/image` (optimizado, `priority` para el LCP); SIN imagen → hero de solo texto (omit-if-absent,
// nunca un placeholder). La generación decorativa para rellenar es F7b.
export interface HeroProps {
  /** Eyebrow corto (p.ej. el sector). Opcional. */
  eyebrow?: string;
  /** Titular principal (h1). Obligatorio. */
  title: string;
  /** Subtítulo/claim. Opcional. */
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  /** `gradient` = fondo de marca (default); `soft` = superficie con acentos de marca. */
  variant?: "gradient" | "soft";
  /** Alineación del contenido (sin imagen). Con `imageSrc` el layout es siempre split. */
  align?: "left" | "center";
  /** Foto REAL del cliente (ya ingerida a /images/). Opcional → sin ella, hero de solo texto. */
  imageSrc?: string;
  /** Texto alternativo de la imagen (a11y). */
  imageAlt?: string;
}

export default function Hero({
  eyebrow,
  title,
  subtitle,
  ctaText,
  ctaHref = "/contact",
  secondaryCtaText,
  secondaryCtaHref,
  variant = "gradient",
  align = "left",
  imageSrc,
  imageAlt,
}: HeroProps) {
  const onBrand = variant === "gradient";
  const wrap = onBrand
    ? "bg-gradient-to-br from-accent to-accent-dark text-white"
    : "bg-surface-secondary text-content-primary";
  const hasImg = !!imageSrc;
  // Con imagen, el contenido va a la izquierda (split); sin imagen, respeta `align`.
  const alignment = !hasImg && align === "center" ? "items-center text-center mx-auto" : "items-start text-left";
  const sub = onBrand ? "text-white/90" : "text-content-secondary";

  const content = (
    <div className={`flex flex-col ${alignment} gap-6`}>
      {eyebrow ? (
        <span className={`text-caption font-semibold uppercase tracking-widest ${onBrand ? "text-white/80" : "text-accent"}`}>
          {eyebrow}
        </span>
      ) : null}
      <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">{title}</h1>
      {subtitle ? <p className={`max-w-2xl text-lg leading-relaxed ${sub}`}>{subtitle}</p> : null}
      {ctaText || secondaryCtaText ? (
        <div className={`mt-2 flex flex-col gap-3 sm:flex-row ${!hasImg && align === "center" ? "sm:justify-center" : ""}`}>
          {ctaText ? (
            <Link
              href={ctaHref}
              className={`inline-flex h-12 items-center justify-center rounded-md px-8 text-h3 font-semibold transition-opacity hover:opacity-90 ${
                onBrand ? "bg-white text-accent" : "bg-accent text-white"
              }`}
            >
              {ctaText}
            </Link>
          ) : null}
          {secondaryCtaText && secondaryCtaHref ? (
            <Button as="a" href={secondaryCtaHref} variant="outline" size="lg"
              className={onBrand ? "border-white/40 text-white hover:bg-white/10" : ""}>
              {secondaryCtaText}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <section className={`relative ${wrap}`}>
      {hasImg ? (
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 sm:py-24 lg:grid-cols-2 lg:py-28">
          {content}
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg lg:aspect-[5/4]">
            <Image
              src={imageSrc!}
              alt={imageAlt || title}
              fill
              priority
              sizes="(min-width: 1024px) 36rem, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-5xl px-6 py-24 sm:py-28 lg:py-32">{content}</div>
      )}
    </section>
  );
}
