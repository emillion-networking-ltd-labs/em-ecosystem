"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import Avatar from "./Avatar";
import Input from "./Input";
import Icon from "./Icon";

interface Language {
  code: string;
  name: string;
}

const LANGUAGES: Language[] = [
  { code: "EN", name: "English (United Kingdom)" },
  { code: "ES", name: "Español (España)" },
  { code: "FR", name: "Français (France)" },
];

const STORAGE_KEY = "nexacore-language";

export const languageSelectorSpecs = {
  trigger: {
    base: "flex h-10 items-center gap-2 rounded-md px-4 text-body font-normal transition-colors",
    closed:
      "border border-transparent bg-transparent text-content-secondary hover:text-content-primary",
    open: "border border-line-control bg-surface-primary text-content-primary",
  },
  popover: {
    position: "absolute w-fit min-w-[var(--dropdown-min)]",
    container:
      "rounded-xl border border-line-strong bg-surface-elevated p-2 shadow-card max-h-[var(--popover-max-h)] overflow-y-auto",
    search:
      "Input variant=filled + shadow-card — el borde lo pone el primitivo Input (border-components)",
  },
  option: {
    selected: "bg-surface-tertiary text-content-primary",
    default:
      "bg-transparent text-body font-normal text-content-primary transition-colors hover:bg-surface-subtle",
    avatar: "Avatar size=sm (h-8 w-8 rounded-full bg-surface-tertiary)",
  },
  icon: "ChevronDown 16px, rotate-180 on open",
};

export default function LanguageSelector({
  triggerClassName = "",
  triggerStyle,
}: { triggerClassName?: string; triggerStyle?: React.CSSProperties } = {}) {
  const [isOpen, setIsOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Language>(LANGUAGES[0]);
  const [popoverPos, setPopoverPos] = useState({
    vertical: "up" as "up" | "down",
    horizontal: "left" as "left" | "right",
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const openPopover = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const popoverH = 350;
    const popoverW = 330;
    setPopoverPos({
      vertical: rect.top > popoverH ? "up" : "down",
      horizontal: rect.left + popoverW > window.innerWidth ? "right" : "left",
    });
    setIsOpen(true);
  };

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = LANGUAGES.find((l) => l.code === stored);
      if (found) setSelected(found);
    }
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) searchInputRef.current?.focus();
  }, [isOpen]);

  const filtered = useMemo(
    () =>
      LANGUAGES.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.code.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const handleSelect = (lang: Language) => {
    setSelected(lang);
    localStorage.setItem(STORAGE_KEY, lang.code);
    setIsOpen(false);
    setSearch("");
  };

  /* Trigger styles:
     Both states share the same box model (h-10, px-4, rounded-md) to prevent layout shift.
     Closed → invisible pill (transparent border/bg), Nav Link color (75% → 100%)
     Open   → visible pill (border black/5, bg-white), full opacity text, no shadow */
  const triggerBase =
    "flex h-10 items-center gap-2 px-4 text-body font-normal transition-colors";
  const triggerClass = isOpen
    ? `${triggerBase} border border-line-control bg-surface-subtle text-content-primary`
    : `${triggerBase} border border-transparent bg-transparent text-content-secondary hover:text-content-primary`;

  return (
    <div ref={containerRef} className="relative w-fit">
      {/* Trigger — arrow RIGHT, gap 8px */}
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openPopover())}
        className={`${triggerClass} rounded-md ${triggerClassName}`}
        style={triggerStyle}
      >
        <span className="whitespace-nowrap">{selected.name}</span>
        <Icon
          icon={ChevronDown}
          size="md"
          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Popover — opens upward (footer context), search adjacent to trigger */}
      {isOpen && (
        <div
          className={`absolute z-50 w-fit min-w-[var(--dropdown-min)] ${popoverPos.vertical === "down" ? "top-full mt-1" : "bottom-full mb-1"} ${popoverPos.horizontal === "right" ? "right-0" : "left-0"}`}
        >
          <div
            className={`flex flex-col gap-1 animate-stagger ${popoverPos.vertical === "down" ? "" : "flex-col-reverse"}`}
          >
            {/* Search Bar — uses Input component */}
            <div className="relative z-10">
              <Input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search language..."
                leftIcon={<Icon icon={Search} size="md" />}
                rightIcon={
                  search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="text-content-tertiary hover:text-content-primary"
                    >
                      <Icon icon={X} size="xs" />
                    </button>
                  ) : undefined
                }
                variant="filled"
                className="shadow-card"
              />
            </div>

            {/* Results — appears second (stagger child 2) */}
            <div className="max-h-[var(--popover-max-h)] overflow-y-auto rounded-xl border border-line-strong bg-surface-elevated p-2 shadow-card">
              {filtered.length === 0 ? (
                <p className="py-2 text-center text-body text-content-secondary">
                  No results
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {filtered.map((lang) => {
                    const isSelected = selected.code === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelect(lang)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-body font-normal transition-colors ${
                          isSelected
                            ? "bg-surface-subtle text-content-primary"
                            : "bg-transparent text-content-primary hover:bg-surface-subtle"
                        }`}
                      >
                        <Avatar size="sm" name={lang.code} />
                        <span className="truncate text-body">{lang.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
