"use client";

import { AtSign, Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";
import ContactForm from "@/components/sections/ContactForm";
import { useFadeInOnView } from "@/lib/useFadeInOnView";
import { siteConfig } from "@/lib/data";

type ContactMethod = {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
};

function ContactMethodCard({ method, index }: { method: ContactMethod; index: number }) {
  const Icon = method.icon;
  const isClickable = !!method.href;
  // Per-item IntersectionObserver: each card animates only when *it* enters
  // the viewport. Cards stack vertically on mobile (~350px each), so a section-
  // level stagger would fire all 4 at once when the first comes into view —
  // cards 2-4 animate invisibly below the fold. Same fix as /sobre-mi timeline.
  const { ref, className, style } = useFadeInOnView<HTMLDivElement>({
    delay: index * 100,
  });

  const inner = (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-tertiary">
        <Icon size={18} className="text-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-caption font-semibold uppercase tracking-widest text-accent">{method.label}</p>
        <p className="mt-1 break-words text-body text-content-primary">{method.value}</p>
      </div>
    </div>
  );

  if (isClickable) {
    const externalProps = method.external
      ? { target: "_blank" as const, rel: "noopener noreferrer" }
      : {};
    return (
      <a
        ref={ref as unknown as React.Ref<HTMLAnchorElement>}
        href={method.href}
        {...externalProps}
        style={style}
        className={`card-flat block transition-colors hover:border-border-components ${className}`}
      >
        {inner}
      </a>
    );
  }

  return (
    <div ref={ref} style={style} className={`card-flat ${className}`}>
      {inner}
    </div>
  );
}

export default function ContactoPage() {
  // Per-element fade-ins. The 4 contact-method cards each get their own IO
  // inside ContactMethodCard so each fires when *that card* enters the viewport
  // (mobile stack > 1 viewport tall — section stagger would fire all at once).
  const trustBadgeFade = useFadeInOnView<HTMLDivElement>({ delay: 0 });
  const formFade = useFadeInOnView<HTMLDivElement>({ delay: 200 });

  // Numeric WhatsApp for wa.me link (strip + and any spaces)
  const whatsappDigits = siteConfig.whatsapp.replace(/[^\d]/g, "");
  const instagramHandle = siteConfig.instagram.replace(/^@/, "");

  const contactMethods: ContactMethod[] = [
    {
      icon: Mail,
      label: "Email",
      value: siteConfig.email,
      href: `mailto:${siteConfig.email}`,
      external: false,
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: siteConfig.whatsapp,
      href: `https://wa.me/${whatsappDigits}`,
      external: true,
    },
    {
      icon: AtSign,
      label: "Instagram",
      value: siteConfig.instagram,
      href: `https://instagram.com/${instagramHandle}`,
      external: true,
    },
    {
      icon: MapPin,
      label: "Ubicación",
      value: siteConfig.location,
    },
  ];

  return (
    <>
      <PublicNavbar />
      <main className="pt-16">
        <section className="bg-surface-primary py-20">
          <div className="mx-auto max-w-7xl px-6">
            {/* Header — pattern del proyecto, estático */}
            <div className="mb-12 text-center">
              <p className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">Contacto »»</p>
              <h1 className="mt-2 text-display text-content-primary">Hablemos.</h1>
              <p className="mx-auto mt-3 max-w-xl text-base text-content-secondary">
                Reserva una llamada gratuita de 15 minutos. Sin compromiso.
              </p>
            </div>

            {/* Trust badge — primero en la secuencia (delay 0) */}
            <div
              ref={trustBadgeFade.ref}
              style={trustBadgeFade.style}
              className="mx-auto mb-10 flex max-w-md items-center justify-center gap-2 rounded-md border border-border-strong bg-surface-secondary px-4 py-2.5"
            >
              <Clock size={16} className="text-accent" />
              <p className="text-caption text-content-secondary">{siteConfig.responseTime}</p>
            </div>

            {/* 2-col layout: info de contacto + formulario */}
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
              {/* Left: Métodos alternativos */}
              <div className="lg:col-span-2">
                <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">Directo »»</span>
                  <h2 className="text-[18px] leading-7 md:text-h1 font-bold text-content-primary">Métodos alternativos</h2>
                </div>
                <p className="mb-6 text-body leading-relaxed text-content-secondary">
                  Si prefieres saltarte el formulario, podemos hablar directamente por cualquiera de estos canales.
                </p>
                <div className="space-y-3">
                  {contactMethods.map((method, i) => (
                    <ContactMethodCard key={method.label} method={method} index={i} />
                  ))}
                </div>
              </div>

              {/* Right: Formulario — último en la secuencia (delay 500) */}
              <div className="lg:col-span-3">
                <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[18px] leading-7 md:text-h1 font-semibold tracking-wide text-accent">Formulario »»</span>
                  <h2 className="text-[18px] leading-7 md:text-h1 font-bold text-content-primary">Cuéntame tu objetivo</h2>
                </div>
                <div ref={formFade.ref} style={formFade.style}>
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
