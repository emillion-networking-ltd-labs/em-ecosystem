"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Birdhouse, ChevronRight } from "lucide-react";
import Icon from "./Icon";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export const breadcrumbsSpecs = {
  link: {
    active: "text-body font-normal text-content-primary (last item)",
    inactive:
      "text-body font-normal text-content-secondary hover:text-content-primary",
  },
  separator: "ChevronRight 16px text-content-tertiary — between all levels",
  home: "text-content-tertiary hover:text-content-primary 16px Birdhouse icon shrink-0",
  collapse:
    "Auto-collapse via ResizeObserver — Home / … / Last when content overflows. The … is a DISCLOSURE BUTTON (aria-expanded) that opens a menu with the hidden levels (navigable); closes on outside-click / Escape.",
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const lastItem = items[items.length - 1];
  const middleItems = items.slice(0, -1);

  // The "full" version is measured; if it overflows, it hides and collapsed shows.
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const container = entry.target as HTMLElement;
        const full = container.querySelector(
          "[data-breadcrumb-full]",
        ) as HTMLElement;
        if (!full) return;
        // Compare full content width vs container width
        setCollapsed(full.scrollWidth > container.clientWidth + 1);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  // Disclosure menu for the hidden levels (best-practice collapsed breadcrumbs): when it doesn't fit
  // on screen, the intermediate levels collapse behind "…", which is a BUTTON that expands them so they
  // stay navigable. Closes on outside-click or Escape.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);
  // If it stops being collapsed (e.g. the container widens), close the menu.
  useEffect(() => {
    if (!collapsed) setMenuOpen(false);
  }, [collapsed]);

  const linkClass =
    "text-body font-normal text-content-secondary transition-colors hover:text-content-primary";
  const activeClass = "text-body font-normal text-content-primary";
  const sepClass = "shrink-0 text-content-tertiary";

  return (
    <div ref={containerRef} className="flex min-w-0 items-center">
      {/* Full version — always rendered for measurement, hidden when collapsed */}
      <nav
        data-breadcrumb-full
        aria-label="Breadcrumb"
        className={`flex items-center gap-1 whitespace-nowrap ${collapsed ? "invisible absolute" : ""}`}
      >
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center justify-center text-content-tertiary transition-colors hover:text-content-primary"
        >
          <Icon icon={Birdhouse} size="md" />
        </Link>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <div key={item.label} className="flex items-center gap-1">
              <Icon icon={ChevronRight} size="md" className={sepClass} />
              {isLast || !item.href ? (
                <span className={activeClass}>{item.label}</span>
              ) : (
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapsed version — shown only when overflow detected */}
      {collapsed && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center justify-center text-content-tertiary transition-colors hover:text-content-primary"
          >
            <Icon icon={Birdhouse} size="md" />
          </Link>
          {middleItems.length > 0 && (
            <div ref={menuRef} className="relative flex items-center gap-1">
              <Icon icon={ChevronRight} size="md" className={sepClass} />
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Show hidden levels"
                className="rounded px-2 py-1 text-body font-normal text-content-secondary transition-colors hover:bg-surface-subtle hover:text-content-primary"
              >
                …
              </button>
              {menuOpen && (
                // SAME classes as the Select popup (1:1 coherence): panel p-6 rounded-xl
                // border-border-strong bg-surface-primary shadow-card gap-0.5; items h-10 px-6
                // py-2.5 rounded-md, text-content-primary hover:bg-surface-subtle. A leading chevron
                // per item echoes the breadcrumb separator.
                <ul
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-1 flex max-h-64 w-fit min-w-[160px] flex-col gap-0.5 overflow-auto rounded-xl border border-border-strong bg-surface-primary p-6 shadow-card animate-dropdown-down"
                >
                  {middleItems.map((item) => (
                    <li key={item.label} role="none">
                      {item.href ? (
                        <Link
                          href={item.href}
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="flex h-10 items-center gap-2 whitespace-nowrap rounded-md px-6 py-2.5 text-body font-normal text-content-primary transition-colors hover:bg-surface-subtle"
                        >
                          <Icon
                            icon={ChevronRight}
                            size="md"
                            className={sepClass}
                          />
                          {item.label}
                        </Link>
                      ) : (
                        <span
                          role="menuitem"
                          className="flex h-10 items-center gap-2 whitespace-nowrap rounded-md px-6 py-2.5 text-body font-normal text-content-tertiary"
                        >
                          <Icon
                            icon={ChevronRight}
                            size="md"
                            className={sepClass}
                          />
                          {item.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Icon icon={ChevronRight} size="md" className={sepClass} />
            <span className={activeClass}>{lastItem.label}</span>
          </div>
        </nav>
      )}
    </div>
  );
}
