"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useStaggerOnView } from "@/lib/useStaggerOnView";

import { services } from "@/lib/data";

type Service = (typeof services)[number];

function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/servicios#${service.id}`}
      className="card-flat block transition-all hover:border-border-components"
    >
      <Badge variant="default" size="sm" className="!text-accent">{service.id.toUpperCase()}</Badge>
      <h3 className="mt-3 text-h2 font-semibold text-content-primary">{service.title}</h3>
      <p className="mt-2 text-body text-content-secondary leading-relaxed">{service.shortDesc}</p>
    </Link>
  );
}

export default function ServicesPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);
  const grid = useStaggerOnView<HTMLDivElement>("animate-fade-up");

  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;

      // Mobile/tablet: standard rect-based parallax (matches Portfolio,
      // Transformations, AppPreview, CTA — progressive as the section enters
      // the viewport). Desktop keeps the scrollY-based effect that visually
      // anchors the section to Hero on initial load.
      if (window.matchMedia("(max-width: 1023px)").matches) {
        const rect = el.getBoundingClientRect();
        const trigger = window.innerHeight;
        const progress = Math.min(Math.max((trigger - rect.top) / trigger, 0), 1);
        setOffset(progress * 40);
      } else {
        const progress = Math.min(window.scrollY / 400, 1);
        setOffset(progress * 40);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-surface-secondary py-12"
      style={{ transform: `translateY(${offset}px)` }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">Servicios »»</span>
          <h2 className="text-[18px] leading-7 md:text-h1 font-bold text-content-primary">Lo que ofrezco</h2>
        </div>
        <div ref={grid.ref} className={`grid grid-cols-1 gap-6 md:grid-cols-3 ${grid.className}`}>
          {services.slice(0, 3).map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-center">
        <div className="flex-1 border-t border-dashed border-accent dark:border-border-strong" />
        <div className="px-6">
          <Button variant="link" as="a" href="/servicios">VER TODOS LOS SERVICIOS</Button>
        </div>
        <div className="flex-1 border-t border-dashed border-accent dark:border-border-strong" />
      </div>
    </section>
  );
}
