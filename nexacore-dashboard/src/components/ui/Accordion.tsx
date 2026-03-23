"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItem {
  title: string;
  children: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
  defaultOpen?: number;
}

export const accordionSpecs = {
  trigger: {
    shared: "w-full px-4 py-3 text-body font-normal text-content-primary",
    hover: "hover:bg-surface-subtle transition-colors",
  },
  container: {
    shared:
      "rounded-xl border border-border-strong overflow-hidden bg-surface-primary",
    divider: "divide-y divide-border-strong",
  },
  icon: "ChevronDown 16px text-content-primary/50, rotate-180 on open",
  content: "px-4 pt-3 pb-4",
};

export default function Accordion({
  items,
  className = "",
  defaultOpen,
}: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    defaultOpen ?? null,
  );

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div
      className={`rounded-xl border border-border-strong overflow-hidden bg-surface-primary divide-y divide-border-strong ${className}`}
    >
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => toggle(i)}
            className="flex w-full items-center justify-between px-4 py-3 text-body font-normal text-content-primary transition-colors hover:bg-surface-subtle"
          >
            {item.title}
            <ChevronDown
              size={16}
              className={`shrink-0 text-content-primary/50 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
            />
          </button>
          {openIndex === i && (
            <div className="px-4 pt-3 pb-4">{item.children}</div>
          )}
        </div>
      ))}
    </div>
  );
}

interface SingleAccordionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export function SingleAccordion({
  title,
  children,
  className = "",
  defaultOpen = false,
}: SingleAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-xl border border-border-strong overflow-hidden bg-surface-primary ${className}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-body font-normal text-content-primary transition-colors hover:bg-surface-subtle"
      >
        {title}
        <ChevronDown
          size={16}
          className={`shrink-0 text-content-primary/50 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-4 pt-3 pb-4">{children}</div>}
    </div>
  );
}
