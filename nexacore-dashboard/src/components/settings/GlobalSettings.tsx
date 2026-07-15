"use client";

import { useState, useEffect } from "react";
import { Server, UserPlus, Clock, ShieldCheck } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Toggle from "@/components/ui/Toggle";
import SettingRow from "@/components/ui/SettingRow";

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
    <section className="rounded-xl border border-line-strong bg-surface-primary p-6">
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
