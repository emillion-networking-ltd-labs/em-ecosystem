"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import IconButton from "./IconButton";
import type { TooltipPosition } from "./Tooltip";

type ThemeToggleProps = {
  className?: string;
  tooltipPosition?: TooltipPosition;
};

export default function ThemeToggle({
  className = "",
  tooltipPosition = "auto",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`h-8 w-8 ${className}`} />;
  }

  return (
    <IconButton
      variant="boxed"
      size="sm"
      tooltip
      tooltipPosition={tooltipPosition}
      onClick={toggleTheme}
      className={className}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
    </IconButton>
  );
}
