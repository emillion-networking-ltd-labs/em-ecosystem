"use client";

import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";
import PricingSection from "@/components/sections/PricingSection";
import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";
import CTASection from "@/components/sections/CTASection";
import { useFadeInOnView } from "@/lib/useFadeInOnView";
import { useScrollParallax } from "@/lib/useScrollParallax";

const faq = [
  { title: "¿Puedo cambiar de plan?", children: "Sí. Puedes subir o bajar de plan en cualquier momento. Los cambios aplican en el siguiente período." },
  { title: "¿Cómo funciona el primer mes?", children: "Incluye evaluación inicial completa: análisis, mediciones, fotos y videollamada para definir objetivos." },
  { title: "¿Necesito ir a un gimnasio?", children: "Recomiendo gimnasio, pero puedo adaptar el programa para casa con equipo básico." },
  { title: "¿Cuánto tiempo hasta ver resultados?", children: "Primeros cambios entre semana 4-8. Resultados significativos a partir del mes 3." },
  { title: "¿Hay permanencia?", children: "No. Puedes cancelar cuando quieras con 7 días de preaviso." },
];

const freeTrialFeatures = [
  "Evaluación inicial completa por videollamada",
  "Plan de entrenamiento personalizado de 7 días",
  "Acceso a la app móvil con tu rutina",
  "Sin tarjeta, sin compromiso",
];

export default function PreciosPage() {
  const faqParallax = useScrollParallax<HTMLElement>();
  const accordionFade = useFadeInOnView<HTMLDivElement>();

  return (
    <>
      <PublicNavbar />
      <main className="pt-16">
        {/* === Sección 1: Free Trial (intro hook) + Pricing plans (content) — combinados
            en una sola sección como en Sobre-mi/Portfolio/Testimonios. Sin parallax
            porque es la primera sección visible al cargar (regla del proyecto). === */}
        <section className="bg-surface-primary py-20">
          {/* Free Trial intro */}
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">Prueba »»</p>
            <h1 className="mt-2 text-display text-content-primary">Empieza gratis.</h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-content-secondary">
              7 días de muestra para que conozcas mi método antes de elegir un plan. Sin tarjeta, sin compromiso.
            </p>
            <ul className="mx-auto mt-8 max-w-md space-y-2 text-left">
              {freeTrialFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-body text-content-secondary">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button variant="primary" size="lg" href="/contacto">EMPEZAR GRATIS</Button>
            </div>
          </div>

          {/* Pricing plans — bloque de contenido, mismo bg que la intro.
              id="precios" + scroll-mt-24: anchor target para "/precios#precios"
              (botón "VER PRECIOS" en CTASection). scroll-mt-24 compensa el alto
              del navbar fijo (h-16) para que el header no quede tapado. */}
          <div id="precios" className="mt-20 scroll-mt-24">
            <PricingSection />
          </div>
        </section>

        {/* === Sección 2: FAQ — bajo el fold, con parallax === */}
        <section
          ref={faqParallax.ref}
          style={faqParallax.style}
          className="bg-surface-secondary py-20"
        >
          <div className="mx-auto max-w-3xl px-6">
            <div className="mb-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">FAQ »»</span>
              <h2 className="text-[18px] leading-7 md:text-h1 font-bold text-content-primary">Preguntas frecuentes</h2>
            </div>
            <div ref={accordionFade.ref} className={accordionFade.className} style={accordionFade.style}>
              <Accordion items={faq} />
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <PublicFooter />
    </>
  );
}
