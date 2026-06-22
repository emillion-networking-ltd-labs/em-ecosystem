import Link from "next/link";
import Button from "@/components/ui/Button";

// Sección HERO del design system (ECO-54, nivel 2). Diseño/responsive/a11y gobernados; el CONTENIDO entra
// por props (desde el brief — nunca inventado). Marca de primera clase: variante `gradient` pinta el fondo
// con el token de marca (`accent`); el CTA primario va en marca. Above-the-fold → SIN reveal (protege LCP).
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
  /** Alineación del contenido. */
  align?: "left" | "center";
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
}: HeroProps) {
  const onBrand = variant === "gradient";
  const wrap = onBrand
    ? "bg-gradient-to-br from-accent to-accent-dark text-white"
    : "bg-surface-secondary text-content-primary";
  const alignment = align === "center" ? "items-center text-center mx-auto" : "items-start text-left";
  const sub = onBrand ? "text-white/90" : "text-content-secondary";

  return (
    <section className={`relative ${wrap}`}>
      <div className={`mx-auto flex max-w-5xl flex-col ${alignment} gap-6 px-6 py-24 sm:py-28 lg:py-32`}>
        {eyebrow ? (
          <span className={`text-caption font-semibold uppercase tracking-widest ${onBrand ? "text-white/80" : "text-accent"}`}>
            {eyebrow}
          </span>
        ) : null}
        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">{title}</h1>
        {subtitle ? <p className={`max-w-2xl text-lg leading-relaxed ${sub}`}>{subtitle}</p> : null}
        {ctaText || secondaryCtaText ? (
          <div className={`mt-2 flex flex-col gap-3 sm:flex-row ${align === "center" ? "sm:justify-center" : ""}`}>
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
    </section>
  );
}
