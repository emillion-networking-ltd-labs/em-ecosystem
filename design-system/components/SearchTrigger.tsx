"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import { Search } from "lucide-react";
import Badge from "./Badge";
import Icon from "./Icon";

export const searchTriggerSpecs = {
  container: {
    style:
      "Button outline-solid sm tokens — rounded-md border-border-components h-8 px-4 py-1.5",
    text: "text-caption text-content-primary",
    hover: "hover:bg-surface-subtle",
  },
  icon: "Search 16px (inline standard)",
  label: "'Search...'",
  shortcut: {
    component: "Badge variant=kbd size=sm",
    mac: "⌘K",
    windows: "Ctrl+K",
  },
  mobile: "IconButton boxed sm with Search 16px (lg:hidden)",
};

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

interface SearchTriggerProps {
  onClick: () => void;
  className?: string;
}

export default function SearchTrigger({
  onClick,
  className = "",
}: SearchTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md border border-border-components bg-transparent px-4 py-1.5 text-caption text-content-primary transition-colors hover:bg-surface-subtle h-8 ${className}`}
    >
      <Icon icon={Search} size="md" className="shrink-0" />
      <span>Search...</span>
      <Badge variant="kbd" size="sm">
        {isMac ? "⌘K" : "Ctrl+K"}
      </Badge>
    </button>
  );
}
