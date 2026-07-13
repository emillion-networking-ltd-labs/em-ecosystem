"use client";

import InlineError from "./InlineError";

export const formFieldSpecs = {
  container: "flex flex-col gap-2",
  label: "text-body font-semibold text-content-primary (error: text-error/75)",
  required: "ml-0.5 text-error (*)",
  children:
    "Any form control: Input, Select, EmailSelector, Toggle, Checkbox, etc.",
  error: "InlineError component (CircleX 16px + text-caption text-error)",
};

interface FormFieldProps {
  label?: string;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({
  label,
  error,
  htmlFor,
  required,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={`text-body font-semibold ${error ? "text-error/75" : "text-content-primary"}`}
        >
          {label}
          {required && (
            <span className="ml-0.5 text-error" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error && <InlineError message={error} />}
    </div>
  );
}
