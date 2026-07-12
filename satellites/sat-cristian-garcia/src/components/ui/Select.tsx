// @em-ui-adapted: fullWidth (modo form-input para ContactForm) + ariaLabel a11y — diverge de la fuente em-ui a propósito (ECO-136). Al re-pull, re-aplicar esta adaptación.
"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { tv } from "tailwind-variants";
import { ChevronDown } from "lucide-react";
import Icon from "./Icon";

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
  size?: "sm" | "md";
  /**
   * When true, container + trigger fill the parent width and dropdown anchors
   * to the trigger width. Use for form contexts (input-like behavior). Default
   * (false) keeps the original inline-block menu/filter behavior.
   */
  fullWidth?: boolean;
  // axe button-name on role="combobox" treats inner text as the value, not
  // the name — an explicit accessible name is required.
  ariaLabel?: string;
}

export const selectSpecs = {
  trigger: {
    base: "flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-6 py-2.5 text-body font-normal transition-colors",
    closed:
      "text-content-primary/75 hover:text-content-primary hover:bg-surface-subtle",
    open: "bg-surface-subtle text-content-primary",
    disabled: "opacity-50 cursor-not-allowed",
  },
  dropdown: {
    // ECO-117: estándar de menú/desplegable — contenedor rounded-xl + p-2; opción px-3 py-2 rounded-lg.
    container:
      "rounded-xl border border-border-strong bg-surface-primary p-2 shadow-card max-h-64 overflow-auto",
  },
  option: {
    base: "flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg text-body font-normal transition-colors",
    selected: "bg-surface-inverse text-content-inverse",
    default: "text-content-primary hover:bg-surface-subtle",
    danger: "text-error hover:bg-error-bg",
    focused: "bg-surface-subtle text-content-primary",
  },
  icon: "ChevronDown 16px text-content-primary/50, rotate-180 on open",
  position: {
    auto: "Detects viewport edges — flips vertical (up/down) and horizontal (left/right)",
    animation: "animate-dropdown-down / animate-dropdown-up (150ms ease-out)",
  },
};

const triggerSizeClasses = {
  sm: "h-10",
  md: "h-12",
};

// Eje visual de la OPCIÓN extraído a tv (antes cadena de ternarios inline). El estado es EXCLUYENTE con la
// misma prioridad del original: selected → danger → focused → default. `danger` es el color de la opción
// `variant="danger"` cuando no está seleccionada ni enfocada. Raw-concat previo → twMerge:false (conjunto fiel).
const OPTION_BASE =
  "flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg text-body font-normal cursor-pointer transition-colors";
export const selectOption = tv(
  {
    base: OPTION_BASE,
    variants: {
      state: {
        selected: "bg-surface-inverse text-content-inverse",
        danger: "text-error hover:bg-error-bg",
        focused: "bg-surface-subtle text-content-primary",
        default: "text-content-primary hover:bg-surface-subtle",
      },
    },
    defaultVariants: { state: "default" },
  },
  { twMerge: false },
);

export default function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
  size = "sm",
  fullWidth = false,
  ariaLabel,
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

  // fullWidth: container/trigger/dropdown adoptan ancho del padre (form input).
  // Default (false): inline-block, contenido auto-width (filter/menu behavior).
  const containerClass = fullWidth
    ? "relative block w-full"
    : "relative inline-block";
  const triggerLayoutClass = fullWidth
    ? "w-full justify-between rounded-lg border border-border-components px-4"
    : "justify-center rounded-md px-6";
  const dropdownAnchorClass = fullWidth
    ? "left-0 right-0"
    : popoverPos.horizontal === "right"
      ? "right-0"
      : "left-0";

  return (
    <div ref={containerRef} className={`${containerClass} ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        onKeyDown={handleKeyDown}
        className={`flex ${triggerSizeClasses[size]} items-center gap-2 whitespace-nowrap py-2.5 text-body font-normal transition-colors ${triggerLayoutClass} ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:text-content-primary hover:bg-surface-subtle cursor-pointer"
        } ${open ? "bg-surface-subtle text-content-primary" : "bg-transparent text-content-primary/75"}`}
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <Icon
          icon={ChevronDown}
          size="md"
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
          className={`absolute z-50 ${fullWidth ? "" : "w-fit min-w-[160px]"} bg-surface-primary border border-border-strong rounded-xl p-2 shadow-card flex flex-col gap-0.5 max-h-64 overflow-auto ${popoverPos.vertical === "up" ? "bottom-full mb-1 animate-dropdown-up" : "top-full mt-1 animate-dropdown-down"} ${dropdownAnchorClass}`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;
            const isDanger = option.variant === "danger";
            const optionState = isSelected
              ? "selected"
              : isDanger
                ? "danger"
                : isFocused
                  ? "focused"
                  : "default";

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
                className={selectOption({ state: optionState })}
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
