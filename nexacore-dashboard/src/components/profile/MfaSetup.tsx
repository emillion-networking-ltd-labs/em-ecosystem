"use client";

import { useState, useEffect, useCallback } from "react";
// Server returns qrCodeDataUrl as a pre-rendered PNG data URL — display directly via <img>
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import Button from "@/components/ui/Button";
import InlineError from "@/components/ui/InlineError";
import Input from "@/components/ui/Input";
import MfaDigitInput from "@/components/ui/MfaDigitInput";
import AlertBox from "@/components/ui/AlertBox";
import QrCodeCard from "@/components/ui/QrCodeCard";
import type { MfaSetupResponse, MfaStatusResponse } from "@/lib/types";

type MfaView =
  | "status"
  | "setup"
  | "verify"
  | "recovery-codes"
  | "disable"
  | "regenerate";

export default function MfaSetup({
  bare,
  onExpandChange,
}: {
  bare?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}) {
  const cardClass = bare
    ? ""
    : "h-full rounded-xl border border-border-strong bg-surface-primary p-6";
  const { user, refreshSession } = useAuth();
  const { addToast } = useToast();
  const [view, setViewInternal] = useState<MfaView>("status");
  const setView = (v: MfaView) => {
    setViewInternal(v);
    onExpandChange?.(v !== "status");
  };
  const [status, setStatus] = useState<MfaStatusResponse | null>(null);
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState<string[]>(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [copiedCodes, setCopiedCodes] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiClient.get<MfaStatusResponse>("/auth/mfa/status");
      setStatus(data);
    } catch {
      // Silently fail — user might not have MFA
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const data = await apiClient.post<MfaSetupResponse>(
        "/auth/mfa/setup",
        {},
      );
      setSetupData(data);
      setRecoveryCodes(data.recoveryCodes);
      setView("setup");
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      addToast({
        variant: "error",
        title: "MFA setup failed",
        description: apiErr?.error?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitVerifyCode = async (code: string) => {
    setFieldError("");
    setLoading(true);
    try {
      await apiClient.post("/auth/mfa/verify-setup", { token: code });
      setView("recovery-codes");
      setVerifyCode(Array(6).fill(""));
      await fetchStatus();
      await refreshSession();
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      addToast({
        variant: "error",
        title: "Verification failed",
        description:
          apiErr?.error?.message || "Invalid code. Please try again.",
      });
      setFieldError("Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setFieldError("Password is required");
      return;
    }
    setFieldError("");
    setLoading(true);
    try {
      await apiClient.delete("/auth/mfa", {
        body: JSON.stringify({ password }),
        headers: { "Content-Type": "application/json" },
      });
      setPassword("");
      setView("status");
      setSetupData(null);
      await fetchStatus();
      await refreshSession();
      addToast({
        variant: "success",
        title: "MFA disabled",
        description: "Two-factor authentication has been disabled.",
      });
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      addToast({
        variant: "error",
        title: "Failed to disable MFA",
        description: apiErr?.error?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setFieldError("Password is required");
      return;
    }
    setFieldError("");
    setLoading(true);
    try {
      const data = await apiClient.post<{ recoveryCodes: string[] }>(
        "/auth/mfa/recovery-codes",
        { password },
      );
      setRecoveryCodes(data.recoveryCodes);
      setPassword("");
      setView("recovery-codes");
      await fetchStatus();
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      addToast({
        variant: "error",
        title: "Failed to regenerate",
        description: apiErr?.error?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCodes = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  };

  const mfaEnabled = user?.mfaEnabled || status?.mfaEnabled;

  // Recovery codes view (after setup or regeneration)
  if (view === "recovery-codes") {
    return (
      <div className={cardClass}>
        <h2 className="mb-6 text-body font-semibold text-content-primary">
          Recovery Codes
        </h2>

        <div className="space-y-4">
          <AlertBox variant="warning">
            Save these recovery codes in a secure location. Each code can only
            be used once. If you lose access to your authenticator app, you can
            use these codes to sign in.
          </AlertBox>

          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border-components bg-surface-subtle p-4">
            {recoveryCodes.map((code, i) => (
              <code
                key={i}
                className="select-all font-mono text-body text-content-primary"
              >
                {code}
              </code>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              fullWidth={false}
              onClick={() => copyCodes(recoveryCodes.join("\n"))}
            >
              {copiedCodes ? <Check size={16} /> : <Copy size={16} />}
              {copiedCodes ? "Copied" : "Copy all"}
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              size="md"
              fullWidth={false}
              onClick={() => {
                setView("status");
                setRecoveryCodes([]);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Setup QR view
  if (view === "setup" && setupData) {
    return (
      <div className={cardClass}>
        <h2 className="mb-6 text-body font-semibold text-content-primary">
          Set Up Two-Factor Authentication
        </h2>

        <div className="space-y-6">
          <p className="text-caption text-content-secondary">
            Scan the QR code below with your authenticator app (Google
            Authenticator, Authy, 1Password, etc.).
          </p>

          {/* QR Code + Secret — using design system components */}
          <QrCodeCard
            qrDataUrl={setupData.qrCodeDataUrl}
            secret={setupData.secret}
          />

          <p className="text-caption text-content-secondary">
            Or enter this secret manually:
          </p>

          {/* Verify code form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const code = verifyCode.join("");
              if (code.length === 6) submitVerifyCode(code);
              else setFieldError("Enter all 6 digits");
            }}
            className="space-y-4"
          >
            <div>
              <p className="mb-2 text-body font-semibold text-content-primary">
                Verification Code
              </p>
              <MfaDigitInput
                value={verifyCode}
                onChange={(v) => {
                  setFieldError("");
                  setVerifyCode(v);
                }}
                onComplete={(code) => submitVerifyCode(code)}
                error={!!fieldError}
                autoFocus
              />
              {fieldError && (
                <InlineError message={fieldError} className="mt-2" />
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                size="md"
                className="sm:w-auto"
                onClick={() => {
                  setView("status");
                  setSetupData(null);
                  setVerifyCode(Array(6).fill(""));
                  setFieldError("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="md"
                className="sm:w-auto"
                loading={loading}
              >
                Verify & Enable
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Disable MFA view
  if (view === "disable") {
    return (
      <div className={`${cardClass} mx-auto max-w-[480px]`}>
        <h2 className="mb-6 text-body font-semibold text-content-primary">
          Disable Two-Factor Authentication
        </h2>

        <form onSubmit={handleDisable} className="space-y-4">
          <AlertBox variant="warning">
            Disabling MFA will make your account less secure. You will need your
            password to confirm.
          </AlertBox>

          <Input
            label="Confirm Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setFieldError("");
              setFieldError("");
              setPassword(e.target.value);
            }}
            placeholder="Enter your password"
            error={fieldError || undefined}
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="md"
              className="sm:w-auto"
              onClick={() => {
                setView("status");
                setPassword("");
                setFieldError("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              className="sm:w-auto"
              loading={loading}
            >
              Disable MFA
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Regenerate recovery codes view
  if (view === "regenerate") {
    return (
      <div className={`${cardClass} mx-auto max-w-[480px]`}>
        <h2 className="mb-6 text-body font-semibold text-content-primary">
          Regenerate Recovery Codes
        </h2>

        <form onSubmit={handleRegenerate} className="space-y-4">
          <AlertBox variant="warning">
            This will invalidate all existing recovery codes. Make sure to save
            the new ones.
          </AlertBox>

          <Input
            label="Confirm Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setFieldError("");
              setFieldError("");
              setPassword(e.target.value);
            }}
            placeholder="Enter your password"
            error={fieldError || undefined}
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="md"
              className="sm:w-auto"
              onClick={() => {
                setView("status");
                setPassword("");
                setFieldError("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="md"
              className="sm:w-auto"
              loading={loading}
            >
              Regenerate
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Default: Status view
  return (
    <div className={cardClass}>
      {!bare && (
        <h2 className="mb-6 text-body font-semibold text-content-primary">
          Two-Factor Authentication
        </h2>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {mfaEnabled ? (
              <ShieldCheck size={16} className="text-success" />
            ) : (
              <Shield size={16} className="text-content-tertiary" />
            )}
            <div>
              <p
                className={`text-body font-semibold ${mfaEnabled ? "text-success" : "text-content-tertiary"}`}
              >
                {mfaEnabled ? "MFA is enabled" : "MFA is not enabled"}
              </p>
              <p className="text-caption text-content-secondary">
                {mfaEnabled
                  ? `${status?.recoveryCodesRemaining ?? "?"} recovery codes remaining`
                  : "Add an extra layer of security to your account"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {mfaEnabled ? (
              <>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setFieldError("");
                    setView("regenerate");
                  }}
                >
                  <RefreshCw size={16} />
                  Regenerate Codes
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setFieldError("");
                    setView("disable");
                  }}
                >
                  <ShieldOff size={16} />
                  Disable MFA
                </Button>
              </>
            ) : (
              <Button size="md" loading={loading} onClick={handleSetup}>
                <Shield size={16} />
                Enable MFA
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
