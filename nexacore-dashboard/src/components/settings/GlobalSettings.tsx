"use client";

import { useState, useEffect } from "react";
import { Server, UserPlus, Clock, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Badge from "@/components/ui/Badge";
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
    <section className="rounded-xl border border-border-strong bg-surface-primary p-6">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-body font-semibold text-content-primary">
          Global Settings
        </h2>
        <Badge variant="default" size="sm">
          Admin
        </Badge>
      </div>
      <div className="divide-y divide-border-default">
        <SettingRow
          icon={Server}
          label="System Information"
          description="Application version and environment"
        >
          <div className="flex items-center gap-2">
            <span className="text-caption text-content-primary">v1.0.0</span>
            <Badge variant="info" size="sm">
              Production
            </Badge>
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
