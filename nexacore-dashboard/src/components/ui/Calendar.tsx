"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateDisabled(date: Date, minDate?: Date, maxDate?: Date): boolean {
  if (minDate && date < minDate) return true;
  if (maxDate && date > maxDate) return true;
  return false;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday-based (Mon=0, Sun=6)
  return day === 0 ? 6 : day - 1;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

export default function Calendar({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  className = "",
}: CalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(
    value?.getFullYear() ?? today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    value?.getMonth() ?? today.getMonth(),
  );

  const days = useMemo((): CalendarDay[] => {
    const result: CalendarDay[] = [];
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

    // Previous month overflow
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const date = new Date(prevYear, prevMonth, d);
      result.push({
        date,
        day: d,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        isSelected: value ? isSameDay(date, value) : false,
        isDisabled: disabled || isDateDisabled(date, minDate, maxDate),
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      result.push({
        date,
        day: d,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        isSelected: value ? isSameDay(date, value) : false,
        isDisabled: disabled || isDateDisabled(date, minDate, maxDate),
      });
    }

    // Next month overflow (fill to 42 cells = 6 rows)
    const remaining = 42 - result.length;
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(nextYear, nextMonth, d);
      result.push({
        date,
        day: d,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        isSelected: value ? isSameDay(date, value) : false,
        isDisabled: disabled || isDateDisabled(date, minDate, maxDate),
      });
    }

    return result;
  }, [viewYear, viewMonth, value, today, disabled, minDate, maxDate]);

  const goToPrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const goToNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className={`w-[300px] bg-surface-primary border border-border-default shadow-card rounded-3xl p-6 flex flex-col gap-5 ${className}`}
    >
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPrevMonth}
          disabled={disabled}
          aria-label="Previous month"
          className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-subtle hover:bg-hover transition-colors disabled:opacity-50"
        >
          <ChevronLeft size={16} className="text-content-primary" />
        </button>
        <span className="text-body-sm font-bold text-content-primary">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          disabled={disabled}
          aria-label="Next month"
          className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-subtle hover:bg-hover transition-colors disabled:opacity-50"
        >
          <ChevronRight size={16} className="text-content-primary" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-1" role="grid">
        {/* Weekday headers */}
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-normal text-content-primary py-1"
            role="columnheader"
          >
            {day}
          </div>
        ))}

        {/* Day cells */}
        {days.map((day, i) => (
          <button
            key={i}
            type="button"
            disabled={day.isDisabled}
            onClick={() => !day.isDisabled && onChange(day.date)}
            aria-label={day.date.toLocaleDateString()}
            aria-selected={day.isSelected}
            className={`w-full aspect-square flex items-center justify-center text-[15px] font-normal rounded-full transition-colors ${
              day.isSelected
                ? "bg-surface-inverse text-content-inverse font-medium"
                : day.isToday
                  ? "bg-surface-subtle text-content-primary font-medium"
                  : day.isCurrentMonth
                    ? "text-content-primary hover:bg-hover"
                    : "text-content-disabled"
            } ${day.isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {day.day}
          </button>
        ))}
      </div>
    </div>
  );
}
