"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

interface AccordionItem {
  title: string;
  children: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
  defaultOpen?: number;
  variant?: "default" | "uppercase";
  borderless?: boolean;
  /** Disposición: `grouped` (caja única dividida, default) o `separated` (cada item en su propia tarjeta,
   *  con separación entre ellos). Ambas conservan la animación de apertura. */
  surface?: "grouped" | "separated";
  /** Indicador: `chevron` (▾ rota 180°, default) o `plus` (un `+` que rota 45° → `×` al abrir). */
  indicator?: "chevron" | "plus";
  /** Estilo por item (aplicado al card de cada item). Genérico; p.ej. para un revelado con delay
   *  incremental (stagger) construido por la sección — el Accordion no conoce el "reveal". */
  itemStyle?: (index: number) => React.CSSProperties;
}

export const accordionSpecs = {
  trigger: {
    shared: "w-full px-4 py-3 text-body font-normal text-content-primary",
    hover: "hover:bg-surface-subtle transition-colors",
  },
  container: {
    shared:
      "rounded-md border border-border-components overflow-hidden bg-surface-primary",
    divider: "divide-y divide-border-strong",
  },
  icon: "ChevronDown 16px text-content-primary/50, rotate-180 on open (duration-200)",
  content: "px-4 pt-3 pb-4",
  animation: {
    style: "CSS grid-template-rows 0fr/1fr transition (Radix UI pattern)",
    duration: "200ms ease-out",
    technique: "Content always mounted, height controlled by grid row sizing",
  },
};

const triggerStyles = {
  default: "text-body font-normal text-content-primary",
  // `uppercase`: IDENTICAL to default (same type, weight and size) — the ONLY difference is UPPERCASE.
  uppercase: "text-body font-normal uppercase text-content-primary",
};

export default function Accordion({
  items,
  className = "",
  defaultOpen,
  variant = "default",
  borderless = false,
  surface = "grouped",
  indicator = "chevron",
  itemStyle,
}: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    defaultOpen ?? null,
  );

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const container =
    surface === "separated"
      ? "flex flex-col gap-3"
      : `rounded-md ${borderless ? "" : "border border-border-components"} overflow-hidden bg-surface-primary divide-y divide-border-strong`;
  const itemClass =
    surface === "separated"
      ? "overflow-hidden rounded-md border border-border-components bg-surface-primary"
      : "";

  return (
    <div className={`${container} ${className}`}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className={itemClass} style={itemStyle?.(i)}>
            <button
              onClick={() => toggle(i)}
              className={`flex w-full items-center justify-between px-4 py-3 ${triggerStyles[variant]} transition-colors hover:bg-surface-subtle`}
            >
              {item.title}
              {indicator === "plus" ? (
                <Plus
                  size={16}
                  className={`shrink-0 text-content-primary/50 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                />
              ) : (
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-content-primary/50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              )}
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-4 pt-3 pb-4">{item.children}</div>
              </div>
            </div>
          </div>
        );
      })}
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
      className={`rounded-md border border-border-components overflow-hidden bg-surface-primary ${className}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-body font-normal text-content-primary transition-colors hover:bg-surface-subtle"
      >
        {title}
        <ChevronDown
          size={16}
          className={`shrink-0 text-content-primary/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pt-3 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
