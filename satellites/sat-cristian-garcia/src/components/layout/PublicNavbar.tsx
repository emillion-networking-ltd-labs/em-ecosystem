"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import { navLinks } from "@/lib/data";

export default function PublicNavbar() {
  const { theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Light mode: always solid bg. Dark mode: transparent over hero, solid when scrolled.
  const hasSolidBg = theme === "light" || scrolled;

  const navBg = hasSolidBg
    ? "bg-surface-primary shadow-[0_1px_0_rgba(0,0,0,0.06)]"
    : "bg-black/25 backdrop-blur-xs";

  const linkCls = hasSolidBg
    ? "text-accent hover:text-content-primary"
    : "text-accent-light hover:text-white";

  const barBg = hasSolidBg ? "bg-surface-inverse" : "bg-white";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className={`text-[18px] uppercase tracking-[0.2em] ${hasSolidBg ? "text-content-primary" : "text-white"}`}
          >
            <span className="font-black">Cristian</span>{" "}
            <span className="font-light">Garcia</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-6 min-[1100px]:flex">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-caption font-semibold uppercase tracking-wider transition-colors ${linkCls}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA + theme */}
          <div className="hidden items-center gap-3 min-[1100px]:flex">
            <Button
              variant={hasSolidBg ? "primary" : "outline"}
              size="md"
              href="/contacto"
              className={
                hasSolidBg
                  ? ""
                  : "text-white! border-white/30! hover:bg-white/10!"
              }
            >
              AGENDAR LLAMADA
            </Button>
            <ThemeToggle
              className={
                hasSolidBg
                  ? ""
                  : "[&_button]:text-white/70! hover:[&_button]:text-white!"
              }
            />
          </div>

          {/* Mobile: theme + hamburger */}
          <div className="flex items-center gap-3 max-[1099px]:flex min-[1100px]:hidden">
            <ThemeToggle
              className={
                hasSolidBg
                  ? ""
                  : "[&_button]:text-white/70! hover:[&_button]:text-white!"
              }
            />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex flex-col gap-1.5"
              aria-label="Menu"
            >
              <span
                className={`block h-0.5 w-5 ${barBg} transition-all ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 ${barBg} transition-all ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 ${barBg} transition-all ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-surface-primary max-[1099px]:flex min-[1100px]:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-h2 font-semibold uppercase tracking-wider text-accent transition-colors hover:text-content-primary"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-8">
            <Button
              variant="primary"
              size="md"
              href="/contacto"
              onClick={() => setMenuOpen(false)}
            >
              AGENDAR LLAMADA
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
