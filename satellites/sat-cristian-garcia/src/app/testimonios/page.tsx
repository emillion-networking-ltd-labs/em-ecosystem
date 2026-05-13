"use client";

import { ExternalLink, Star } from "lucide-react";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import TransformationsPreview from "@/components/sections/TransformationsPreview";
import CTASection from "@/components/sections/CTASection";
import { useFadeInOnView } from "@/lib/useFadeInOnView";
import { googleReviewsMock } from "@/lib/data";

type GoogleReview = (typeof googleReviewsMock.reviews)[number];

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${rating} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            n <= rating
              ? "fill-accent text-accent"
              : "fill-border-strong text-border-strong"
          }
        />
      ))}
    </div>
  );
}

function GoogleReviewCard({
  review,
  index,
}: {
  review: GoogleReview;
  index: number;
}) {
  const { ref, className, style } = useFadeInOnView<HTMLDivElement>({
    delay: (index % 3) * 100,
  });
  return (
    <div ref={ref} className={`card-flat ${className}`} style={style}>
      <div className="flex items-center gap-3">
        <Avatar name={review.name} size="md" />
        <div className="flex-1">
          <p className="text-body font-semibold text-content-primary">
            {review.name}
          </p>
          <p className="text-caption text-content-tertiary">
            {review.relativeDate}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <StarRating rating={review.rating} />
      </div>
      <p className="mt-3 text-body leading-relaxed text-content-secondary">
        {review.text}
      </p>
    </div>
  );
}

export default function TestimoniosPage() {
  const isExternal = googleReviewsMock.profileUrl !== "#";

  return (
    <>
      <PublicNavbar />
      <main className="pt-16">
        {/* === Intro centrada + Google Reviews (combinadas para que la primera
            sección sea suficientemente alta y TransformationsPreview no salte
            al refrescar). Estructura de datos imita Google Places API:
            cuando Cristian vincule su Google Business Profile, swap directo.
            Primera sección NO lleva useScrollParallax (regla establecida en
            sobre-mi y portfolio: la primera sección visible al cargar saltaría
            ~36px porque rect.top empieza positivo bajo el navbar). === */}
        <section className="bg-surface-primary py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 text-center">
              <p className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">
                Testimonios »»
              </p>
              <h1 className="mt-2 text-display text-content-primary">
                Lo dicen ellos.
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-base text-content-secondary">
                Reseñas verificadas en Google Maps de personas que han trabajado
                con Cristian.
              </p>
            </div>

            {/* Aggregate rating + mock disclaimer */}
            <div className="mx-auto mb-10 flex max-w-md flex-col items-center gap-3 text-center">
              <p className="text-display font-black leading-none text-content-primary">
                {googleReviewsMock.rating}
              </p>
              <StarRating
                rating={Math.round(googleReviewsMock.rating)}
                size={20}
              />
              <p className="text-body text-content-secondary">
                {googleReviewsMock.totalReviews} reseñas en Google
              </p>
              {googleReviewsMock.isMock && (
                <Badge variant="warning" size="sm" className="uppercase">
                  Muestra · pendiente vinculación
                </Badge>
              )}
            </div>

            {/* Disclaimer card — visible para que quede claro que es mockup */}
            {googleReviewsMock.isMock && (
              <div className="mx-auto mb-10 max-w-3xl rounded-md border border-warning/40 bg-warning-bg/40 px-5 py-3 text-center">
                <p className="text-caption leading-relaxed text-content-secondary">
                  <strong className="text-content-primary">
                    Esta sección es una muestra.
                  </strong>{" "}
                  Cuando Cristian vincule su Google Business Profile, las
                  reseñas se cargarán automáticamente desde Google Maps en
                  tiempo real.
                </p>
              </div>
            )}

            {/* Reviews grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {googleReviewsMock.reviews.map((review, i) => (
                <GoogleReviewCard
                  key={`${review.name}-${i}`}
                  review={review}
                  index={i}
                />
              ))}
            </div>

            {/* Profile link */}
            <div className="mt-10 text-center">
              {isExternal ? (
                <a
                  href={googleReviewsMock.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-body font-semibold uppercase tracking-wider text-accent transition-colors hover:text-content-primary"
                >
                  Ver perfil en Google Maps
                  <ExternalLink size={16} />
                </a>
              ) : (
                <p className="text-caption text-content-tertiary">
                  Link al perfil disponible una vez vinculado el Google Business
                  Profile.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* === Transformaciones con before/after slider (parallax interno).
            hideTestimonialsLink oculta el botón "VER TODOS LOS TESTIMONIOS"
            y el final del disclaimer porque ya estamos en esa página. === */}
        <TransformationsPreview hideTestimonialsLink />

        <CTASection />
      </main>
      <PublicFooter />
    </>
  );
}
