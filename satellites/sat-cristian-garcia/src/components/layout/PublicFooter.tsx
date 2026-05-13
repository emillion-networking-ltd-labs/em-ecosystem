import Link from "next/link";
import { siteConfig, footerLinks } from "@/lib/data";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border-default bg-surface-primary py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-[20px] uppercase tracking-[0.2em] text-content-primary">
              <span className="font-black">Cristian</span>{" "}
              <span className="font-light">Garcia</span>
            </p>
            <p className="mt-3 text-caption text-content-tertiary">
              Disciplina. Consistencia. Resultados.
            </p>
          </div>
          <div>
            <p className="mb-3 text-caption font-semibold uppercase tracking-wider text-content-secondary">
              Navegacion
            </p>
            <div className="flex flex-col gap-2">
              {footerLinks.nav.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-body text-content-tertiary transition-colors hover:text-accent"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-caption font-semibold uppercase tracking-wider text-content-secondary">
              Legal
            </p>
            <div className="flex flex-col gap-2">
              {footerLinks.legal.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-body text-content-tertiary transition-colors hover:text-accent"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-caption font-semibold uppercase tracking-wider text-content-secondary">
              Contacto
            </p>
            <div className="flex flex-col gap-2 text-body text-content-tertiary">
              <span>{siteConfig.location}</span>
              <a
                href={`mailto:${siteConfig.email}`}
                className="transition-colors hover:text-accent"
              >
                {siteConfig.email}
              </a>
              <span>{siteConfig.instagram}</span>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border-default pt-6 text-center">
          <p className="text-caption text-content-tertiary">
            &copy; {new Date().getFullYear()} {siteConfig.name}. Powered by EM
            Ecosystem.
          </p>
        </div>
      </div>
    </footer>
  );
}
