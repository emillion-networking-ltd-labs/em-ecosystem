"use client";

import { useState, useCallback, useEffect } from "react";
import CopyField from "./CopyField";

export const qrCodeCardSpecs = {
  container: "rounded-lg border border-border-strong bg-white p-4",
  image: "h-48 w-48",
  secretKey: "CopyField component — copyable monospace text below QR",
};

interface QrCodeCardProps {
  secret?: string;
  qrDataUrl?: string;
  onGenerate?: () => void;
  className?: string;
}

export default function QrCodeCard({
  secret: externalSecret,
  qrDataUrl: externalQr,
  className = "",
}: QrCodeCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState(externalQr || "");
  const [secret, setSecret] = useState(externalSecret || "JBSWY3DPEHPK3PXP");

  const generateQr = useCallback(async () => {
    const QRCode = (await import("qrcode")).default;
    const newSecret = Array.from(
      { length: 16 },
      () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[Math.floor(Math.random() * 32)],
    ).join("");
    setSecret(newSecret);
    const otpUrl = `otpauth://totp/NexaCore:demo@example.com?secret=${newSecret}&issuer=NexaCore`;
    const url = await QRCode.toDataURL(otpUrl, { width: 192, margin: 1 });
    setQrDataUrl(url);
  }, []);

  useEffect(() => {
    if (!externalQr) generateQr();
  }, [externalQr, generateQr]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex justify-center rounded-lg border border-border-strong bg-white p-4">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR Code" className="h-48 w-48" />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center text-caption text-content-primary/50">
            Loading...
          </div>
        )}
      </div>
      <CopyField value={secret} />
    </div>
  );
}
