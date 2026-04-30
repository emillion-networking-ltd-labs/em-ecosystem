"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Hourglass } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { useFadeInOnView } from "@/lib/useFadeInOnView";

/* Official Google Play store icon (single-color path, recognizable shape).
   Lucide doesn't have a Google Play icon — using a public-domain SVG path. */
function GooglePlayIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M3 20.5V3.5c0-.59.34-1.11.84-1.35L13.69 12 3.84 21.85C3.34 21.6 3 21.09 3 20.5zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm3.35-4.31c.34.27.59.69.59 1.19s-.22.92-.57 1.18L17.89 14.5 15.39 12l2.5-2.5 2.27 1.31zM6.05 2.66l10.76 6.22-2.27 2.27L6.05 2.66z" />
    </svg>
  );
}

const APP_NAME = "CRISFIT";

export default function AppPreview() {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);
  const headerFade = useFadeInOnView<HTMLDivElement>();
  const crisfitFade = useFadeInOnView<HTMLDivElement>();
  const taglineFade = useFadeInOnView<HTMLParagraphElement>();
  const playStoreFade = useFadeInOnView<HTMLDivElement>();
  const ctaFade = useFadeInOnView<HTMLDivElement>();

  useEffect(() => {
    const handleScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const trigger = window.innerHeight;
      const progress = Math.min(
        Math.max((trigger - rect.top) / trigger, 0),
        1,
      );
      setOffset(progress * 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-black">
      <section
        ref={ref}
        className="relative overflow-hidden"
        style={{ transform: `translateY(${offset}px)` }}
      >
      {/* Full-bleed background image */}
      <Image
        src="/images/app-tapiz.png"
        alt={`${APP_NAME} — preview de la aplicación móvil`}
        fill
        priority={false}
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Left-side gradient overlay: dark on the left fading to transparent on the right
          so the CRISFIT icon in the tapiz remains visible */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20"
      />

      {/* Content overlaid */}
      <div className="relative mx-auto max-w-7xl px-6 py-12">
        {/* Centered eyebrow + descriptive title — same pattern as Services / Portfolio / Transformations */}
        <div
          ref={headerFade.ref}
          className={`mb-10 flex flex-wrap items-center justify-center gap-3 ${headerFade.className}`}
          style={headerFade.style}
        >
          <span className="text-[18px] leading-7 font-semibold tracking-wide text-accent md:text-h1">
            App móvil »»
          </span>
          <h2 className="text-[18px] leading-7 font-bold text-white md:text-h1">
            Lleva el plan contigo
          </h2>
        </div>

        {/* CRISFIT (left edge of section) + Próximamente badge (right edge of section)
            on the same line, spanning the full max-w-7xl width */}
        <div
          ref={crisfitFade.ref}
          className={`flex items-center justify-between gap-3 ${crisfitFade.className}`}
          style={crisfitFade.style}
        >
          <p className="text-h2 font-black uppercase tracking-tight text-accent md:text-h1">
            {APP_NAME}
          </p>
          <Badge
            variant="default"
            size="sm"
            className="!text-accent uppercase gap-1.5"
          >
            <Hourglass size={14} />
            Próximamente
          </Badge>
        </div>

        {/* Left-aligned content block (under the CRISFIT row) */}
        <div className="max-w-xl">
          {/* Tagline */}
          <p
            ref={taglineFade.ref}
            className={`mt-4 text-h3 leading-relaxed text-white/80 md:text-h2 ${taglineFade.className}`}
            style={taglineFade.style}
          >
            Tu plan completo de entrenamiento
            <br />
            y nutrición en tu bolsillo.
          </p>
          {/* Google Play button mockup (disabled — coming soon) */}
          <div
            ref={playStoreFade.ref}
            className={`mt-10 flex flex-wrap items-center gap-3 ${playStoreFade.className}`}
            style={playStoreFade.style}
          >
            <div
              aria-disabled
              className="flex h-12 cursor-not-allowed items-center gap-3 rounded-md border border-white/20 bg-black/40 px-5 backdrop-blur-sm opacity-90"
            >
              <span className="text-white">
                <GooglePlayIcon size={22} />
              </span>
              <span className="text-body font-semibold text-white">
                Google Play
              </span>
            </div>
          </div>

          {/* Bottom CTA — same outlined style as Hero "EMPIEZA TU TRANSFORMACIÓN" */}
          <div
            ref={ctaFade.ref}
            className={`mt-12 ${ctaFade.className}`}
            style={ctaFade.style}
          >
            <a
              href="/contacto"
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/30 px-5 md:px-8 py-3 text-body md:text-h3 font-normal uppercase tracking-wider text-white transition-all hover:bg-white/10"
            >
              ÚNETE A LA LISTA DE ESPERA
            </a>
          </div>
        </div>
      </div>
      </section>
    </div>
  );
}
