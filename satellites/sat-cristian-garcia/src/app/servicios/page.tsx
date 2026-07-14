"use client";

import { useEffect, useRef, useState } from "react";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";
import Badge from "@/components/ui/Badge";
import Accordion from "@/components/ui/Accordion";
import CTASection from "@/components/sections/CTASection";
import { services } from "@/lib/data";

type Service = (typeof services)[number];

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Cards entering together stagger via (index % 3) * 120ms delay so the visually
  // co-occurring batch animates sequentially. Cards entering alone via scroll
  // still get the small delay but it's barely perceptible against the scroll motion.
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: inView ? `${(index % 3) * 120}ms` : "0ms" }}
    >
      <div
        id={service.id}
        className="card-flat transition-all hover:border-line-control scroll-mt-24"
      >
        <div className="flex items-start gap-5">
          <span className="text-3xl font-black text-accent">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
              <h2 className="text-h2 font-semibold text-content-primary">
                {service.title}
              </h2>
              <Badge variant="default" size="sm" className="text-accent!">
                {service.id.toUpperCase()}
              </Badge>
            </div>
            <p className="mt-2 text-body leading-relaxed text-content-secondary">
              {service.fullDesc}
            </p>
            <div className="mt-4">
              <Accordion
                items={[
                  {
                    title: "Que incluye",
                    children: (
                      <ul className="space-y-1">
                        {service.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-body text-content-secondary"
                          >
                            <span className="mt-0.5 text-accent">&#10003;</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiciosPage() {
  return (
    <>
      <PublicNavbar />
      <main className="pt-16">
        <section className="bg-surface-secondary py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">
                Servicios »»
              </p>
              <h1 className="mt-2 text-display text-content-primary">
                Lo que ofrezco.
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-base text-content-secondary">
                Un sistema completo de entrenamiento, nutrición y seguimiento
                para resultados reales.
              </p>
            </div>
            <div className="mx-auto max-w-4xl space-y-6">
              {services.map((s, i) => (
                <ServiceCard key={s.id} service={s} index={i} />
              ))}
            </div>
          </div>
        </section>
        <CTASection />
      </main>
      <PublicFooter />
    </>
  );
}
