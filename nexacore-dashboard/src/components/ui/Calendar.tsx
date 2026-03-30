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

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

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

export const calendarSpecs = {
  container: {
    shared:
      "w-[300px] bg-surface-primary border border-border-strong rounded-xl p-6 gap-5 shadow-card",
  },
  navigation: {
    button: "w-6 h-6 rounded-full bg-surface-subtle hover:bg-surface-subtle",
    icon: "ChevronLeft/Right 16px text-content-primary",
    label:
      "text-body font-semibold — Link style (75% → 100%), disabled at years level",
  },
  views: {
    days: "grid-cols-7 — circle button (min-w-9 h-9 rounded-full)",
    months: "grid-cols-3 — circle button auto-width",
    years: "grid-cols-3 — circle button auto-width",
  },
  day: {
    selected:
      "bg-surface-inverse text-content-inverse font-normal rounded-full",
    today: "bg-surface-subtle text-content-primary font-normal rounded-full",
    default: "text-content-primary hover:bg-surface-subtle rounded-full",
    "other month": "text-content-primary/50",
    disabled: "opacity-30 cursor-not-allowed",
  },
  weekday: "text-caption font-normal text-content-primary text-center",
};

type ViewMode = "days" | "months" | "years";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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
  const [viewMode, setViewMode] = useState<ViewMode>("days");
  const [yearRangeStart, setYearRangeStart] = useState(
    Math.floor((value?.getFullYear() ?? today.getFullYear()) / 12) * 12,
  );

  const days = useMemo((): CalendarDay[] => {
    const result: CalendarDay[] = [];
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

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

  const goToPrev = useCallback(() => {
    if (viewMode === "days") {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    } else if (viewMode === "months") {
      setViewYear((y) => y - 1);
    } else {
      setYearRangeStart((y) => y - 12);
    }
  }, [viewMonth, viewMode]);

  const goToNext = useCallback(() => {
    if (viewMode === "days") {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    } else if (viewMode === "months") {
      setViewYear((y) => y + 1);
    } else {
      setYearRangeStart((y) => y + 12);
    }
  }, [viewMonth, viewMode]);

  const headerLabel =
    viewMode === "days"
      ? new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : viewMode === "months"
        ? `${viewYear}`
        : `${yearRangeStart} — ${yearRangeStart + 11}`;

  const handleHeaderClick = () => {
    if (viewMode === "days") setViewMode("months");
    else if (viewMode === "months") {
      setYearRangeStart(Math.floor(viewYear / 12) * 12);
      setViewMode("years");
    }
  };

  const selectMonth = (month: number) => {
    setViewMonth(month);
    setViewMode("days");
  };

  const selectYear = (year: number) => {
    setViewYear(year);
    setViewMode("months");
  };

  const cellClass = (isActive: boolean, isCurrent: boolean) =>
    `min-w-9 h-9 px-2 mx-auto flex items-center justify-center text-body font-normal rounded-full transition-colors cursor-pointer ${
      isActive
        ? "bg-surface-inverse text-content-inverse font-normal"
        : isCurrent
          ? "bg-surface-subtle text-content-primary font-normal"
          : "text-content-primary hover:bg-surface-subtle"
    }`;

  return (
    <div
      className={`w-[300px] bg-surface-primary border border-border-strong rounded-xl p-6 flex flex-col gap-5 shadow-card ${className}`}
    >
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPrev}
          disabled={disabled}
          aria-label="Previous"
          className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-subtle hover:bg-surface-subtle transition-colors disabled:opacity-50"
        >
          <ChevronLeft size={16} className="text-content-primary" />
        </button>
        <button
          type="button"
          onClick={handleHeaderClick}
          disabled={viewMode === "years"}
          className={`text-body font-semibold transition-colors ${viewMode === "years" ? "text-content-primary cursor-default" : "text-content-primary/75 hover:text-content-primary cursor-pointer"}`}
        >
          {headerLabel}
        </button>
        <button
          type="button"
          onClick={goToNext}
          disabled={disabled}
          aria-label="Next"
          className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-subtle hover:bg-surface-subtle transition-colors disabled:opacity-50"
        >
          <ChevronRight size={16} className="text-content-primary" />
        </button>
      </div>

      {/* Days view */}
      {viewMode === "days" && (
        <div className="grid grid-cols-7 gap-y-1" role="grid">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-caption font-normal text-content-primary py-1"
              role="columnheader"
            >
              {day}
            </div>
          ))}
          {days.map((day, i) => (
            <button
              key={i}
              type="button"
              disabled={day.isDisabled}
              onClick={() => !day.isDisabled && onChange(day.date)}
              aria-label={day.date.toLocaleDateString()}
              aria-selected={day.isSelected}
              className={`min-w-9 h-9 px-2 mx-auto flex items-center justify-center text-body font-normal rounded-full transition-colors ${
                day.isSelected
                  ? "bg-surface-inverse text-content-inverse font-normal"
                  : day.isToday
                    ? "bg-surface-subtle text-content-primary font-normal"
                    : day.isCurrentMonth
                      ? "text-content-primary hover:bg-surface-subtle"
                      : "text-content-primary/50"
              } ${day.isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {day.day}
            </button>
          ))}
        </div>
      )}

      {/* Months view */}
      {viewMode === "months" && (
        <div className="grid grid-cols-3 gap-2">
          {MONTH_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => selectMonth(i)}
              className={cellClass(
                i === viewMonth && viewYear === (value?.getFullYear() ?? -1),
                i === today.getMonth() && viewYear === today.getFullYear(),
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Years view */}
      {viewMode === "years" && (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map(
            (year) => (
              <button
                key={year}
                type="button"
                onClick={() => selectYear(year)}
                className={cellClass(
                  year === (value?.getFullYear() ?? -1),
                  year === today.getFullYear(),
                )}
              >
                {year}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
