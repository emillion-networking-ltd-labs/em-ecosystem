"use client";

import PasskeyManager from "./PasskeyManager";
import TrustedDevices from "./TrustedDevices";

export default function DevicesPanel() {
  return (
    <div className="grid items-stretch gap-4 grid-cols-1 min-[1100px]:grid-cols-2">
      <PasskeyManager />
      <TrustedDevices />
    </div>
  );
}
