"use client";

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
  const percentage = ((value - min) / (max - min)) * 100;

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
              className={`text-body-sm font-medium text-content-primary ${
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
      <div className="relative flex items-center h-[18px]">
        {/* Track background */}
        <div className="absolute w-full h-[3px] rounded-md bg-border-default border border-border-default" />

        {/* Progress fill */}
        <div
          className="absolute h-[3px] rounded-md bg-surface-inverse border border-border-default"
          style={{ width: `${percentage}%` }}
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
          className={`absolute w-full h-[18px] appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-[18px]
            [&::-webkit-slider-thumb]:h-[18px]
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-[3px]
            [&::-webkit-slider-thumb]:border-content-primary
            [&::-webkit-slider-thumb]:shadow
            [&::-webkit-slider-thumb]:transition-shadow
            [&::-webkit-slider-thumb]:hover:shadow-md
            [&::-moz-range-thumb]:w-[18px]
            [&::-moz-range-thumb]:h-[18px]
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-[3px]
            [&::-moz-range-thumb]:border-content-primary
            [&::-moz-range-thumb]:shadow
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
      </div>
    </div>
  );
}
