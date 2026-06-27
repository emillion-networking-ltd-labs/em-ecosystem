// HeroShowcase — la PIEZA-ESTRELLA del design-system (ECO-87, fase 1 de satellite-design, eje 5).
// No es un átomo: COMPONE las primitivas de layout (Section/Container/Split/Stack) + los slots
// decorativos (GradientBackdrop/Blob/DotPattern/GridPattern) + marketing (AnimatedGradientText) +
// Button, en un hero diferenciador. Demuestra la tesis del pilar B: belleza por COMPOSICIÓN
// gobernada, no por plantilla.
//
// `preset` = el SECTOR como configuración MULTI-EJE (no solo color): cambia la FAMILIA tipográfica
// (display vs serif), la ATMÓSFERA decorativa y el énfasis — un gym (bold, sans potente), un
// restaurante elegante (serif, atmósfera sutil) y una agencia (editorial, rejilla) difieren de raíz.
// Tematizable además por satélite vía --color-accent/-2 (tokens), sin editar el componente.
//
// HECHOS por props (jamás inventados): title obligatorio; el resto omit-if-absent (sin media →
// hero a una columna centrado; sin CTA → no se pinta). Above-the-fold → SIN reveal (protege el LCP).
import type { ReactNode } from "react";
import { AnimatedGradientText } from "@/components/ui/AnimatedGradientText";
import { Blob } from "@/components/ui/Blob";
import Button from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { DotPattern } from "@/components/ui/DotPattern";
import { GradientBackdrop } from "@/components/ui/GradientBackdrop";
import { GridPattern } from "@/components/ui/GridPattern";
import { Section } from "@/components/ui/Section";
import { Split } from "@/components/ui/Split";
import { Stack } from "@/components/ui/Stack";
import { cn } from "@/lib/utils";

export type HeroPreset = "bold" | "elegant" | "editorial";

interface PresetConfig {
  /** Familia tipográfica del titular (eje del sector). */
  headingFont: string;
  /** Superficie de la banda. */
  surface: "primary" | "secondary" | "subtle";
  /** Atmósfera decorativa (slots, aria-hidden) — la firma visual del preset. */
  decoration: ReactNode;
}

const PRESETS: Record<HeroPreset, PresetConfig> = {
  // Gym / tech / startup: sans potente, halos de marca, energía.
  bold: {
    headingFont: "font-display",
    surface: "primary",
    decoration: (
      <>
        <GradientBackdrop variant="radial" intensity="soft" />
        <Blob size="xl" intensity="soft" className="-right-24 -top-24" />
        <Blob size="lg" intensity="subtle" className="-bottom-24 -left-16" />
      </>
    ),
  },
  // Restaurante / lujo / clínica: serif, atmósfera sutil, calma.
  elegant: {
    headingFont: "font-serif",
    surface: "subtle",
    decoration: (
      <>
        <DotPattern className="text-border-subtle opacity-60" />
        <GradientBackdrop variant="linear" intensity="subtle" />
      </>
    ),
  },
  // Agencia / portfolio: editorial, rejilla técnica, tipografía fuerte.
  editorial: {
    headingFont: "font-display",
    surface: "secondary",
    decoration: <GridPattern className="text-border-subtle opacity-70" />,
  },
};

export interface HeroShowcaseProps {
  /** Sector como preset multi-eje (tipografía + atmósfera + énfasis). @default "bold" */
  preset?: HeroPreset;
  /** Eyebrow corto (p.ej. el sector). Opcional. */
  eyebrow?: string;
  /** Titular principal (h1). OBLIGATORIO. */
  title: string;
  /** Palabra(s) de acento del titular, resaltadas con el gradiente animado de marca. Opcional. */
  titleAccent?: string;
  /** Subtítulo/claim. Opcional. */
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  /** Panel de media (foto REAL del cliente, opcional). Sin él → hero a una columna (omit-if-absent). */
  media?: ReactNode;
  className?: string;
}

export function HeroShowcase({
  preset = "bold",
  eyebrow,
  title,
  titleAccent,
  subtitle,
  ctaText,
  ctaHref,
  secondaryCtaText,
  secondaryCtaHref,
  media,
  className,
}: HeroShowcaseProps) {
  const cfg = PRESETS[preset];
  const hasCta = Boolean(ctaText) || Boolean(secondaryCtaText);

  const content = (
    <Stack gap="lg" align={media ? "start" : "center"}>
      {eyebrow && (
        <span className="text-caption font-medium uppercase tracking-wide text-accent">
          {eyebrow}
        </span>
      )}
      <h1 className={cn("text-display-1 text-content-primary", cfg.headingFont)}>
        {title}
        {titleAccent && (
          <>
            {" "}
            <AnimatedGradientText>{titleAccent}</AnimatedGradientText>
          </>
        )}
      </h1>
      {subtitle && (
        <p className="max-w-2xl text-h3 font-normal text-content-secondary">{subtitle}</p>
      )}
      {hasCta && (
        <div className={cn("flex flex-wrap gap-4", !media && "justify-center")}>
          {ctaText && (
            <Button as={ctaHref ? "a" : "button"} href={ctaHref} size="lg" fullWidth={false}>
              {ctaText}
            </Button>
          )}
          {secondaryCtaText && (
            <Button
              as={secondaryCtaHref ? "a" : "button"}
              href={secondaryCtaHref}
              variant="outline"
              size="lg"
              fullWidth={false}
            >
              {secondaryCtaText}
            </Button>
          )}
        </div>
      )}
    </Stack>
  );

  return (
    <Section
      isolateDecoration
      spacing="xl"
      surface={cfg.surface}
      className={className}
      aria-label={eyebrow ? `${eyebrow}: ${title}` : title}
    >
      {cfg.decoration}
      <Container>
        <Split media={media} ratio="5-7" align="center" gap="xl">
          {content}
        </Split>
      </Container>
    </Section>
  );
}

export default HeroShowcase;
