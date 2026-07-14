import Link from "next/link";
import Image from "next/image";

import { NumberTicker } from "@/components/ui/NumberTicker";

// Sección HERO del design-system — REFINADA en ECO-93 replicando la ESTRUCTURA EXACTA del hero de
// sat-cristian-garcia (benchmark), con lenguaje NEUTRO (tokens del design-system) y SIN vídeo: foto a
// sangre en su lugar. Estructura del benchmark: banda 50vh/60vh; media a sangre + overlay de legibilidad
// (`from-black`→transparent, abajo→arriba); contenido anclado ABAJO (`mt-auto mb-12`); en desktop el título
// display + CTA ghost a la izquierda y un grid de stat-cards de cristal a la derecha (`items-end`/
// `justify-between`); en móvil las stats salen DEBAJO del hero sobre `surface-secondary`. Marca por token
// (`--color-accent`): lienzo en blanco, tematizable por cliente. El blanco/scrim sobre la foto es convención
// de legibilidad (no color de marca). Server component; las stat-cards animan la cifra con NumberTicker
// (client island, cuenta al entrar en vista). El LCP es el titular (h1), no las stats (ECO-104).
export interface HeroStat {
  /** Cifra a animar (p.ej. 500). */
  value: number;
  /** Prefijo opcional delante de la cifra (p.ej. "+"). */
  prefix?: string;
  /** Sufijo opcional detrás de la cifra (p.ej. "%", "+"). */
  suffix?: string;
  /** Decimales a mostrar (p.ej. 1 → 4.9). @default 0 */
  decimals?: number;
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

function HeroStatCard({
  stat,
  variant,
}: {
  stat: HeroStat;
  variant: "desktop" | "mobile";
}) {
  const onMedia = variant === "desktop";
  return (
    <div
      className={
        onMedia
          ? "flex min-w-[120px] flex-col items-center justify-center rounded-2xl border border-(--on-media-border) bg-(--overlay) px-5 py-6 backdrop-blur-xs"
          : "card-flat py-8 text-center"
      }
    >
      <p
        className={`text-h1 font-black ${onMedia ? "text-white" : "text-content-primary"}`}
      >
        {stat.prefix}
        <NumberTicker
          value={stat.value}
          decimalPlaces={stat.decimals ?? 0}
          className={onMedia ? "text-white" : "text-content-primary"}
        />
        {stat.suffix}
      </p>
      <p
        className={`mt-2 ${onMedia ? "text-caption text-(--on-media-muted)" : "text-body text-content-secondary"}`}
      >
        {stat.label}
      </p>
    </div>
  );
}

// ECO-120 — Hero se dejó FUERA del refactor a primitivas de layout A PROPÓSITO: es un patrón `Cover`
// (altura de viewport 50/60vh + media a sangre con overlay + contenido anclado abajo + padding propio) que
// las primitivas actuales NO modelan (Section=py-bandas; Container=medida centrada; Grid fuerza display:grid y
// rompería el `hidden lg:grid` de las stats). Forzarlas quedaría peor. Se migrará cuando exista la primitiva
// `Cover` (diferida en ECO-131/ADR-025). Seguimiento: ECO-132. NO refactorizar a mano hasta entonces.
export default function Hero({
  title,
  ctaText,
  ctaHref = "/contact",
  imageSrc,
  imageAlt,
  stats,
}: HeroProps) {
  const hasStats = !!stats && stats.length > 0;
  return (
    <>
      <section className="relative z-20 flex h-[50vh] flex-col landscape:max-lg:min-h-[440px] lg:h-[60vh]">
        {/* Media + overlay contenidos (no se desbordan del hero) */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt || title}
            fill
            priority
            sizes="100vw"
            className="h-full w-full object-cover"
          />
          <div className="scrim absolute inset-0" />
        </div>

        {/* Contenido anclado abajo */}
        <div className="relative z-10 mt-auto mb-12 w-full px-6 sm:px-12 lg:px-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            {/* Izquierda: título + CTA */}
            <div>
              <h1 className="max-w-2xl font-display text-display-1 font-bold text-white">
                {title}
              </h1>
              {ctaText ? (
                <div className="mt-10 flex">
                  <Link
                    href={ctaHref}
                    className="inline-flex h-12 items-center justify-center rounded-md border border-(--on-media-border-strong) px-5 py-3 text-body font-normal tracking-wider text-white transition-all hover:bg-(--on-media-hover) md:px-8 md:text-h3"
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
