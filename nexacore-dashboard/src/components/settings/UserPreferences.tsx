"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Bell, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Toggle from "@/components/ui/Toggle";
import SegmentedControl from "@/components/ui/SegmentedControl";

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
          <p className="text-body font-normal text-content-primary">{label}</p>
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
