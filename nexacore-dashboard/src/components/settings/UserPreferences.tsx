"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Bell, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-content-primary" : "bg-black/[0.08] dark:bg-white/[0.08]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

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
    <div className="flex items-center justify-between gap-4 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.04]">
          <Icon size={20} className="text-content-secondary" />
        </div>
        <div>
          <p className="text-body-sm font-medium text-content-primary">
            {label}
          </p>
          <p className="text-caption text-content-tertiary">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
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
    <section className="rounded-2xl border border-border-default bg-surface-primary p-6">
      <h2 className="mb-4 text-body-sm font-semibold text-content-primary">
        Preferences
      </h2>
      <div className="divide-y divide-border-default">
        <SettingRow
          icon={theme === "dark" ? Moon : Sun}
          label="Theme"
          description="Choose your preferred appearance"
        >
          <div className="flex items-center gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.04]">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-caption transition-colors ${
                theme === "light"
                  ? "bg-surface-primary text-content-primary shadow-sm"
                  : "text-content-tertiary hover:text-content-primary"
              }`}
            >
              <Sun size={14} />
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-caption transition-colors ${
                theme === "dark"
                  ? "bg-surface-primary text-content-primary shadow-sm"
                  : "text-content-tertiary hover:text-content-primary"
              }`}
            >
              <Moon size={14} />
              Dark
            </button>
          </div>
        </SettingRow>

        <SettingRow
          icon={Bell}
          label="Email Notifications"
          description="Receive email alerts for important events"
        >
          <Toggle checked={emailNotifications} onChange={handleEmailToggle} />
        </SettingRow>

        <SettingRow
          icon={Globe}
          label="Language"
          description="Display language for the interface"
        >
          <select
            className="rounded-lg border border-border-default bg-surface-primary px-3 py-1.5 text-caption text-content-primary"
            defaultValue="en"
            disabled
          >
            <option value="en">English</option>
          </select>
        </SettingRow>
      </div>
    </section>
  );
}
