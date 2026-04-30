"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useFadeInOnView } from "@/lib/useFadeInOnView";

import { services } from "@/lib/data";

type Service = (typeof services)[number];

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const { ref, className, style } = useFadeInOnView<HTMLAnchorElement>({
    delay: (index % 3) * 120,
  });
  return (
    <Link
      ref={ref}
      href={`/servicios#${service.id}`}
      className={`card-flat block transition-all hover:border-border-components ${className}`}
      style={style}
    >
      <Badge variant="default" size="sm" className="!text-accent">{service.id.toUpperCase()}</Badge>
      <h3 className="mt-3 text-h2 font-semibold text-content-primary">{service.title}</h3>
      <p className="mt-2 text-body text-content-secondary leading-relaxed">{service.shortDesc}</p>
    </Link>
  );
}

export default function ServicesPreview() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const progress = Math.min(window.scrollY / 400, 1);
      setOffset(progress * 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      className="bg-surface-secondary py-12"
      style={{ transform: `translateY(${offset}px)` }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">Servicios »»</span>
          <h2 className="text-[18px] leading-7 md:text-h1 font-bold text-content-primary">Lo que ofrezco</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {services.slice(0, 3).map((s, i) => (
            <ServiceCard key={s.id} service={s} index={i} />
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
