"use client";

import { useRef, useCallback } from "react";

interface Tab {
  label: string;
  value: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  fullWidth = false,
  className = "",
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

  return (
    <div
      role="tablist"
      className={`inline-flex items-center bg-surface-primary border border-border-default shadow-card rounded-[5px] ${
        fullWidth ? "w-full" : ""
      } ${className}`}
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
            className={`px-4 py-2 text-body-sm text-center transition-colors h-[37px] ${
              fullWidth ? "flex-1" : "min-w-[100px]"
            } ${
              isActive
                ? "bg-surface-secondary border border-border-default font-bold text-content-primary"
                : "font-medium text-content-secondary hover:bg-hover"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
