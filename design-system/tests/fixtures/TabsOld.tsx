"use client";

// Fixture de fidelidad ECO-171: copia FIEL del Tabs previo (raw concat + variantStyles imperativo), de `main`.
// Referencia para verificar que la versión tv (contenedor + item) produce el MISMO conjunto de clases.
// Se retira al cerrar la pieza.

import { useRef, useCallback } from "react";
import { ChevronRight } from "lucide-react";

interface Tab {
  label: string;
  value: string;
  icon?: React.ReactNode;
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
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-caption h-8",
  md: "px-4 py-2.5 text-body h-10",
  lg: "px-6 py-3 text-h3 h-12",
};

const variantStyles = {
  subtle: {
    container:
      "bg-surface-elevated border border-border-default rounded-sm shadow-card",
    active:
      "bg-surface-secondary border border-border-strong font-semibold text-content-primary",
    inactive: "font-semibold text-content-primary hover:bg-surface-subtle",
  },
  nav: {
    container: "flex-col gap-2",
    active:
      "bg-surface-subtle rounded-md text-body font-normal text-content-primary",
    inactive:
      "text-body font-normal text-content-secondary hover:bg-surface-subtle hover:text-content-primary rounded-md",
  },
  "nav-horizontal": {
    container: "gap-2",
    active:
      "bg-surface-subtle rounded-md text-body font-normal text-content-primary",
    inactive:
      "text-body font-normal text-content-secondary hover:bg-surface-subtle hover:text-content-primary rounded-md",
  },
};

export default function TabsOld({
  tabs,
  activeTab,
  onChange,
  variant = "nav",
  size = "md",
  fullWidth = false,
  wrap = false,
  className = "",
}: TabsProps) {
  const styles = variantStyles[variant];
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex = index;
      if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      else if (e.key === "ArrowLeft")
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") nextIndex = 0;
      else if (e.key === "End") nextIndex = tabs.length - 1;
      else return;
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
      className={`flex ${isNav ? "" : "items-center"} ${styles.container} ${
        !isNav &&
        (wrap ? "flex-wrap" : "overflow-x-auto scrollbar-hide touch-pan-x")
      } ${!isNav && fullWidth ? "w-full" : !isNav ? "inline-flex" : ""} ${className}`}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.value === activeTab;
        const itemClassName = `whitespace-nowrap shrink-0 ${
          isNav
            ? `flex items-center gap-1 px-2 py-2 text-body h-9 text-left ${variant === "nav" ? "w-full" : ""} ${isActive ? styles.active : styles.inactive}`
            : `text-center ${sizeClasses[size]} ${fullWidth ? "flex-1" : ""} ${index < tabs.length - 1 ? "border-r border-border-default" : ""} ${isActive ? styles.active : styles.inactive}`
        }`;

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
              <ChevronRight
                size={16}
                className="shrink-0 text-content-secondary"
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
