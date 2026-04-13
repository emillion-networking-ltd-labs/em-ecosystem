"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Bell, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import IconBadge from "@/components/ui/IconBadge";
import Toggle from "@/components/ui/Toggle";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";

function SettingRow({
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
          <IconBadge size="md">
            <Icon size={24} />
          </IconBadge>
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
          <IconBadge size="md">
            <Icon size={24} />
          </IconBadge>
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

export default function UserPreferences() {
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("settings:emailNotifications");
    if (stored !== null) setEmailNotifications(stored === "true");
  }, []);

  const handleEmailToggle = (val: boolean) => {
    setEmailNotifications(val);
    localStorage.setItem("settings:emailNotifications", String(val));
  };

  return (
    <section className="rounded-xl border border-border-strong bg-surface-primary p-6">
      <h2 className="mb-4 text-body font-semibold text-content-primary">
        Preferences
      </h2>
      <div className="divide-y divide-border-default">
        <SettingRow
          icon={theme === "dark" ? Moon : Sun}
          label="Theme"
          description="Choose your preferred appearance"
        >
          <SegmentedControl
            value={theme}
            onChange={setTheme}
            options={[
              { value: "light", label: "Light", icon: <Sun size={14} /> },
              { value: "dark", label: "Dark", icon: <Moon size={14} /> },
            ]}
          />
        </SettingRow>

        <SettingRow
          icon={Bell}
          label="Email Notifications"
          description="Receive email alerts for important events"
        >
          <Toggle
            checked={emailNotifications}
            onChange={handleEmailToggle}
            size="md"
          />
        </SettingRow>

        <SettingRow
          icon={Globe}
          label="Language"
          description="Display language for the interface"
        >
          <Select
            options={[{ value: "en", label: "English" }]}
            value="en"
            onChange={() => {}}
            placeholder="Language"
          />
        </SettingRow>
      </div>
    </section>
  );
}
