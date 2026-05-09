"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { useFadeInOnView } from "@/lib/useFadeInOnView";

export default function PortfolioPreview() {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);
  const imageFade = useFadeInOnView<HTMLDivElement>({ delay: 0 });

  useEffect(() => {
    const handleScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const trigger = window.innerHeight;
      const progress = Math.min(Math.max((trigger - rect.top) / trigger, 0), 1);
      setOffset(progress * 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={ref}
      className="bg-surface-primary py-12"
      style={{ transform: `translateY(${offset}px)` }}
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">
            Portfolio »»
          </span>
          <h2 className="text-[18px] leading-7 md:text-h1 font-bold text-content-primary">
            Resultados reales
          </h2>
        </div>

        <div>
          {/* Horizontal image */}
          <div
            ref={imageFade.ref}
            className={`relative aspect-27/10 overflow-hidden rounded-lg ${imageFade.className}`}
            style={imageFade.style}
          >
            <Image
              src="/images/hero-spread-bw.jpeg"
              alt="Cristian García — sesión profesional"
              fill
              className="object-cover object-[center_30%]"
              sizes="100vw"
            />
          </div>

          {/* Newspaper-style card — overlapping the image */}
          <div
            className="relative z-10 -mt-6 w-full overflow-hidden rounded-xl border border-border-strong shadow-card md:-mt-8"
            style={{
              backgroundColor: "#f0e9d6",
              backgroundImage:
                "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
              backgroundSize: "4px 4px, 8px 8px",
              backgroundPosition: "0 0, 2px 2px",
            }}
          >
            <div
              className="px-8 py-5 sm:px-10 sm:py-6"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {/* Headline — newspaper style */}
              <h3
                className="text-[28px] font-bold leading-tight text-[#1c1c1c]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Un granadino
                <br className="md:hidden" /> entre los grandes
              </h3>

              {/* Article body — newspaper style, 2 columns, drop cap */}
              <div
                className="mt-4 columns-1 gap-8 text-[14px] leading-[1.6] text-[#1c1c1c]/85 text-justify md:columns-2 [&>p]:mb-3 [&>p:first-child:first-letter]:float-left [&>p:first-child:first-letter]:mr-1.5 [&>p:first-child:first-letter]:text-5xl [&>p:first-child:first-letter]:font-bold [&>p:first-child:first-letter]:leading-[0.9] [&>p:first-child:first-letter]:text-[#8B6914]"
                style={{ columnFill: "balance" }}
              >
                <p>
                  Cristian García, campeón de Andalucía y campeón de España
                  Sub‑23, es un fisicoculturista profesional reconocido por
                  alcanzar el Top 15 en el torneo internacional Míster Universo.
                  Su trayectoria lo posiciona como uno de los entrenadores más
                  sólidos en transformación física, recomposición corporal y
                  entrenamiento online.
                </p>
                <p>
                  Su método combina planificación avanzada, técnica depurada y
                  resultados reales demostrados en sus clientes. Una carrera
                  destacada en medios como{" "}
                  <a
                    href="https://www.granadahoy.com/deportes/granadino-grandes_0_581942036.html?utm_source=copilot.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#8B6914] underline decoration-dotted underline-offset-2 hover:text-[#1c1c1c]"
                  >
                    Granada Hoy
                  </a>{" "}
                  consolida su reputación en el panorama nacional del culturismo
                  natural.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider with link */}
      <div className="mt-6 flex items-center">
        <div className="flex-1 border-t border-dashed border-accent dark:border-border-strong" />
        <div className="px-6">
          <Button variant="link" as="a" href="/portfolio">
            VER PORTFOLIO COMPLETO
          </Button>
        </div>
        <div className="flex-1 border-t border-dashed border-accent dark:border-border-strong" />
      </div>
    </section>
  );
}
