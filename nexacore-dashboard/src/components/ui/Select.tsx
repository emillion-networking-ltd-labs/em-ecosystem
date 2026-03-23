"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  variant?: "default" | "danger";
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const selectSpecs = {
  trigger: {
    shared:
      "inline-flex items-center justify-between gap-2 w-fit px-4 py-2.5 text-body-sm rounded-md bg-transparent",
    hover: "hover:bg-surface-subtle",
    open: "bg-surface-subtle",
    disabled: "opacity-50 cursor-not-allowed",
  },
  dropdown: {
    container:
      "rounded-xl border border-border-strong bg-surface-primary p-6 max-h-64 overflow-auto",
  },
  option: {
    selected: "bg-surface-inverse text-content-inverse rounded-md",
    default: "text-content-primary rounded-md hover:bg-surface-subtle",
    danger: "text-error hover:bg-error-bg rounded-md",
    focused: "bg-surface-subtle text-content-primary",
  },
  icon: "ChevronDown 16px text-content-primary/50, rotate-180 on open",
  position: {
    auto: "Detects viewport edges — flips vertical (up/down) and horizontal (left/right)",
    animation: "animate-dropdown-down / animate-dropdown-up (150ms ease-out)",
  },
};

export default function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [popoverPos, setPopoverPos] = useState({
    vertical: "down" as "up" | "down",
    horizontal: "left" as "left" | "right",
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption = options.find((o) => o.value === value);

  const openDropdown = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownH = 300;
    const dropdownW = rect.width + 100;
    setPopoverPos({
      vertical:
        window.innerHeight - rect.bottom < dropdownH && rect.top > dropdownH
          ? "up"
          : "down",
      horizontal: rect.right + dropdownW > window.innerWidth ? "right" : "left",
    });
    setOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!open) {
        if (
          e.key === "Enter" ||
          e.key === " " ||
          e.key === "ArrowDown" ||
          e.key === "ArrowUp"
        ) {
          e.preventDefault();
          setOpen(true);
          setFocusedIndex(
            value ? options.findIndex((o) => o.value === value) : 0,
          );
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedIndex >= 0) {
            onChange(options[focusedIndex].value);
            setOpen(false);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIndex(options.length - 1);
          break;
      }
    },
    [open, disabled, options, focusedIndex, value, onChange],
  );

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        onKeyDown={handleKeyDown}
        className={`inline-flex items-center justify-between gap-2 w-fit px-4 py-2.5 text-body-sm rounded-md transition-colors ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-surface-subtle cursor-pointer"
        } ${open ? "bg-surface-subtle" : "bg-transparent"}`}
      >
        <span
          className={
            selectedOption ? "text-content-primary" : "text-content-placeholder"
          }
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-content-primary/50 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-activedescendant={
            focusedIndex >= 0 ? `${listboxId}-opt-${focusedIndex}` : undefined
          }
          className={`absolute z-50 w-fit min-w-[160px] bg-surface-primary border border-border-strong rounded-xl p-6 flex flex-col gap-0.5 max-h-64 overflow-auto ${popoverPos.vertical === "up" ? "bottom-full mb-1 animate-dropdown-up" : "top-full mt-1 animate-dropdown-down"} ${popoverPos.horizontal === "right" ? "right-0" : "left-0"}`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;
            const isDanger = option.variant === "danger";

            return (
              <li
                key={option.value}
                id={`${listboxId}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`flex items-center gap-2 px-2 py-2 rounded-md text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-surface-inverse text-content-inverse"
                    : isDanger
                      ? "text-error hover:bg-error-bg"
                      : isFocused
                        ? "bg-surface-subtle text-content-primary"
                        : "text-content-primary hover:bg-surface-subtle"
                }`}
              >
                {option.icon && (
                  <span className="shrink-0 w-4 h-4">{option.icon}</span>
                )}
                <span>{option.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
