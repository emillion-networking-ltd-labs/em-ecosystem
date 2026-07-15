"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Dumbbell, Star } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import { useFadeInOnView } from "@/lib/useFadeInOnView";
import { transformations } from "@/lib/data";

const SWIPE_THRESHOLD = 80; // px — minimum drag distance to change slide
const DRAG_DAMPING = 0.3; // visual translation = cursor delta * this. Threshold still uses raw cursor delta.
const EXIT_DURATION = 900; // ms (text 600ms fade-down + slider 300ms fade-out delayed by 600ms)
const ENTER_DURATION = 900; // ms (slider 300ms fade-in + text 600ms fade-up delayed by 300ms)

type TransitionPhase = "idle" | "exiting" | "entering";

export default function TransformationsPreview({
  hideTestimonialsLink = false,
}: {
  hideTestimonialsLink?: boolean;
} = {}) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const pendingIndexRef = useRef<number | null>(null);
  const transitionTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const headerFade = useFadeInOnView<HTMLDivElement>();
  const starsFade = useFadeInOnView<HTMLDivElement>();
  const quoteFade = useFadeInOnView<HTMLQuoteElement>();
  const authorFade = useFadeInOnView<HTMLDivElement>();
  const disclaimerFade = useFadeInOnView<HTMLParagraphElement>();
  const sliderFade = useFadeInOnView<HTMLDivElement>();

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      transitionTimeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const goTo = (newIndex: number) => {
    if (newIndex === activeIndex || phase !== "idle") return;
    pendingIndexRef.current = newIndex;
    setPhase("exiting");

    // After exit completes, swap content and trigger enter phase
    const exitTimeout = setTimeout(() => {
      if (pendingIndexRef.current !== null) {
        setActiveIndex(pendingIndexRef.current);
        pendingIndexRef.current = null;
      }
      setPhase("entering");

      // After enter completes, return to idle
      const enterTimeout = setTimeout(() => {
        setPhase("idle");
      }, ENTER_DURATION);
      transitionTimeoutsRef.current.push(enterTimeout);
    }, EXIT_DURATION);
    transitionTimeoutsRef.current.push(exitTimeout);
  };

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

  // Global pointer move/up handlers active only while dragging
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      setDragX(x - dragStartXRef.current);
    };
    const onUp = () => {
      setIsDragging(false);
      setDragX((current) => {
        if (current > SWIPE_THRESHOLD && activeIndex > 0) {
          goTo(activeIndex - 1);
        } else if (
          current < -SWIPE_THRESHOLD &&
          activeIndex < transformations.length - 1
        ) {
          goTo(activeIndex + 1);
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
  }, [isDragging, activeIndex]);

  const onPointerDown = (clientX: number, defaultPrevented: boolean) => {
    // Skip if BeforeAfterSlider (or any inner control) already handled the event,
    // or if a slide transition is currently in progress
    if (defaultPrevented || phase !== "idle") return;
    dragStartXRef.current = clientX;
    setIsDragging(true);
  };

  const current = transformations[activeIndex];

  // Dots renderer — used twice: ABOVE the grid on mobile (carousel awareness)
  // and BELOW the grid on desktop (familiar position alongside visible content).
  const renderDots = () =>
    transformations.map((t, idx) => (
      <button
        key={t.id}
        onClick={() => goTo(idx)}
        aria-label={`Ver testimonio ${idx + 1}: ${t.name}`}
        aria-current={idx === activeIndex ? "true" : undefined}
        className="group flex h-7 w-7 items-center justify-center rounded-full"
      >
        <span
          className={`h-3 w-3 rounded-full transition-all ${
            idx === activeIndex
              ? "bg-content-primary outline-solid outline-2 outline-offset-2 outline-content-primary/75"
              : "bg-border-components group-hover:bg-content-tertiary"
          }`}
        />
      </button>
    ));

  return (
    <section
      ref={ref}
      className="bg-surface-secondary py-12"
      style={{ transform: `translateY(${offset}px)` }}
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div
          ref={headerFade.ref}
          className={`mb-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 ${headerFade.className}`}
          style={headerFade.style}
        >
          <span className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">
            Transformaciones »»
          </span>
          <h2 className="text-[18px] leading-7 md:text-h1 font-bold text-content-primary">
            Resultados reales
          </h2>
        </div>

        {/* Mobile-only dots: ABOVE the grid so carousel awareness is established
            before the user engages with the testimonial content. Hidden on
            desktop (md+) where dots stay below the grid alongside visible content. */}
        <div className="mb-8 flex items-center justify-center gap-4 md:hidden">
          {renderDots()}
        </div>

        {/* Slide content — sequential transition driven by `phase` class:
            phase-exiting: text fade-down → slider fade-out (1200ms total)
            phase-entering: slider fade-in → text fade-up (1200ms total)
            Drag-to-swipe via pointer/touch; conflict-free with BeforeAfterSlider
            (skips if defaultPrevented). Drag blocked while transitioning. */}
        <div
          onMouseDown={(e) => onPointerDown(e.clientX, e.defaultPrevented)}
          onTouchStart={(e) =>
            onPointerDown(e.touches[0].clientX, e.defaultPrevented)
          }
          style={
            isDragging
              ? {
                  transform: `translateX(${dragX * DRAG_DAMPING}px)`,
                  transition: "none",
                }
              : undefined
          }
          className={`grid grid-cols-1 gap-10 md:grid-cols-5 md:gap-12 select-none phase-${phase} ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {/* Left column (3/5) — testimonial.
              Mobile: order-2 → renders BELOW the image (image is the visual hook).
              Desktop (md+): order-1 → renders LEFT of the image. */}
          <div className="order-2 md:order-1 md:col-span-3 flex flex-col justify-center slide-text">
            {/* Stars */}
            <div
              ref={starsFade.ref}
              className={`mb-6 flex items-center gap-1.5 ${starsFade.className}`}
              style={starsFade.style}
            >
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={18} className="fill-accent text-accent" />
                ))}
              </div>
              <span className="text-body font-semibold text-content-primary">
                5.0
              </span>
            </div>

            {/* Quote */}
            <blockquote
              ref={quoteFade.ref}
              className={`text-h3 md:text-h2 leading-relaxed text-content-primary ${quoteFade.className}`}
              style={quoteFade.style}
            >
              &ldquo;{current.quote}&rdquo;
            </blockquote>

            {/* Author + metadata badges */}
            <div
              ref={authorFade.ref}
              className={`mt-8 ${authorFade.className}`}
              style={authorFade.style}
            >
              <p className="text-h3 md:text-h2 font-bold uppercase tracking-wide text-content-primary">
                {current.name}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge
                  variant="default"
                  size="sm"
                  className="text-accent! uppercase gap-1.5"
                >
                  <Clock size={14} />
                  {current.duration}
                </Badge>
                <Badge
                  variant="default"
                  size="sm"
                  className="text-accent! uppercase gap-1.5"
                >
                  <Dumbbell size={14} />
                  {current.result}
                </Badge>
              </div>
            </div>

            {/* Disclaimer */}
            <p
              ref={disclaimerFade.ref}
              className={`mt-8 text-caption text-content-tertiary leading-relaxed ${disclaimerFade.className}`}
              style={disclaimerFade.style}
            >
              Los resultados pueden variar. Cada plan se adapta a la situación
              individual del cliente — edad, composición corporal de partida,
              experiencia previa y compromiso personal.
              {!hideTestimonialsLink &&
                " Para resultados típicos, consulta nuestra página completa de testimonios."}
            </p>
          </div>

          {/* Right column (2/5) — before/after slider.
              Mobile: order-1 → renders ABOVE the testimonial text (image-first hook).
              Desktop (md+): order-2 → renders RIGHT of the text column. */}
          <div className="order-1 md:order-2 md:col-span-2 slide-media">
            <div
              ref={sliderFade.ref}
              className={`card-flat p-0! overflow-hidden w-full md:w-3/4 md:mx-auto ${sliderFade.className}`}
              style={sliderFade.style}
            >
              <BeforeAfterSlider
                before={{
                  src: current.before,
                  alt: `${current.name} — antes`,
                  // Daniel Navarro (id=3): nudge before image 6px to the right for better framing
                  imageStyle:
                    current.id === 3
                      ? { transform: "translateX(6px)" }
                      : undefined,
                  label: (
                    <div className="absolute top-3 left-3">
                      <Badge variant="overlay" size="sm">
                        ANTES
                      </Badge>
                    </div>
                  ),
                }}
                after={{
                  src: current.after,
                  alt: `${current.name} — después`,
                  label: (
                    <div className="absolute bottom-3 right-3">
                      <Badge variant="overlay" size="sm">
                        DESPUÉS
                      </Badge>
                    </div>
                  ),
                }}
                aspectRatio="4/5"
                orientation="vertical"
              />
              {/* (metadata badges moved to left column, see "Author + metadata badges") */}
            </div>
          </div>
        </div>

        {/* Desktop-only dots: BELOW the grid where they sit alongside the
            visible content (in mobile they live ABOVE the grid — see top of
            this section). Bigger filled dots; active gets an outline halo
            inspired by the Input focus pattern (outline + offset). */}
        <div className="mt-10 hidden items-center justify-center gap-4 md:flex">
          {renderDots()}
        </div>
      </div>

      {/* Divider with link — oculto cuando se renderiza dentro de /testimonios */}
      {!hideTestimonialsLink && (
        <div className="mt-10 flex items-center">
          <div className="flex-1 border-t border-dashed border-accent dark:border-line-strong" />
          <div className="px-6">
            <Button variant="link" as="a" href="/testimonios">
              VER TODOS LOS TESTIMONIOS
            </Button>
          </div>
          <div className="flex-1 border-t border-dashed border-accent dark:border-line-strong" />
        </div>
      )}
    </section>
  );
}
