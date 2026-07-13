"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import { useRef, useCallback } from "react";
import { tv } from "tailwind-variants";
import { ChevronRight } from "lucide-react";
import Icon from "./Icon";

interface Tab {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface TabRenderProps {
  tab: Tab;
  isActive: boolean;
  className: string;
  onClick: () => void;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
  variant?: "subtle" | "nav" | "nav-horizontal";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  wrap?: boolean;
  className?: string;
  renderTab?: (props: TabRenderProps) => React.ReactNode;
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-caption h-8",
  md: "px-4 py-2.5 text-body h-10",
  lg: "px-6 py-3 text-h3 h-12",
};

// Single-source de clases por variante (container + active/inactive del item). Se EXPORTA porque SidebarNav
// compone el look nav directamente (variantStyles.nav.inactive) sobre su fila de padre.
export const variantStyles = {
  subtle: {
    container:
      "bg-surface-primary border border-border-default rounded-sm shadow-card",
    active:
      "bg-surface-secondary border border-border-strong font-semibold text-content-primary",
    inactive: "font-semibold text-content-primary hover:bg-surface-subtle",
  },
  nav: {
    container: "flex-col gap-2",
    active:
      "bg-surface-subtle rounded-md text-body font-normal text-content-primary",
    inactive:
      "text-body font-normal text-content-primary/75 hover:bg-surface-subtle hover:text-content-primary rounded-md",
  },
  "nav-horizontal": {
    container: "gap-2",
    active:
      "bg-surface-subtle rounded-md text-body font-normal text-content-primary",
    inactive:
      "text-body font-normal text-content-primary/75 hover:bg-surface-subtle hover:text-content-primary rounded-md",
  },
};

// Contrato tv (raw-concat previo → twMerge:false). DOS superficies: el tablist (contenedor) y cada item.
// El branching subtle/nav (isNav), el estado active/inactive y size (subtle only) se modelan con
// compoundVariants — reproduce EXACTAMENTE el conjunto de clases que producía la composición imperativa.
// (El `border-r` entre items es POSICIONAL — no es una variante; se pasa por className en el render.)
export const tabsContainer = tv(
  {
    base: "flex",
    variants: {
      variant: {
        subtle: `items-center ${variantStyles.subtle.container}`,
        nav: variantStyles.nav.container,
        "nav-horizontal": variantStyles["nav-horizontal"].container,
      },
      fullWidth: { true: "", false: "" },
      wrap: { true: "", false: "" },
    },
    compoundVariants: [
      // subtle desborda o envuelve; nav no toca overflow/wrap.
      { variant: "subtle", wrap: true, class: "flex-wrap" },
      {
        variant: "subtle",
        wrap: false,
        class: "overflow-x-auto scrollbar-hide touch-pan-x",
      },
      { variant: "subtle", fullWidth: true, class: "w-full" },
      { variant: "subtle", fullWidth: false, class: "inline-flex" },
    ],
    defaultVariants: { variant: "nav", fullWidth: false, wrap: false },
  },
  { twMerge: false },
);

export const tabsItem = tv(
  {
    base: "whitespace-nowrap shrink-0",
    variants: {
      variant: {
        subtle: "text-center",
        nav: "flex items-center gap-1 px-2 py-2 text-body h-9 text-left w-full",
        "nav-horizontal":
          "flex items-center gap-1 px-2 py-2 text-body h-9 text-left",
      },
      // size y active/inactive dependen de la variante → se resuelven en compoundVariants.
      size: { sm: "", md: "", lg: "" },
      active: { true: "", false: "" },
      fullWidth: { true: "", false: "" },
    },
    compoundVariants: [
      // El tamaño solo aplica a `subtle` (nav usa h-9 fijo).
      { variant: "subtle", size: "sm", class: sizeClasses.sm },
      { variant: "subtle", size: "md", class: sizeClasses.md },
      { variant: "subtle", size: "lg", class: sizeClasses.lg },
      { variant: "subtle", fullWidth: true, class: "flex-1" },
      // Estado active/inactive por variante.
      { variant: "subtle", active: true, class: variantStyles.subtle.active },
      {
        variant: "subtle",
        active: false,
        class: variantStyles.subtle.inactive,
      },
      { variant: "nav", active: true, class: variantStyles.nav.active },
      { variant: "nav", active: false, class: variantStyles.nav.inactive },
      {
        variant: "nav-horizontal",
        active: true,
        class: variantStyles["nav-horizontal"].active,
      },
      {
        variant: "nav-horizontal",
        active: false,
        class: variantStyles["nav-horizontal"].inactive,
      },
    ],
    defaultVariants: {
      variant: "nav",
      size: "md",
      active: false,
      fullWidth: false,
    },
  },
  { twMerge: false },
);

export const tabsSpecs = {
  variants: {
    subtle:
      "Active: bg-surface-secondary border font-semibold | Inactive: font-semibold text-content-primary (Figma)",
    nav: "Active: bg-surface-subtle rounded-md text-body text-content-primary | Inactive: text-body text-content-primary/75 hover:bg-surface-subtle hover:text-content-primary rounded-md",
    "nav-horizontal": "Same as nav but horizontal layout (top nav bar)",
  },
  container: {
    subtle: "border border-border-default rounded-sm",
    nav: "flex-col gap-2 (vertical, 8px — matches NavBar icon spacing)",
    "nav-horizontal": "gap-2 (horizontal, 8px — matches NavBar icon spacing)",
  },
  nav: {
    height: "h-9 (36px) — fixed for all nav items",
    icon: "16px lucide — optional per tab",
    chevron: "ChevronRight 16px text-content-primary/75 — inactive only",
    padding: "px-2 py-2, gap-2 between items, gap-1 between inner elements",
  },
  sizes: {
    sm: "h-8 px-3 py-1.5 text-caption (32px) — subtle only",
    "md (default)": "h-10 px-4 py-2.5 text-body (40px) — subtle only",
    lg: "h-12 px-6 py-3 text-h3 (48px) — subtle only",
  },
  overflow: {
    scroll:
      "overflow-x-auto scrollbar-hide touch-pan-x, drag-to-scroll (mouse + touch)",
    indicators:
      "h-[9px] w-[9px] rounded-full button — active: bg-surface-inverse, inactive: bg-border-strong, click: setActiveTab + scrollIntoView smooth center",
    visibility:
      "sm:hidden — dots only visible on mobile when tabs overflow horizontally",
  },
};

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "nav",
  size = "md",
  fullWidth = false,
  wrap = false,
  className = "",
  renderTab,
}: TabsProps) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex = index;

      if (e.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (e.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === "Home") {
        nextIndex = 0;
      } else if (e.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      tabsRef.current[nextIndex]?.focus();
      onChange(tabs[nextIndex].value);
    },
    [tabs, onChange],
  );

  const isNav = variant === "nav" || variant === "nav-horizontal";

  return (
    <div
      role="tablist"
      className={tabsContainer({ variant, fullWidth, wrap, className })}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.value === activeTab;
        const itemClassName = tabsItem({
          variant,
          size,
          active: isActive,
          fullWidth,
          // El borde entre items es posicional (no la última), solo en subtle.
          className:
            !isNav && index < tabs.length - 1
              ? "border-r border-border-default"
              : undefined,
        });

        if (renderTab) {
          return (
            <div key={tab.value}>
              {renderTab({
                tab,
                isActive,
                className: itemClassName,
                onClick: () => onChange(tab.value),
              })}
            </div>
          );
        }

        return (
          <button
            key={tab.value}
            ref={(el) => {
              tabsRef.current[index] = el;
            }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={itemClassName}
          >
            {isNav && !isActive && (
              <Icon
                icon={ChevronRight}
                size="md"
                className="shrink-0 text-content-primary/75"
              />
            )}
            {isNav && tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
