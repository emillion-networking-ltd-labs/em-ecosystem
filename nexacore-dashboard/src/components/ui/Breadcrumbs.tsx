"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export const breadcrumbsSpecs = {
  link: {
    active:
      "text-sm font-medium leading-[21px] text-content-primary (last item)",
    inactive:
      "text-sm font-medium leading-[21px] text-content-primary/75 hover:text-content-primary",
  },
  separator: "text-sm font-medium leading-[21px] text-content-primary/20",
  home: "text-content-primary/75 hover:text-content-primary 16px Home icon shrink-0",
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
    "rounded-lg px-2 py-1 text-sm font-medium leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary";
  const activeClass =
    "rounded-lg px-2 py-1 text-sm font-medium leading-[21px] text-content-primary";
  const sepClass =
    "shrink-0 text-sm font-medium leading-[21px] text-content-primary/20";

  return (
    <div ref={containerRef} className="min-w-0 overflow-hidden">
      {/* Full version — always rendered for measurement, hidden when collapsed */}
      <nav
        data-breadcrumb-full
        aria-label="Breadcrumb"
        className={`flex items-center gap-2 whitespace-nowrap ${collapsed ? "invisible absolute" : ""}`}
      >
        <Link
          href="/dashboard"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl p-1 text-content-primary/75 transition-colors hover:text-content-primary"
        >
          <Home size={16} />
        </Link>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <div key={item.label} className="flex items-center gap-2">
              <span className={sepClass}>/</span>
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
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <Link
            href="/dashboard"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl p-1 text-content-primary/75 transition-colors hover:text-content-primary"
          >
            <Home size={16} />
          </Link>
          {middleItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className={sepClass}>/</span>
              <span className="px-2 py-1 text-sm font-medium leading-[21px] text-content-primary/50">
                …
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className={sepClass}>/</span>
            <span className={activeClass}>{lastItem.label}</span>
          </div>
        </nav>
      )}
    </div>
  );
}
