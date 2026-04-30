"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { useFadeInOnView } from "@/lib/useFadeInOnView";

export default function CTASection({ className = "bg-surface-primary" }: { className?: string } = {}) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);
  const titleFade = useFadeInOnView<HTMLHeadingElement>();
  const descFade = useFadeInOnView<HTMLParagraphElement>();
  const buttonsFade = useFadeInOnView<HTMLDivElement>();
  const captionFade = useFadeInOnView<HTMLParagraphElement>();

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
    <section
      ref={ref}
      // `dark` class fuerza los tokens de dark theme para los descendientes,
      // así CTASection siempre se ve oscuro (como el footer en dark mode)
      // sin importar el tema activo del usuario.
      className={`dark ${className} pt-[132px] pb-12`}
      style={{ transform: `translateY(${offset}px)` }}
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2
          ref={titleFade.ref}
          className={`text-display text-content-primary ${titleFade.className}`}
          style={titleFade.style}
        >
          Aquí cambiarás tu vida.
        </h2>
        <p
          ref={descFade.ref}
          className={`mx-auto mt-6 max-w-xl text-base leading-relaxed text-content-secondary ${descFade.className}`}
          style={descFade.style}
        >
          No mañana. No el lunes. Hoy decides que tu historia va a ser diferente.
        </p>
        <div
          ref={buttonsFade.ref}
          className={`mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center ${buttonsFade.className}`}
          style={buttonsFade.style}
        >
          <Button variant="primary" size="lg" href="/contacto">EMPIEZA AHORA</Button>
          <Button variant="outline" size="lg" href="/precios#precios">VER PRECIOS</Button>
        </div>
        <p
          ref={captionFade.ref}
          className={`mt-6 text-caption text-content-disabled ${captionFade.className}`}
          style={captionFade.style}
        >
          +500 personas ya lo hicieron.
        </p>
      </div>
    </section>
  );
}
