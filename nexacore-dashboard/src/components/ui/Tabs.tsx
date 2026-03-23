"use client";

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
  variant?: "solid" | "subtle" | "nav" | "nav-horizontal";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  wrap?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-caption h-8",
  md: "px-4 py-2.5 text-body h-10",
  lg: "px-6 py-3 text-subtitle h-12",
};

const variantStyles = {
  solid: {
    container: "border border-border-strong rounded-[5px]",
    active:
      "bg-surface-inverse text-content-inverse font-normal transition-opacity hover:opacity-90",
    inactive:
      "bg-transparent text-content-primary font-normal transition-colors hover:bg-surface-subtle",
  },
  subtle: {
    container:
      "bg-surface-primary border border-border-strong rounded-[5px] shadow-[6px_6px_50px_rgba(0,0,0,0.05)]",
    active:
      "bg-surface-secondary border border-border-strong font-semibold text-content-primary",
    inactive: "font-semibold text-content-primary hover:bg-surface-subtle",
  },
  nav: {
    container: "flex-col gap-1",
    active:
      "bg-surface-subtle rounded-md text-body font-normal text-content-primary",
    inactive:
      "text-body font-normal text-content-primary/75 hover:bg-surface-subtle hover:text-content-primary rounded-md",
  },
  "nav-horizontal": {
    container: "gap-1",
    active:
      "bg-surface-subtle rounded-md text-body font-normal text-content-primary",
    inactive:
      "text-body font-normal text-content-primary/75 hover:bg-surface-subtle hover:text-content-primary rounded-md",
  },
};

export const tabsSpecs = {
  variants: {
    "solid (default)":
      "Active: Button primary colors (hover:opacity-90) | Inactive: Button outline colors (hover:bg-surface-subtle) | Separator: border-r border-border-strong",
    subtle:
      "Active: bg-surface-secondary border font-semibold | Inactive: font-semibold text-content-primary (Figma)",
    nav: "Active: bg-surface-subtle rounded-md text-body text-content-primary | Inactive: text-body text-content-primary/75 hover:bg-surface-subtle hover:text-content-primary rounded-md",
    "nav-horizontal": "Same as nav but horizontal layout (top nav bar)",
  },
  container: {
    "solid/subtle": "border border-border-strong rounded-[5px]",
    nav: "flex-col gap-1 (vertical)",
    "nav-horizontal": "gap-1 (horizontal)",
  },
  nav: {
    height: "h-9 (36px) — fixed for all nav items",
    icon: "16px lucide — optional per tab",
    chevron: "ChevronRight 16px text-content-primary/75 — inactive only",
    padding: "px-2 py-2, gap-1 between elements",
  },
  sizes: {
    sm: "h-8 px-3 py-1.5 text-caption (32px) — solid/subtle only",
    "md (default)": "h-10 px-4 py-2.5 text-body (40px) — solid/subtle only",
    lg: "h-12 px-6 py-3 text-subtitle (48px) — solid/subtle only",
  },
  mobile: {
    scroll: "overflow-x-auto scrollbar-hide touch-pan-x",
    indicators:
      "h-1.5 w-1.5 rounded-full dots — active: bg-surface-inverse, inactive: bg-border-strong",
  },
};

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "solid",
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
      className={`flex ${isNav ? "" : "items-center"} ${styles.container} ${
        !isNav &&
        (wrap ? "flex-wrap" : "overflow-x-auto scrollbar-hide touch-pan-x")
      } ${!isNav && fullWidth ? "w-full" : !isNav ? "inline-flex" : ""} ${className}`}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.value === activeTab;
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
            className={`whitespace-nowrap shrink-0 ${
              isNav
                ? `flex items-center gap-1 px-2 py-2 text-body h-9 text-left ${variant === "nav" ? "w-full" : ""} ${isActive ? styles.active : styles.inactive}`
                : `text-center ${sizeClasses[size]} ${fullWidth ? "flex-1" : ""} ${index < tabs.length - 1 ? "border-r border-border-strong" : ""} ${isActive ? styles.active : styles.inactive}`
            }`}
          >
            {isNav && !isActive && (
              <ChevronRight
                size={16}
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
