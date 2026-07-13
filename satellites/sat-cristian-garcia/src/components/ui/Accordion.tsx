"use client";

// @ds-role: primitive — base disclosure control; composes only Icon (a helper).
import { useId, useState } from "react";
import { tv } from "tailwind-variants";
import { ChevronDown, Plus } from "lucide-react";
import Icon from "./Icon";

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
  /** Layout: `grouped` (single divided box, default) or `separated` (each item in its own card, with
   *  spacing between them). Both keep the open animation. */
  surface?: "grouped" | "separated";
  /** Indicator: `chevron` (▾ rotates 180°, default) or `plus` (a `+` that rotates 45° → `×` on open). */
  indicator?: "chevron" | "plus";
  /** Per-item style (applied to each item's card). Generic; e.g. for an incremental-delay (stagger)
   *  reveal built by the section — Accordion itself knows nothing about the "reveal". */
  itemStyle?: (index: number) => React.CSSProperties;
}

export const accordionSpecs = {
  trigger: {
    shared: "w-full px-4 py-3 text-body font-normal text-content-primary",
    hover: "hover:bg-surface-subtle transition-colors",
  },
  container: {
    shared:
      "rounded-md border border-border-strong overflow-hidden bg-surface-primary",
    divider: "divide-y divide-border-default",
  },
  icon: "ChevronDown 16px text-content-primary/50, rotate-180 on open (duration-200)",
  content: "px-4 pt-3 pb-4",
  animation: {
    style: "CSS grid-template-rows 0fr/1fr transition (Radix UI pattern)",
    duration: "200ms ease-out",
    technique: "Content always mounted, height controlled by grid row sizing",
  },
};

// Trigger variant axis extracted to tv (was inline concat with `triggerStyles[variant]`). The trigger
// color/typography doesn't collide with the base layout → twMerge:false keeps the class set faithful (DS convention).
// `uppercase`: IDENTICAL to default (same typography, weight and size) — the ONLY difference is UPPERCASE.
const TRIGGER_BASE =
  "flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-surface-subtle";
export const accordionTrigger = tv(
  {
    base: TRIGGER_BASE,
    variants: {
      variant: {
        default: "text-body font-normal text-content-primary",
        uppercase: "text-body font-normal uppercase text-content-primary",
      },
    },
    defaultVariants: { variant: "default" },
  },
  { twMerge: false },
);

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
  // ECO-198: stable base for the disclosure ARIA wiring (trigger ↔ panel), unique per instance.
  const baseId = useId();

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const container =
    surface === "separated"
      ? "flex flex-col gap-3"
      : `rounded-md ${borderless ? "" : "border border-border-strong"} overflow-hidden bg-surface-primary divide-y divide-border-default`;
  const itemClass =
    surface === "separated"
      ? "overflow-hidden rounded-md border border-border-strong bg-surface-primary"
      : "";

  return (
    <div className={`${container} ${className}`}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className={itemClass} style={itemStyle?.(i)}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className={accordionTrigger({ variant })}
              id={`${baseId}-trigger-${i}`}
              aria-expanded={isOpen}
              aria-controls={`${baseId}-panel-${i}`}
            >
              {item.title}
              {indicator === "plus" ? (
                <Icon
                  icon={Plus}
                  size="md"
                  className={`shrink-0 text-content-primary/50 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                />
              ) : (
                <Icon
                  icon={ChevronDown}
                  size="md"
                  className={`shrink-0 text-content-primary/50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              )}
            </button>
            <div
              id={`${baseId}-panel-${i}`}
              role="region"
              aria-labelledby={`${baseId}-trigger-${i}`}
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                {/* ECO-141: the answer is copyable CONTENT → select-text (a bare string in this <div> would
                    inherit user-select:none from the body). The trigger (button) stays non-selectable. */}
                <div className="select-text px-4 pt-3 pb-4">
                  {item.children}
                </div>
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
  // ECO-198: stable base for the disclosure ARIA wiring (trigger ↔ panel), unique per instance.
  const id = useId();

  return (
    <div
      className={`rounded-md border border-border-strong overflow-hidden bg-surface-primary ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-body font-normal text-content-primary transition-colors hover:bg-surface-subtle"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
      >
        {title}
        <Icon
          icon={ChevronDown}
          size="md"
          className={`shrink-0 text-content-primary/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          {/* ECO-141: answer = copyable CONTENT → select-text. */}
          <div className="select-text px-4 pt-3 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
