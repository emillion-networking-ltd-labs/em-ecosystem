"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { useReveal } from "@/hooks/useReveal";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Grid } from "@/components/ui/Grid";

// Sección PORTFOLIO del design-system (ECO-55; REFINADA ECO-93: lenguaje NEUTRO + variante `gallery`). Muestra
// trabajos/fotos REALES del cliente (del brief — nunca inventados; sin items, se omite). Variantes:
//   · `grid` (default) / `featured` → tarjetas con título/descripción + imagen opcional (tile NEUTRO si falta).
//   · `gallery` → rejilla de imágenes con caption al hover + LIGHTBOX (zoom, drag-swipe, teclado, prev/next).
// Cabecera en `display`, hover de borde neutro, cero accent placeholder. Genérico por props. Reveal, a11y.
export interface PortfolioItem {
  /** Título del trabajo (o caption en `gallery`). Opcional. */
  title?: string;
  description?: string;
  imageSrc?: string;
  href?: string;
}
export interface PortfolioProps {
  eyebrow?: string;
  title: string;
  items: PortfolioItem[];
  viewAllText?: string;
  viewAllHref?: string;
  variant?: "grid" | "featured" | "gallery";
}

interface GalleryImage {
  imageSrc: string;
  caption?: string;
}

function Header({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {eyebrow ? (
        <p className="text-caption font-semibold uppercase tracking-wider text-content-secondary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-display-2 font-bold text-content-primary">
        {title}
      </h2>
    </div>
  );
}

function ViewAll({ text, href }: { text?: string; href?: string }) {
  if (!text || !href) return null;
  return (
    <div className="mt-10 text-center">
      <Button as="a" href={href} variant="outline" size="md">
        {text}
      </Button>
    </div>
  );
}

function PortfolioCard({
  item,
  index,
  featured,
}: {
  item: PortfolioItem;
  index: number;
  featured: boolean;
}) {
  const { ref, style } = useReveal<HTMLElement>({ delay: (index % 3) * 90 });
  const hasImg = !!item.imageSrc;
  const big = featured && index === 0;
  const Wrapper = item.href ? "a" : "div";
  return (
    <article ref={ref} style={style} className={big ? "sm:col-span-2" : ""}>
      <Wrapper
        {...(item.href ? { href: item.href } : {})}
        className="group block overflow-hidden rounded-2xl border border-border-default bg-surface-primary transition-colors hover:border-border-strong"
      >
        <div
          className={`relative ${big ? "aspect-[2/1]" : "aspect-[4/3]"} ${hasImg ? "" : "flex items-end bg-surface-secondary"}`}
        >
          {hasImg ? (
            <Image
              src={item.imageSrc!}
              alt={item.title || ""}
              fill
              sizes={
                big
                  ? "(min-width: 1024px) 56rem, 100vw"
                  : "(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
              }
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : item.title ? (
            <span className="p-5 text-h3 font-semibold text-content-primary">
              {item.title}
            </span>
          ) : null}
        </div>
        {item.title || item.description ? (
          <div className="p-5">
            {item.title ? (
              <h3 className="text-h3 font-semibold text-content-primary">
                {item.title}
              </h3>
            ) : null}
            {item.description ? (
              <p className="mt-1 text-body leading-relaxed text-content-secondary">
                {item.description}
              </p>
            ) : null}
          </div>
        ) : null}
      </Wrapper>
    </article>
  );
}

function GalleryTile({
  image,
  index,
  onOpen,
}: {
  image: GalleryImage;
  index: number;
  onOpen: () => void;
}) {
  const { ref, style } = useReveal<HTMLButtonElement>({
    delay: (index % 4) * 90,
  });
  return (
    <button
      ref={ref}
      style={style}
      onClick={onOpen}
      aria-label={`View image${image.caption ? `: ${image.caption}` : ` ${index + 1}`}`}
      className="group relative aspect-3/4 cursor-zoom-in overflow-hidden rounded-lg"
    >
      <Image
        src={image.imageSrc}
        alt={image.caption || ""}
        fill
        sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {image.caption ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="text-caption font-semibold uppercase tracking-wider text-white">
            {image.caption}
          </p>
        </div>
      ) : null}
    </button>
  );
}

const SWIPE_THRESHOLD = 80;
const DRAG_DAMPING = 0.3;

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const image = images[index];
  const total = images.length;
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  // True when a drag just crossed the threshold and changed slide → suppress the
  // backdrop close that would otherwise fire when mouseup lands outside the image.
  const justDraggedRef = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "ArrowLeft") onPrev();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      setDragX(x - dragStartXRef.current);
    };
    const onUp = () => {
      setIsDragging(false);
      setDragX((cur) => {
        if (Math.abs(cur) > SWIPE_THRESHOLD) {
          justDraggedRef.current = true;
          if (cur > 0) onPrev();
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

  const onBackdrop = () => {
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
      aria-label={image.caption || "Image"}
      // `dark` fuerza los tokens de dark mode en los descendientes (IconButton boxed) para que el overlay
      // oscuro los renderice con el contraste correcto sin importar el tema del usuario.
      className="dark fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xs"
      onClick={onBackdrop}
    >
      <IconButton
        variant="boxed"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
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
        aria-label="Previous image"
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
        aria-label="Next image"
        className="absolute right-3 top-1/2 z-10 h-8 w-8 -translate-y-1/2 sm:right-8"
      >
        <ChevronRight size={16} />
      </IconButton>
      <div
        className={`relative h-[85vh] w-[90vw] touch-none select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
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
          isDragging
            ? {
                transform: `translateX(${dragX * DRAG_DAMPING}px)`,
                transition: "none",
              }
            : undefined
        }
      >
        <Image
          src={image.imageSrc}
          alt={image.caption || ""}
          fill
          priority
          draggable={false}
          sizes="90vw"
          className="pointer-events-none object-contain"
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 px-4 text-center sm:bottom-6">
        {image.caption ? (
          <p className="text-caption font-semibold uppercase tracking-wider text-white">
            {image.caption}
          </p>
        ) : null}
        <p className="text-caption text-white/60">
          {index + 1} / {total}
        </p>
      </div>
    </div>
  );
}

function Gallery({
  eyebrow,
  title,
  items,
  viewAllText,
  viewAllHref,
}: Omit<PortfolioProps, "variant">) {
  const images: GalleryImage[] = items
    .filter((i) => i.imageSrc)
    .map((i) => ({ imageSrc: i.imageSrc!, caption: i.title }));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const total = images.length;
  const close = () => setLightboxIndex(null);
  const prev = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + total) % total));
  const next = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % total));
  return (
    // ECO-120 — Section + Container `xl` (canónico) + Grid. gap `sm`(16): el gap-3 (12) del original no existe
    // en la escala unificada de ECO-131; `sm` es el más cercano cómodo (revisar si se quiere más apretado: xs=8).
    <Section surface="primary">
      <Container size="xl">
        <Header eyebrow={eyebrow} title={title} />
        <Grid cols={{ base: 2, sm: 3, lg: 4 }} gap="sm" className="mt-12">
          {images.map((img, i) => (
            <GalleryTile
              key={img.imageSrc + i}
              image={img}
              index={i}
              onOpen={() => setLightboxIndex(i)}
            />
          ))}
        </Grid>
        <ViewAll text={viewAllText} href={viewAllHref} />
      </Container>
      {lightboxIndex !== null ? (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      ) : null}
    </Section>
  );
}

export default function Portfolio({
  eyebrow,
  title,
  items,
  viewAllText,
  viewAllHref,
  variant = "grid",
}: PortfolioProps) {
  if (variant === "gallery") {
    return (
      <Gallery
        eyebrow={eyebrow}
        title={title}
        items={items}
        viewAllText={viewAllText}
        viewAllHref={viewAllHref}
      />
    );
  }
  const featured = variant === "featured";
  return (
    // ECO-120 — Section + Container `xl` (canónico 1280; el original 6xl=1152 se unifica al canónico) + Grid.
    <Section surface="primary">
      <Container size="xl">
        <Header eyebrow={eyebrow} title={title} />
        <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap="md" className="mt-12">
          {items.map((item, i) => (
            <PortfolioCard
              key={`${item.title}-${i}`}
              item={item}
              index={i}
              featured={featured}
            />
          ))}
        </Grid>
        <ViewAll text={viewAllText} href={viewAllHref} />
      </Container>
    </Section>
  );
}
