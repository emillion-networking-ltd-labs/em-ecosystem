"use client";

// AccordionOld — the PRE-tv Accordion (git 5186968^, before ECO-188 migrated it to tailwind-variants).
// Snapshot fixture for the fidelity guard: renders exactly as the old map/concat version did, so accordion-fidelity
// can prove the tv migration preserved every class (old = new). Not shipped, not registered.
import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import Icon from "@/components/ui/Icon";

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
  surface?: "grouped" | "separated";
  indicator?: "chevron" | "plus";
  itemStyle?: (index: number) => React.CSSProperties;
}

// The old per-variant trigger classes, concatenated inline (the pre-tv "language").
const triggerStyles = {
  default: "text-body font-normal text-content-primary",
  uppercase: "text-body font-normal uppercase text-content-primary",
};

export default function AccordionOld({
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
      : `rounded-md ${borderless ? "" : "border border-line-strong"} overflow-hidden bg-surface-primary divide-y divide-border-default`;
  const itemClass =
    surface === "separated"
      ? "overflow-hidden rounded-md border border-line-strong bg-surface-primary"
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
                <Icon
                  icon={Plus}
                  size="md"
                  className={`shrink-0 text-content-tertiary transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                />
              ) : (
                <Icon
                  icon={ChevronDown}
                  size="md"
                  className={`shrink-0 text-content-tertiary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              )}
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
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

export function SingleAccordionOld({
  title,
  children,
  className = "",
  defaultOpen = false,
}: SingleAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-md border border-line-strong overflow-hidden bg-surface-primary ${className}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-body font-normal text-content-primary transition-colors hover:bg-surface-subtle"
      >
        {title}
        <Icon
          icon={ChevronDown}
          size="md"
          className={`shrink-0 text-content-tertiary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="select-text px-4 pt-3 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
