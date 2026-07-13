"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import React from "react";
import type { LucideIcon } from "lucide-react";
import IconBadge from "./IconBadge";

// SettingRow — a labelled settings row: an icon badge + label/description on the left and an action
// slot (toggle, value, badge) on the right. On mobile the icon + action sit on top and the text drops
// below; on desktop everything is inline. Promoted from the dashboard settings screens
// (GlobalSettings / UserPreferences) where it was duplicated byte-for-byte.
export default function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-4">
      {/* Mobile: icon + action top, text below */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between gap-4">
          <IconBadge size="md" icon={Icon} />
          <div className="shrink-0">{children}</div>
        </div>
        <div className="mt-2">
          <p className="text-body font-normal text-content-primary">{label}</p>
          <p className="text-caption text-content-tertiary">{description}</p>
        </div>
      </div>
      {/* Desktop: original layout */}
      <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <IconBadge size="md" icon={Icon} />
          <div>
            <p className="text-body font-normal text-content-primary">
              {label}
            </p>
            <p className="text-caption text-content-tertiary">{description}</p>
          </div>
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    </div>
  );
}
