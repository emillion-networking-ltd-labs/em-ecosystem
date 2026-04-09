"use client";

import { useState } from "react";
import PasskeyManager from "./PasskeyManager";
import TrustedDevices from "./TrustedDevices";

type ExpandedPanel = "none" | "passkeys" | "devices";

export default function DevicesPanel() {
  const [expanded, setExpanded] = useState<ExpandedPanel>("none");

  return (
    <div
      className={`grid items-stretch gap-4 ${expanded === "none" ? "grid-cols-1 min-[1100px]:grid-cols-2" : "grid-cols-1"}`}
    >
      {expanded !== "devices" && (
        <div
          className={expanded === "passkeys" ? "mx-auto w-full max-w-2xl" : ""}
        >
          <PasskeyManager
            onExpandChange={(exp) => setExpanded(exp ? "passkeys" : "none")}
          />
        </div>
      )}
      {expanded !== "passkeys" && (
        <div
          className={expanded === "devices" ? "mx-auto w-full max-w-2xl" : ""}
        >
          <TrustedDevices />
        </div>
      )}
    </div>
  );
}
