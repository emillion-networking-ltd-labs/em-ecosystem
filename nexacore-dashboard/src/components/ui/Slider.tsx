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

export const sliderSpecs = {
  track: {
    background:
      "bg-surface-primary border-2 border-border-strong — 8px height, rounded-full",
    fill: "bg-surface-inverse border-2 border-border-strong — dynamic width via percentage",
  },
  thumb: {
    size: "16×16px rounded-full",
    style: "bg-white border-2 border-solid border-[rgba(0,0,0,0.08)]",
  },
  label: "text-body font-normal text-content-primary",
  value: "text-caption text-content-primary/50 tabular-nums",
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
              className={`text-body font-normal text-content-primary ${
                disabled ? "opacity-50" : ""
              }`}
            >
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-caption text-content-primary/50 tabular-nums">
              {value}
            </span>
          )}
        </div>
      )}
      <div className="relative flex items-center h-[16px]">
        {/* Track background */}
        <div className="absolute w-full h-[8px] rounded-full bg-surface-primary border-2 border-border-strong" />

        {/* Progress fill */}
        <div
          className="absolute h-[8px] rounded-full bg-surface-inverse border-2 border-border-strong"
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
          className={`absolute w-full h-[16px] appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-[16px]
            [&::-webkit-slider-thumb]:h-[16px]
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-solid
            [&::-webkit-slider-thumb]:border-[rgba(0,0,0,0.08)]
            [&::-moz-range-thumb]:w-[16px]
            [&::-moz-range-thumb]:h-[16px]
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-solid
            [&::-moz-range-thumb]:border-[rgba(0,0,0,0.08)]
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
      </div>
    </div>
  );
}
