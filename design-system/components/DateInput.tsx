"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarDays } from "lucide-react";
import Calendar from "./Calendar";
import Icon from "./Icon";

interface DateInputProps {
  label?: string;
  error?: string;
  value?: string; // YYYY-MM-DD string
  onChange?: (value: string) => void;
  size?: "sm" | "md";
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

const sizeClasses = {
  sm: "h-10 px-3 text-body",
  md: "h-12 px-4 text-body",
};

export const dateInputSpecs = {
  container:
    "rounded-lg border border-border-components bg-transparent outline-solid outline-2 outline-offset-2 transition-colors",
  sizes: {
    sm: "h-10 px-3 text-body (40px)",
    "md (default)": "h-12 px-4 text-body (48px)",
  },
  states: {
    default: "outline-transparent",
    hover: "hover:outline-content-primary/75",
    focus: "outline-content-primary/75",
    error: "outline-error/75",
    disabled: "cursor-not-allowed opacity-60",
  },
  dropdown: "Calendar component — shadow-card, rounded-xl",
};

function formatDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

function toDateObj(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DateInput({
  label,
  error,
  value = "",
  onChange,
  size = "md",
  disabled = false,
  placeholder = "DD/MM/YYYY",
  className = "",
  minDate,
  maxDate,
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasError = !!error;

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSelect = (date: Date) => {
    onChange?.(toDateStr(date));
    setOpen(false);
  };

  return (
    <div
      className={`relative flex flex-col gap-1 ${className}`}
      ref={containerRef}
    >
      {label && (
        <label
          className={`text-body font-semibold ${hasError ? "text-error" : "text-content-primary"}`}
        >
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`flex items-center gap-2 ${sizeClasses[size]} rounded-lg border border-border-components bg-transparent text-left outline outline-2 outline-offset-2 transition-colors ${
          hasError
            ? "outline-error/75"
            : open
              ? "outline-transparent"
              : "outline-transparent hover:outline-content-primary/75"
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <span
          className={`min-w-0 flex-1 text-body ${
            value ? "text-content-primary" : "text-content-placeholder"
          }`}
        >
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Icon
          icon={CalendarDays}
          size="md"
          className="shrink-0 text-content-primary/50"
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1">
          <Calendar
            value={toDateObj(value)}
            onChange={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      )}

      {error && (
        <p className="absolute left-0 top-full mt-1 text-caption text-error">
          {error}
        </p>
      )}
    </div>
  );
}
