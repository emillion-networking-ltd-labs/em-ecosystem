"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Avatar from "./Avatar";
import Button from "./Button";
import Tooltip from "./Tooltip";
import { useIsTruncated } from "@/hooks/useIsTruncated";

export const emailSelectorSpecs = {
  trigger:
    "flex h-10 items-center justify-center gap-2 rounded-md px-6 py-2.5 text-body font-normal whitespace-nowrap border border-border-components transition-colors",
  // ECO-117: estándar de menú/desplegable — contenedor rounded-xl + p-2; opción px-3 py-2 rounded-lg.
  dropdown:
    "rounded-xl border border-border-strong bg-surface-primary p-2 shadow-card",
  option:
    "flex w-full items-center gap-2 rounded-lg bg-surface-subtle px-3 py-2 text-body font-normal text-content-primary",
};

interface EmailSelectorProps {
  email: string;
  onChangeEmail: () => void;
  className?: string;
}

export default function EmailSelector({
  email,
  onChangeEmail,
  className = "",
}: EmailSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [emailRef, truncated] = useIsTruncated<HTMLSpanElement>();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const emailInitial = (email[0] || "?").toUpperCase();

  return (
    <div ref={ref} className={`relative self-start ${className}`}>
      {/* ECO-118/129: el email largo TRUNCA (max-w + …) sin agrandar el trigger. El tooltip con el valor
          completo va sobre TODO el trigger (position="auto") y SOLO cuando el email TRUNCA (no cabe →
          useIsTruncated); si se ve entero, no sale. Portal a body → no cae dentro del desplegable. */}
      <Tooltip content={truncated ? email : ""} position="auto">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`flex h-10 items-center justify-center gap-2 rounded-md px-6 py-2.5 text-body font-normal whitespace-nowrap transition-colors ${
            open
              ? "border border-border-components bg-surface-subtle text-content-primary"
              : "border border-border-components bg-transparent text-content-primary hover:bg-surface-subtle"
          }`}
        >
          <span ref={emailRef} className="max-w-[220px] truncate leading-none">
            {email}
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </Tooltip>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[300px] animate-dropdown-down">
          <div className="rounded-xl border border-border-strong bg-surface-primary p-2 shadow-card">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg bg-surface-subtle px-3 py-2 text-body font-normal text-content-primary transition-colors"
            >
              <Avatar size="sm" name={emailInitial} />
              <span className="truncate text-body">{email}</span>
            </button>

            <Button
              type="button"
              variant="link-underline"
              size="md"
              fullWidth={false}
              onClick={() => {
                setOpen(false);
                onChangeEmail();
              }}
              className="mt-4"
            >
              Try a different email address
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
