"use client";

import { useEffect, useRef } from "react";
import { useFadeInOnView } from "@/lib/useFadeInOnView";
import { socialProofStats } from "@/lib/data";

type Stat = (typeof socialProofStats)[number];

function HeroStatCard({
  stat,
  index,
  variant,
}: {
  stat: Stat;
  index: number;
  variant: "desktop" | "mobile";
}) {
  const { ref, className, style } = useFadeInOnView<HTMLDivElement>({
    delay: (index % 4) * 100,
  });
  return (
    <div
      ref={ref}
      className={`${
        variant === "desktop"
          ? "card-flat flex flex-col items-center justify-center bg-black/25! border-white/10! backdrop-blur-xs px-5! py-6! min-w-[120px]"
          : "card-flat text-center py-8"
      } ${className}`}
      style={style}
    >
      <p
        className={`text-h1 font-black ${variant === "desktop" ? "text-[#D4A843]!" : "text-accent"}`}
      >
        {stat.value}
      </p>
      <p
        className={`mt-2 ${variant === "desktop" ? "text-caption text-center text-white/60!" : "text-body text-content-secondary"}`}
      >
        {stat.label}
      </p>
    </div>
  );
}

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cycle the hero video between normal and fast playback to highlight motion.
  // Re-applies on play/playing to survive autoplay delays and loop iterations
  // (some browsers reset playbackRate when the video restarts via the loop attribute).
  // Skipped for users with prefers-reduced-motion.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sequence: { rate: number; duration: number }[] = [
      { rate: 1, duration: 2000 },
      { rate: 2, duration: 2500 },
    ];
    let i = 0;
    let currentRate = 1;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const step = sequence[i % sequence.length];
      currentRate = step.rate;
      video.playbackRate = step.rate;
      timeout = setTimeout(tick, step.duration);
      i++;
    };

    const reapply = () => {
      video.playbackRate = currentRate;
    };

    video.addEventListener("play", reapply);
    video.addEventListener("playing", reapply);
    video.addEventListener("seeked", reapply);

    tick();

    return () => {
      clearTimeout(timeout);
      video.removeEventListener("play", reapply);
      video.removeEventListener("playing", reapply);
      video.removeEventListener("seeked", reapply);
    };
  }, []);

  return (
    <>
      <section className="relative z-20 flex h-[50vh] flex-col landscape:max-lg:min-h-[440px] lg:h-[60vh]">
        {/* Video + overlay contained (so they don't overflow hero) */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
          >
            <source src="/videos/hero-montage.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 mt-auto mb-12 w-full px-6 sm:px-12 lg:px-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            {/* Left: title + CTA */}
            <div>
              <h1 className="text-display text-white max-w-2xl">
                Aquí
                <br />
                cambiarás tu
                <br />
                vida.
              </h1>
              <div className="mt-10 flex">
                <a
                  href="/contacto"
                  className="inline-flex items-center justify-center px-5 md:px-8 py-3 text-body md:text-h3 font-normal uppercase tracking-wider rounded-md h-12 text-white border border-white/30 hover:bg-white/10 transition-all"
                >
                  EMPIEZA TU TRANSFORMACIÓN
                </a>
              </div>
            </div>

            {/* Desktop: stats inside hero */}
            <div className="hidden lg:grid grid-cols-2 xl:grid-cols-4 gap-3 relative z-20">
              {socialProofStats.map((s, i) => (
                <HeroStatCard
                  key={s.label}
                  stat={s}
                  index={i}
                  variant="desktop"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: stats outside hero, normal theme */}
      <div className="relative z-20 lg:hidden bg-surface-secondary py-10 px-6">
        <div className="grid grid-cols-2 gap-4">
          {socialProofStats.map((s, i) => (
            <HeroStatCard key={s.label} stat={s} index={i} variant="mobile" />
          ))}
        </div>
      </div>
    </>
  );
}
