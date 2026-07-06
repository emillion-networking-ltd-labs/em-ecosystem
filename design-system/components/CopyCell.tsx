"use client";

import React, { useState, useRef } from "react";

// CopyCell — a truncated, click-to-copy table cell. Shows the (possibly truncated) value as a button;
// on hover a cursor-following tooltip reveals the full value, and on click it copies to the clipboard and
// flashes "Copied!". The tooltip is clamped to the nearest `.card-flat` ancestor so it never escapes the
// table card. Promoted from the admin tables (UsersTable / AuditLogsTable) where it was duplicated
// byte-for-byte. A value of "—" renders as a plain dash (nothing to copy).
export default function CopyCell({
  value,
  maxWidth,
  className = "",
}: {
  value: string;
  maxWidth: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const tableRef = useRef<HTMLElement | null>(null);

  if (value === "—") {
    return <span className={`text-content-tertiary ${className}`}>—</span>;
  }

  const handleClick = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!tableRef.current) {
      tableRef.current = (e.target as HTMLElement).closest(".card-flat");
    }
    const table = tableRef.current?.getBoundingClientRect();
    if (table) {
      setPos({
        x: Math.min(e.clientX + 12, table.right - 320),
        y: Math.min(e.clientY + 12, table.bottom - 40),
      });
    } else {
      setPos({ x: e.clientX + 12, y: e.clientY + 12 });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false);
          setCopied(false);
          tableRef.current = null;
        }}
        onMouseMove={handleMouseMove}
        className={`block truncate text-left transition-colors hover:text-content-primary ${maxWidth} ${className}`}
      >
        {value}
      </button>
      {hover && (
        <div
          className={`pointer-events-none select-none fixed z-50 max-w-xs rounded-lg border px-3 py-2 text-caption shadow-card ${
            copied
              ? "border-success/30 bg-success-bg text-success"
              : "border-border-components bg-surface-primary text-content-primary"
          }`}
          style={{ left: pos.x, top: pos.y }}
        >
          {copied ? "Copied!" : value}
        </div>
      )}
    </div>
  );
}
