'use client';

import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Spinner from './Spinner';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  loading?: boolean;
  leftIcon?: ReactNode;
}

export default function Input({
  label,
  error,
  loading = false,
  leftIcon,
  type = 'text',
  className = '',
  disabled,
  id,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || props.name;
  const isPassword = type === 'password';

  /* Outline states (ui-design-system: border always 1px black/5, outline on top)
     default: no outline | hover: 1.5px black/75 | focus: 1.5px black/75 | error: 1.5px error-border */
  const outlineClass = error
    ? 'outline-error-border'
    : 'outline-transparent hover:outline-content-primary/75 focus-within:outline-content-primary/75';

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[15px] font-semibold leading-[22px] text-content-primary"
        >
          {label}
        </label>
      )}
      <div
        className={`
          flex h-12 items-center gap-2 rounded-lg border border-border-default bg-transparent px-4
          outline outline-2 outline-offset-2 transition-colors
          ${outlineClass}
          ${disabled ? 'cursor-not-allowed opacity-60' : ''}
        `}
      >
        {leftIcon && (
          <span className="shrink-0 text-content-secondary">{leftIcon}</span>
        )}
        <input
          id={inputId}
          type={isPassword && showPassword ? 'text' : type}
          disabled={disabled || loading}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="flex-1 bg-transparent text-[15px] leading-6 text-content-primary outline-none placeholder:text-content-placeholder"
          {...props}
        />
        {isPassword && !loading && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="shrink-0 text-content-secondary hover:text-content-primary/75"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {loading && (
          <span className="shrink-0">
            <Spinner size="sm" />
          </span>
        )}
      </div>
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-xs text-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
