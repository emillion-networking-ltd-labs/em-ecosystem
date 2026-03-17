"use client";

import Link from "next/link";
import { Home } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2">
      <Link
        href="/dashboard"
        className="flex h-6 w-6 items-center justify-center rounded-xl p-1 text-content-secondary hover:text-content-primary"
      >
        <Home size={16} />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-[14px] leading-[20px] text-content-primary/20">
              /
            </span>
            {isLast || !item.href ? (
              <span className="rounded-lg px-2 py-1 text-[14px] leading-[20px] text-content-primary">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="rounded-lg px-2 py-1 text-[14px] leading-[20px] text-content-tertiary hover:text-content-primary"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
