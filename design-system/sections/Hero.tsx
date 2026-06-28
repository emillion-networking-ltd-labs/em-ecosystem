import Link from "next/link";
import Image from "next/image";

// Sección HERO del design-system — REFINADA en ECO-93 replicando la ESTRUCTURA EXACTA del hero de
// sat-cristian-garcia (benchmark), con lenguaje NEUTRO (tokens del design-system) y SIN vídeo: foto a
// sangre en su lugar. Estructura del benchmark: banda 50vh/60vh; media a sangre + overlay de legibilidad
// (`from-black`→transparent, abajo→arriba); contenido anclado ABAJO (`mt-auto mb-12`); en desktop el título
// display + CTA ghost a la izquierda y un grid de stat-cards de cristal a la derecha (`items-end`/
// `justify-between`); en móvil las stats salen DEBAJO del hero sobre `surface-secondary`. Marca por token
// (`--color-accent`): lienzo en blanco, tematizable por cliente. El blanco/scrim sobre la foto es convención
// de legibilidad (no color de marca). Server component, above-the-fold sin reveal → protege LCP.
export interface HeroStat {
  /** Cifra/dato (p.ej. "+500"). */
  value: string;
  /** Etiqueta corta. */
  label: string;
}

export interface HeroProps {
  /** Titular principal (h1). Obligatorio. */
  title: string;
  /** CTA principal (ghost sobre la media). Opcional. */
  ctaText?: string;
  ctaHref?: string;
  /** Foto del hero (a sangre, con overlay). Obligatoria. */
  imageSrc: string;
  /** Texto alternativo de la imagen (a11y). */
  imageAlt?: string;
  /** Cifras destacadas: grid a la derecha en desktop, banda debajo en móvil. Opcional. */
  stats?: HeroStat[];
}

function HeroStatCard({ stat, variant }: { stat: HeroStat; variant: "desktop" | "mobile" }) {
  const onMedia = variant === "desktop";
  return (
    <div
      className={
        onMedia
          ? "flex min-w-[120px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/25 px-5 py-6 backdrop-blur-xs"
          : "card-flat py-8 text-center"
      }
    >
      <p className={`text-h1 font-black ${onMedia ? "text-white" : "text-content-primary"}`}>{stat.value}</p>
      <p className={`mt-2 ${onMedia ? "text-caption text-white/60" : "text-body text-content-secondary"}`}>{stat.label}</p>
    </div>
  );
}

export default function Hero({ title, ctaText, ctaHref = "/contact", imageSrc, imageAlt, stats }: HeroProps) {
  const hasStats = !!stats && stats.length > 0;
  return (
    <>
      <section className="relative z-20 flex h-[50vh] flex-col landscape:max-lg:min-h-[440px] lg:h-[60vh]">
        {/* Media + overlay contenidos (no se desbordan del hero) */}
        <div className="absolute inset-0 overflow-hidden">
          <Image src={imageSrc} alt={imageAlt || title} fill priority sizes="100vw" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* Contenido anclado abajo */}
        <div className="relative z-10 mt-auto mb-12 w-full px-6 sm:px-12 lg:px-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            {/* Izquierda: título + CTA */}
            <div>
              <h1 className="max-w-2xl font-display text-display-1 font-bold text-white">{title}</h1>
              {ctaText ? (
                <div className="mt-10 flex">
                  <Link
                    href={ctaHref}
                    className="inline-flex h-12 items-center justify-center rounded-md border border-white/30 px-5 py-3 text-body font-normal tracking-wider text-white transition-all hover:bg-white/10 md:px-8 md:text-h3"
                  >
                    {ctaText}
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Desktop: stats dentro del hero */}
            {hasStats ? (
              <div className="relative z-20 hidden grid-cols-2 gap-3 lg:grid xl:grid-cols-4">
                {stats!.map((s) => (
                  <HeroStatCard key={s.label} stat={s} variant="desktop" />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Móvil: stats fuera del hero, tema normal */}
      {hasStats ? (
        <div className="relative z-20 bg-surface-secondary px-6 py-10 lg:hidden">
          <div className="grid grid-cols-2 gap-4">
            {stats!.map((s) => (
              <HeroStatCard key={s.label} stat={s} variant="mobile" />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
