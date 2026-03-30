"use client";

import { useState, useEffect } from "react";
import { Server, UserPlus, Clock, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import IconBadge from "@/components/ui/IconBadge";
import Toggle from "@/components/ui/Toggle";

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
        <IconBadge size="md">
          <Icon size={24} />
        </IconBadge>
        <div>
          <p className="text-body font-normal text-content-primary">{label}</p>
          <p className="text-caption text-content-tertiary">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function GlobalSettings() {
  const [publicRegistration, setPublicRegistration] = useState(true);
  const [mfaEnforced, setMfaEnforced] = useState(false);

  useEffect(() => {
    const regStored = localStorage.getItem("globalSettings:publicRegistration");
    if (regStored !== null) setPublicRegistration(regStored === "true");
    const mfaStored = localStorage.getItem("globalSettings:mfaEnforced");
    if (mfaStored !== null) setMfaEnforced(mfaStored === "true");
  }, []);

  const handleRegistrationToggle = (val: boolean) => {
    setPublicRegistration(val);
    localStorage.setItem("globalSettings:publicRegistration", String(val));
  };

  const handleMfaToggle = (val: boolean) => {
    setMfaEnforced(val);
    localStorage.setItem("globalSettings:mfaEnforced", String(val));
  };

  return (
    <section className="rounded-xl border border-border-default bg-surface-primary p-6">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-body font-semibold text-content-primary">
          Global Settings
        </h2>
        <span className="rounded-lg bg-black/[0.04] px-2 py-0.5 text-caption text-content-tertiary dark:bg-white/[0.04]">
          Admin
        </span>
      </div>
      <div className="divide-y divide-border-default">
        <SettingRow
          icon={Server}
          label="System Information"
          description="Application version and environment"
        >
          <div className="flex items-center gap-2">
            <span className="text-caption text-content-primary">v1.0.0</span>
            <span className="rounded-lg bg-success/10 px-2 py-0.5 text-caption text-success">
              Production
            </span>
          </div>
        </SettingRow>

        <SettingRow
          icon={UserPlus}
          label="Public Registration"
          description="Allow new users to create accounts"
        >
          <Toggle
            checked={publicRegistration}
            onChange={handleRegistrationToggle}
            size="md"
          />
        </SettingRow>

        <SettingRow
          icon={Clock}
          label="Session Timeout"
          description="Default session duration for all users"
        >
          <span className="text-caption text-content-primary">24 hours</span>
        </SettingRow>

        <SettingRow
          icon={ShieldCheck}
          label="Enforce MFA"
          description="Require multi-factor authentication for all users"
        >
          <Toggle checked={mfaEnforced} onChange={handleMfaToggle} size="md" />
        </SettingRow>
      </div>
    </section>
  );
}
