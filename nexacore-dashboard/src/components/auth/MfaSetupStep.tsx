"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CircleX, Copy, Check } from "lucide-react";
import InfinitySpinner from "@/components/ui/InfinitySpinner";
import AuthLayout from "@/components/layout/AuthLayout";
import Button from "@/components/ui/Button";
import InlineError from "@/components/ui/InlineError";
import IconButton from "@/components/ui/IconButton";
import MfaDigitInput from "@/components/ui/MfaDigitInput";
import { useAuth } from "@/hooks/useAuth";

type SetupPhase = "loading" | "error" | "qr" | "recovery" | "verify";

export default function MfaSetupStep() {
  const { setupMfa, verifyMfaSetup, cancelMfa, isLoading } = useAuth();
  const [phase, setPhase] = useState<SetupPhase>("loading");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const initRef = useRef(false);

  // Fetch QR code on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      try {
        const data = await setupMfa();
        setQrCodeDataUrl(data.qrCodeDataUrl);
        setSecret(data.secret);
        setRecoveryCodes(data.recoveryCodes);
        setPhase("qr");
      } catch {
        setPhase("error");
      }
    })();
  }, [setupMfa]);

  const handleDigitChange = (index: number, value: string) => {
    setError(null);
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const updated = [...code];
    updated[index] = digit;
    setCode(updated);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (digit && index === 5) {
      const full = updated.join("");
      if (full.length === 6) handleVerify(full);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const updated = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i];
    setCode(updated);
    if (pasted.length === 6) handleVerify(pasted);
    else inputRefs.current[pasted.length]?.focus();
  };

  const handleVerify = useCallback(
    async (codeStr: string) => {
      setError(null);
      try {
        await verifyMfaSetup(codeStr);
      } catch {
        setError("Invalid code. Please try again.");
        setCode(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      }
    },
    [verifyMfaSetup],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const full = code.join("");
    if (full.length === 6) handleVerify(full);
  };

  const copyRecoveryCodes = async () => {
    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // Phase: Loading
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <InfinitySpinner />
        <p className="text-body text-content-primary/50">
          Preparing MFA setup...
        </p>
      </div>
    );
  }

  // Phase: Error — portal overlay replicating AuthLayout narrow (verify-email pattern)
  if (phase === "error") {
    return createPortal(
      <div className="fixed inset-0 z-50">
        <AuthLayout narrow>
          <div className="flex flex-col items-center gap-2">
            <CircleX
              size={48}
              className="icon-error text-[#8a1111]"
              strokeWidth={1.5}
            />

            <p className="text-center text-body text-content-primary/50">
              MFA setup failed!
              <br />
              An unexpected error occurred. Please try again.
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Go to Sign In
            </Button>
          </div>
        </AuthLayout>
      </div>,
      document.body,
    );
  }

  // Phase: QR Code
  if (phase === "qr") {
    return (
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex w-full flex-col gap-2 md:w-[330px]">
          <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
            <h1 className="text-h1 font-semibold text-content-primary">
              Set Up MFA
            </h1>
            <p className="text-justify text-body text-content-primary/50">
              Your account requires two-factor authentication. Scan the QR code
              with your authenticator app (Google Authenticator, Authy, etc.).
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 md:w-[348px]">
          {error && (
            <InlineError
              message={error}
              className="rounded-lg border border-error/20 bg-error/5 px-3 py-2"
            />
          )}

          {qrCodeDataUrl && (
            <div className="flex justify-center rounded-lg border border-border-strong bg-white p-4">
              <img
                src={qrCodeDataUrl}
                alt="MFA QR Code"
                className="h-48 w-48"
              />
            </div>
          )}

          {/* Manual entry fallback */}
          <div className="flex flex-col gap-2">
            <span className="text-body text-content-primary/50">
              Or enter this key manually:
            </span>
            <div className="flex h-12 items-center gap-2 rounded-lg border border-border-strong bg-surface-subtle px-4">
              <code className="flex-1 break-all font-mono text-body leading-6 text-content-primary">
                {secret}
              </code>
              <IconButton onClick={copySecret} aria-label="Copy secret key">
                {copiedSecret ? (
                  <Check size={14} className="text-green-600" />
                ) : (
                  <Copy size={14} />
                )}
              </IconButton>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelMfa}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => setPhase("recovery")}
              className="flex-1"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Phase: Recovery Codes
  if (phase === "recovery") {
    return (
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex w-full flex-col gap-2 md:w-[330px]">
          <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
            <h1 className="text-h1 font-semibold text-content-primary">
              Recovery Codes
            </h1>
            <p className="text-justify text-body text-content-primary/50">
              Save these recovery codes in a safe place. Each code can only be
              used once if you lose access to your authenticator app.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 md:w-[348px]">
          <div className="rounded-lg border border-border-strong bg-surface-subtle p-4">
            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((c, i) => (
                <code
                  key={i}
                  className="rounded bg-white px-2 py-1 text-center font-mono text-body text-content-primary dark:bg-surface-inverse/10"
                >
                  {c}
                </code>
              ))}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={copyRecoveryCodes}
            fullWidth={false}
            className="mx-auto"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-600" /> Copied!
              </>
            ) : (
              <>
                <Copy size={16} /> Copy all codes
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPhase("qr")}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => {
                setPhase("verify");
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
              }}
              className="flex-1"
            >
              I saved them
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Phase: Verify TOTP
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="flex w-full flex-col gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-h1 font-semibold text-content-primary">
            Verify Setup
          </h1>
          <p className="text-justify text-body text-content-primary/50">
            Enter the 6-digit code from your authenticator app to confirm setup.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[348px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex min-h-[116px] flex-col gap-2">
            <label
              htmlFor="setup-digit-0"
              className="text-body font-semibold leading-[22px] text-content-primary"
            >
              Verification Code
            </label>

            <MfaDigitInput
              value={code}
              onChange={setCode}
              idPrefix="setup-digit"
            />

            <div aria-live="polite" className={error ? "min-h-6" : "h-6"}>
              {error && <InlineError message={error} />}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPhase("recovery")}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isLoading || code.join("").length !== 6}
              loading={isLoading}
              className="flex-1"
            >
              Enable MFA
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
