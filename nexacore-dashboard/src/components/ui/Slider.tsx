"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import { useId, useCallback } from "react";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export const sliderSpecs = {
  track: {
    background:
      "bg-surface-primary border border-line-control — 8px height, rounded-full",
    fill: "bg-surface-inverse border border-line-control — dynamic width via percentage",
  },
  thumb: {
    size: "16×16px rounded-full",
    style:
      "bg-surface-primary border border-solid border-line-control — thumb knob; focus ring var(--color-line-control)",
  },
  label: "text-body font-normal text-content-primary",
  value: "text-caption text-content-secondary tabular-nums",
};

export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  showValue = false,
  className = "",
}: SliderProps) {
  const id = useId();
  // Fill fraction 0..1 (thumb and fill reach the ends; the thumb is made visible via border + shadow
  // so it reads clearly against the light track at the extremes).
  const frac = (value - min) / (max - min);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={id}
              className={`text-body font-normal text-content-primary ${
                disabled ? "opacity-50" : ""
              }`}
            >
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-caption text-content-secondary tabular-nums">
              {value}
            </span>
          )}
        </div>
      )}
      <div className="relative flex items-center h-4">
        {/* Track background */}
        <div className="absolute w-full h-2 rounded-full bg-surface-primary border border-line-control" />

        {/* Progress fill */}
        <div
          className="absolute h-2 rounded-full bg-surface-inverse border border-line-control"
          style={{ width: `${frac * 100}%` }}
        />

        {/* Handle (rendered via native range input styling) */}
        <input
          id={id}
          type="range"
          role="slider"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label}
          className={`absolute -ml-2 h-4 w-[calc(100%+1rem)] appearance-none bg-transparent cursor-pointer caret-transparent
            focus:outline-none
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-surface-primary
            [&::-webkit-slider-thumb]:border
            [&::-webkit-slider-thumb]:border-solid
            [&::-webkit-slider-thumb]:border-line-control
            [&::-webkit-slider-thumb]:shadow-control
            focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_2px_var(--color-line-control),var(--shadow-control)]
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-surface-primary
            [&::-moz-range-thumb]:border
            [&::-moz-range-thumb]:border-solid
            [&::-moz-range-thumb]:border-line-control
            [&::-moz-range-thumb]:shadow-control
            focus-visible:[&::-moz-range-thumb]:shadow-[0_0_0_2px_var(--color-line-control),var(--shadow-control)]
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
      </div>
    </div>
  );
}
