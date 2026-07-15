"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";
import Badge from "@/components/ui/Badge";
import IconButton from "@/components/ui/IconButton";
import CTASection from "@/components/sections/CTASection";
import { useFadeInOnView } from "@/lib/useFadeInOnView";
import { useScrollParallax } from "@/lib/useScrollParallax";
import { portfolioImages, portfolioPalmares, portfolioMedia } from "@/lib/data";

type PortfolioImage = (typeof portfolioImages)[number];
type PalmaresEntry = (typeof portfolioPalmares)[number];
type MediaEntry = (typeof portfolioMedia)[number];

function PalmaresCard({
  entry,
  index,
}: {
  entry: PalmaresEntry;
  index: number;
}) {
  // Per-card IntersectionObserver. On mobile the 3 entries stack vertically
  // (~400px each) — total > 1 viewport. Section-level stagger would fire all
  // 3 at once when the first comes into view. Same fix as /sobre-mi timeline.
  const { ref, className, style } = useFadeInOnView<HTMLDivElement>({
    delay: index * 100,
  });
  return (
    <div ref={ref} style={style} className={`card-flat ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <p className="text-h1 font-black text-accent leading-none">
          {entry.year}
        </p>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="default"
              size="sm"
              className="text-accent! uppercase"
            >
              {entry.scope}
            </Badge>
            <Badge
              variant="default"
              size="sm"
              className="text-accent! uppercase"
            >
              {entry.category}
            </Badge>
          </div>
          <h3 className="mt-3 text-h2 font-semibold text-content-primary">
            {entry.title}
          </h3>
          <p className="mt-2 text-h3 font-medium text-accent">{entry.result}</p>
          {entry.note && (
            <p className="mt-2 text-body leading-relaxed text-content-secondary">
              {entry.note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PortfolioCard({
  image,
  index,
  onClick,
}: {
  image: PortfolioImage;
  index: number;
  onClick: () => void;
}) {
  const { ref, className, style } = useFadeInOnView<HTMLDivElement>({
    delay: (index % 4) * 100,
  });
  return (
    <button
      ref={ref as unknown as React.Ref<HTMLButtonElement>}
      onClick={onClick}
      aria-label={`Ver imagen completa: ${image.alt}`}
      className={`group relative aspect-3/4 cursor-zoom-in overflow-hidden rounded-lg ${className}`}
      style={style}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="text-caption font-semibold uppercase tracking-wider text-white">
          {image.alt}
        </p>
      </div>
    </button>
  );
}

// Drag-to-swipe constants — mirror TransformationsPreview carousel for
// consistent feel across the site. SWIPE_THRESHOLD is raw cursor delta,
// DRAG_DAMPING is the visual translation factor (image moves ~30% of the
// cursor distance for tactile resistance feedback).
const SWIPE_THRESHOLD = 80;
const DRAG_DAMPING = 0.3;

function Lightbox({
  index,
  onClose,
  onPrev,
  onNext,
}: {
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const image = portfolioImages[index];
  const total = portfolioImages.length;
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  // True when a drag just crossed the threshold and triggered a slide change.
  // Read by the backdrop onClick to suppress the close that would otherwise
  // fire when mouseup lands outside the image container.
  const justDraggedRef = useRef(false);
  const reducedMotionRef = useRef(false);

  // Lock body scroll + bind keyboard navigation while lightbox is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "ArrowLeft") onPrev();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onNext, onPrev]);

  // Global pointer move/up handlers — active only while dragging. Mirrors the
  // TransformationsPreview carousel pattern so feel is consistent across the site.
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      setDragX(x - dragStartXRef.current);
    };
    const onUp = () => {
      setIsDragging(false);
      setDragX((current) => {
        if (Math.abs(current) > SWIPE_THRESHOLD) {
          justDraggedRef.current = true;
          if (current > 0) onPrev();
          else onNext();
        }
        return 0;
      });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging, onNext, onPrev]);

  const handleBackdropClick = () => {
    // Suppress close if mouseup landed outside the image container after a drag.
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      // `dark` class fuerza los tokens de dark mode para los descendientes, así
      // bg-surface-tertiary, text-content-primary y hover:bg-surface-subtle del
      // patrón "boxed" del dashboard se renderizan con valores apropiados para
      // un overlay oscuro, sin importar el tema del usuario.
      className="dark fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-xs"
      onClick={handleBackdropClick}
    >
      {/* IconButton boxed sm — componente del design system (importado, no inline).
          Usa el patrón exacto documentado en IconButton.tsx del dashboard.
          h-8 w-8 hace el tamaño total 32×32px explícito (no derivado del padding),
          con icono 16px centrado. Colores: bg-surface-tertiary + text-content-primary
          (tokens del proyecto, vía variant=boxed). */}
      <IconButton
        variant="boxed"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-10 h-8 w-8 sm:right-8 sm:top-8"
      >
        <X size={16} />
      </IconButton>

      <IconButton
        variant="boxed"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label="Imagen anterior"
        className="absolute left-3 top-1/2 z-10 h-8 w-8 -translate-y-1/2 sm:left-8"
      >
        <ChevronLeft size={16} />
      </IconButton>

      <IconButton
        variant="boxed"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label="Imagen siguiente"
        className="absolute right-3 top-1/2 z-10 h-8 w-8 -translate-y-1/2 sm:right-8"
      >
        <ChevronRight size={16} />
      </IconButton>

      {/* Image — drag to swipe between images. cursor-grab/grabbing signals
          draggability; threshold-based commit so short taps still bubble as
          clicks (and stopPropagation keeps them from closing the lightbox).
          touch-none suppresses iOS Safari's edge-swipe-back gesture (the
          native blue back arrow that would otherwise hijack horizontal drags
          starting near the screen edge). Same pattern as BeforeAfterSlider. */}
      <div
        className={`relative h-[85vh] w-[90vw] touch-none select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          e.preventDefault();
          dragStartXRef.current = e.clientX;
          setIsDragging(true);
        }}
        onTouchStart={(e) => {
          dragStartXRef.current = e.touches[0].clientX;
          setIsDragging(true);
        }}
        onDragStart={(e) => e.preventDefault()}
        style={
          isDragging && !reducedMotionRef.current
            ? {
                transform: `translateX(${dragX * DRAG_DAMPING}px)`,
                transition: "none",
              }
            : undefined
        }
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          draggable={false}
          sizes="90vw"
          className="pointer-events-none object-contain"
        />
      </div>

      {/* Caption + counter */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 px-4 text-center sm:bottom-6">
        <p className="text-caption font-semibold uppercase tracking-wider text-white">
          {image.alt}
        </p>
        <p className="text-caption text-white/60">
          {index + 1} / {total}
        </p>
      </div>
    </div>
  );
}

function MediaCard({ entry, index }: { entry: MediaEntry; index: number }) {
  const { ref, className, style } = useFadeInOnView<HTMLDivElement>({
    delay: (index % 3) * 100,
  });
  const isExternal = entry.url && entry.url !== "#";
  const Wrapper = isExternal ? "a" : "div";
  const wrapperProps = isExternal
    ? { href: entry.url, target: "_blank", rel: "noopener noreferrer" }
    : {};
  return (
    <div ref={ref} className={className} style={style}>
      <Wrapper
        {...wrapperProps}
        className={`card-flat block transition-all ${isExternal ? "hover:border-line-control" : ""}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-caption font-semibold uppercase tracking-widest text-accent">
            {entry.publication}
          </p>
          <span className="text-caption text-content-tertiary">
            {entry.year}
          </span>
        </div>
        <div className="mt-3 flex items-start justify-between gap-4">
          <h3 className="text-h2 font-semibold text-content-primary">
            {entry.title}
          </h3>
          {isExternal && (
            <ExternalLink
              size={18}
              className="mt-1 shrink-0 text-content-tertiary transition-colors group-hover:text-accent"
            />
          )}
        </div>
        <p className="mt-3 text-body leading-relaxed text-content-secondary">
          {entry.excerpt}
        </p>
      </Wrapper>
    </div>
  );
}

export default function PortfolioPage() {
  const galleryParallax = useScrollParallax<HTMLElement>();
  const mediaParallax = useScrollParallax<HTMLElement>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const total = portfolioImages.length;
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + total) % total));
  const nextImage = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % total));

  return (
    <>
      <PublicNavbar />
      <main className="pt-16">
        {/* === Intro (Servicios-style centered header) + Palmarés en la misma sección
            para que la primera sección sea suficientemente alta y las siguientes
            (con parallax) no salten al refrescar. === */}
        <section className="bg-surface-primary py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">
                Portfolio »»
              </p>
              <h1 className="mt-2 text-display text-content-primary">
                En tarima.
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-base text-content-secondary">
                Campeón de Andalucía. Campeón de España Sub 23. Top 15 Míster
                Universo.
              </p>
            </div>
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">
                  Palmarés »»
                </span>
                <h2 className="text-[18px] leading-7 md:text-h1 font-bold text-content-primary">
                  Competiciones
                </h2>
              </div>
              <div className="space-y-6">
                {portfolioPalmares.map((entry, i) => (
                  <PalmaresCard
                    key={`${entry.year}-${entry.title}`}
                    entry={entry}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* === Galería === */}
        <section
          ref={galleryParallax.ref}
          style={galleryParallax.style}
          className="bg-surface-secondary py-20"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">
                Galería »»
              </span>
              <h2 className="text-[18px] leading-7 md:text-h1 font-bold text-content-primary">
                Momentos en escena
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {portfolioImages.map((img, i) => (
                <PortfolioCard
                  key={img.src}
                  image={img}
                  index={i}
                  onClick={() => setLightboxIndex(i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* === Prensa === */}
        <section
          ref={mediaParallax.ref}
          style={mediaParallax.style}
          className="bg-surface-primary py-20"
        >
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-12 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">
                Prensa »»
              </span>
              <h2 className="text-[18px] leading-7 md:text-h1 font-bold text-content-primary">
                En los medios
              </h2>
            </div>
            <div className="grid gap-4">
              {portfolioMedia.map((entry, i) => (
                <MediaCard
                  key={`${entry.publication}-${entry.year}`}
                  entry={entry}
                  index={i}
                />
              ))}
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <PublicFooter />
      {lightboxIndex !== null && (
        <Lightbox
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </>
  );
}
