"use client";

import { useRef, useCallback } from "react";
import { ChevronRight } from "lucide-react";

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

export const variantStyles = {
  subtle: {
    container:
      "bg-surface-primary border border-border-components rounded-[5px] shadow-[6px_6px_50px_rgba(0,0,0,0.05)]",
    active:
      "bg-surface-secondary border border-border-components font-semibold text-content-primary",
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

export const tabsSpecs = {
  variants: {
    subtle:
      "Active: bg-surface-secondary border font-semibold | Inactive: font-semibold text-content-primary (Figma)",
    nav: "Active: bg-surface-subtle rounded-md text-body text-content-primary | Inactive: text-body text-content-primary/75 hover:bg-surface-subtle hover:text-content-primary rounded-md",
    "nav-horizontal": "Same as nav but horizontal layout (top nav bar)",
  },
  container: {
    subtle: "border border-border-components rounded-[5px]",
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
      "h-[9px] w-[9px] rounded-full — active: bg-surface-inverse, inactive: bg-border-strong, clickable (scrolls to tab)",
    detection:
      "ResizeObserver — dots appear only when content overflows container",
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
        const itemClassName = `whitespace-nowrap shrink-0 ${
          isNav
            ? `flex items-center gap-1 px-2 py-2 text-body h-9 text-left ${variant === "nav" ? "w-full" : ""} ${isActive ? styles.active : styles.inactive}`
            : `text-center ${sizeClasses[size]} ${fullWidth ? "flex-1" : ""} ${index < tabs.length - 1 ? "border-r border-border-components" : ""} ${isActive ? styles.active : styles.inactive}`
        }`;

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
