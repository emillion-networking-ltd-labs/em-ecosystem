"use client";

import Image from "next/image";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";
import Badge from "@/components/ui/Badge";
import CTASection from "@/components/sections/CTASection";
import { useFadeInOnView } from "@/lib/useFadeInOnView";
import { useScrollParallax } from "@/lib/useScrollParallax";
import { aboutContent } from "@/lib/data";

type TimelineItem = (typeof aboutContent.timeline)[number];

function TimelineEntry({
  item,
  isLast,
}: {
  item: TimelineItem;
  isLast: boolean;
}) {
  // Per-item fade: timeline is a tall vertical column (~1200px total for 5
  // entries), longer than one viewport. Section-level stagger would fire all
  // entries at once when the parent crosses the trigger line, animating items
  // 4-5 behind the fold. Per-item IO observes each entry individually, so each
  // animates as the user scrolls past it. The IO uses the global rootMargin
  // -15% buffer (set in useFadeInOnView default) to fire when the entry is
  // genuinely in view, not when it merely peeks into the viewport bottom.
  const { ref, style } = useFadeInOnView<HTMLDivElement>();
  return (
    <div ref={ref} className="relative pl-10" style={style}>
      {/* Vertical guideline + dot */}
      <span
        aria-hidden
        className={`absolute left-[11px] top-0 w-px bg-accent dark:bg-border-strong ${isLast ? "h-3" : "h-full"}`}
      />
      <span
        aria-hidden
        className="absolute left-1.5 top-1 h-3 w-3 rounded-full bg-accent ring-4 ring-surface-secondary"
      />
      <p className="text-caption font-semibold uppercase tracking-widest text-accent">
        {item.eyebrow}
      </p>
      <h3 className="mt-1 text-h2 font-bold text-content-primary">
        {item.title}
      </h3>
      <p className="mt-2 max-w-prose text-body leading-relaxed text-content-secondary">
        {item.description}
      </p>
    </div>
  );
}

export default function SobreMiPage() {
  const philosophyParallax = useScrollParallax<HTMLElement>();
  const timelineParallax = useScrollParallax<HTMLElement>();
  const credentialsParallax = useScrollParallax<HTMLElement>();
  const storyImageFade = useFadeInOnView<HTMLDivElement>({ from: "left" });
  const storySubtitleFade = useFadeInOnView<HTMLParagraphElement>();
  const storyParagraphsFade = useFadeInOnView<HTMLDivElement>();
  const storyCtaFade = useFadeInOnView<HTMLDivElement>();
  const philosophyHeadlineFade = useFadeInOnView<HTMLHeadingElement>();
  const philosophyBodyFade = useFadeInOnView<HTMLParagraphElement>();
  const credentialsListFade = useFadeInOnView<HTMLDivElement>();

  return (
    <>
      <PublicNavbar />
      <main className="pt-16">
        {/* === Intro centrada (Servicios-style) + Mi historia === */}
        <section className="bg-surface-secondary py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">
                Sobre Mí »»
              </p>
              <h1 className="mt-2 text-display text-content-primary">
                {aboutContent.title}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-base text-content-secondary">
                {aboutContent.lead}
              </p>
            </div>
            <div className="mx-auto flex max-w-[860px] flex-col items-stretch lg:flex-row">
              <div
                ref={storyImageFade.ref}
                className={`w-full overflow-hidden rounded-lg rounded-b-none lg:max-w-[256px] lg:shrink-0 lg:rounded-bl-lg lg:rounded-r-none ${storyImageFade.className}`}
                style={storyImageFade.style}
              >
                <Image
                  src="/images/about-portrait.png"
                  alt="Cristian García — retrato"
                  width={940}
                  height={1672}
                  className="h-auto w-full"
                  sizes="(max-width:1024px) 100vw, 256px"
                  priority
                />
              </div>
              <div className="flex flex-1">
                <div className="card-flat flex h-full w-full flex-col justify-center rounded-t-none text-center lg:rounded-l-none lg:rounded-tr-xl lg:text-left">
                  <div
                    ref={storySubtitleFade.ref}
                    className={`flex flex-wrap items-center justify-center gap-2 lg:justify-start ${storySubtitleFade.className}`}
                    style={storySubtitleFade.style}
                  >
                    {aboutContent.subtitle.split(" · ").map((item) => (
                      <Badge
                        key={item}
                        variant="default"
                        size="sm"
                        className="text-accent! uppercase"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                  <div
                    ref={storyParagraphsFade.ref}
                    className={`mt-3 space-y-4 text-body leading-relaxed text-content-secondary ${storyParagraphsFade.className}`}
                    style={storyParagraphsFade.style}
                  >
                    {aboutContent.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  <div
                    ref={storyCtaFade.ref}
                    className={`mt-8 ${storyCtaFade.className}`}
                    style={storyCtaFade.style}
                  >
                    <a
                      href="/contacto"
                      className="inline-flex h-12 w-full items-center justify-center rounded-md border border-content-primary/30 px-5 md:px-8 py-3 text-body md:text-h3 font-normal uppercase tracking-wider text-content-primary transition-all hover:bg-content-primary/10 lg:w-auto"
                    >
                      TRABAJA CONMIGO
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === Filosofía (pull-quote) === */}
        <section
          ref={philosophyParallax.ref}
          style={philosophyParallax.style}
          className="bg-surface-primary py-20"
        >
          <div className="mx-auto max-w-4xl px-6">
            <div className="border-l border-accent pl-6 md:pl-10 dark:border-line-strong">
              <p className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">
                Filosofía »»
              </p>
              <h2
                ref={philosophyHeadlineFade.ref}
                className={`mt-3 text-[18px] leading-7 md:text-h1 font-bold text-content-primary ${philosophyHeadlineFade.className}`}
                style={philosophyHeadlineFade.style}
              >
                {aboutContent.philosophy.headline}
              </h2>
              <p
                ref={philosophyBodyFade.ref}
                className={`mt-6 text-h3 leading-relaxed text-content-secondary md:text-h2 ${philosophyBodyFade.className}`}
                style={philosophyBodyFade.style}
              >
                {aboutContent.philosophy.body}
              </p>
            </div>
          </div>
        </section>

        {/* === Trayectoria (timeline) === */}
        <section
          ref={timelineParallax.ref}
          style={timelineParallax.style}
          className="bg-surface-secondary py-20"
        >
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-12 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">
                Trayectoria »»
              </span>
              <h2 className="text-[18px] leading-7 md:text-h1 font-bold text-content-primary">
                20+ años de carrera
              </h2>
            </div>
            <div className="space-y-10">
              {aboutContent.timeline.map((item, i) => (
                <TimelineEntry
                  key={item.title}
                  item={item}
                  isLast={i === aboutContent.timeline.length - 1}
                />
              ))}
            </div>
          </div>
        </section>

        {/* === Credenciales === */}
        <section
          ref={credentialsParallax.ref}
          style={credentialsParallax.style}
          className="bg-surface-primary py-20"
        >
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="mb-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">
                Credenciales »»
              </span>
              <h2 className="text-[18px] leading-7 md:text-h1 font-bold text-content-primary">
                Lo que respalda el método
              </h2>
            </div>
            <div
              ref={credentialsListFade.ref}
              className={`flex flex-wrap items-center justify-center gap-2 ${credentialsListFade.className}`}
              style={credentialsListFade.style}
            >
              {aboutContent.credentials.map((c) => (
                <Badge
                  key={c}
                  variant="default"
                  size="md"
                  className="text-accent!"
                >
                  {c}
                </Badge>
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
