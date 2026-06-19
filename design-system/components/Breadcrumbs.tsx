"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Birdhouse, ChevronRight } from "lucide-react";

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
      "text-body font-normal text-content-primary/75 hover:text-content-primary",
  },
  separator: "ChevronRight 16px text-content-tertiary — between all levels",
  home: "text-content-tertiary hover:text-content-primary 16px Birdhouse icon shrink-0",
  collapse:
    "Auto-collapse via ResizeObserver — Home / … / Last when content overflows container",
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const lastItem = items[items.length - 1];
  const middleItems = items.slice(0, -1);

  // Render both versions, hide one with CSS based on overflow
  // The "full" version is measured; if it overflows, it hides and collapsed shows
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

  const linkClass =
    "text-body font-normal text-content-tertiary transition-colors hover:text-content-primary";
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
          <Birdhouse size={16} />
        </Link>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <div key={item.label} className="flex items-center gap-1">
              <ChevronRight size={16} className={sepClass} />
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
            <Birdhouse size={16} />
          </Link>
          {middleItems.length > 0 && (
            <div className="flex items-center gap-1">
              <ChevronRight size={16} className={sepClass} />
              <span className="px-2 py-1 text-body font-normal text-content-tertiary">
                …
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <ChevronRight size={16} className={sepClass} />
            <span className={activeClass}>{lastItem.label}</span>
          </div>
        </nav>
      )}
    </div>
  );
}
