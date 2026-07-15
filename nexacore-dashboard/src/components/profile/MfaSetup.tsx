"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, ShieldCheck, ShieldOff, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import Button from "@/components/ui/Button";
import InlineError from "@/components/ui/InlineError";
import Input from "@/components/ui/Input";
import MfaDigitInput from "@/components/ui/MfaDigitInput";
import AlertBox from "@/components/ui/AlertBox";
import QrCodeCard from "@/components/ui/QrCodeCard";
import RecoveryCodesGrid from "@/components/ui/RecoveryCodesGrid";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { MfaSetupResponse, MfaStatusResponse } from "@/lib/types";

type MfaModal = null | "setup" | "recovery-codes" | "disable" | "regenerate";

export default function MfaSetup({ bare }: { bare?: boolean }) {
  const cardClass = bare
    ? ""
    : "h-full rounded-xl border border-line-strong bg-surface-primary p-6";
  const { user, refreshSession } = useAuth();
  const { addToast } = useToast();

  const [modal, setModal] = useState<MfaModal>(null);
  const [status, setStatus] = useState<MfaStatusResponse | null>(null);
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState<string[]>(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiClient.get<MfaStatusResponse>("/auth/mfa/status");
      setStatus(data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const closeModal = () => {
    setModal(null);
    setSetupData(null);
    setVerifyCode(Array(6).fill(""));
    setPassword("");
    setFieldError("");
  };

  const handleSetup = async () => {
    setLoading(true);
    try {
      const data = await apiClient.post<MfaSetupResponse>(
        "/auth/mfa/setup",
        {},
      );
      setSetupData(data);
      setRecoveryCodes(data.recoveryCodes);
      setModal("setup");
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
      setModal("recovery-codes");
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

  const handleDisable = async () => {
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
      closeModal();
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

  const handleRegenerate = async () => {
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
      setModal("recovery-codes");
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

  const mfaEnabled = user?.mfaEnabled || status?.mfaEnabled;

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
                    setModal("regenerate");
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
                    setModal("disable");
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

      {/* Setup Modal — QR code + verification */}
      <ConfirmModal
        open={modal === "setup"}
        onClose={closeModal}
        onConfirm={() => {
          const code = verifyCode.join("");
          if (code.length === 6) submitVerifyCode(code);
          else setFieldError("Enter all 6 digits");
        }}
        title="Set Up Two-Factor Authentication"
        description="Scan the QR code with your authenticator app, then enter the verification code."
        confirmLabel="Verify & Enable"
        size="lg"
        loading={loading}
      >
        {setupData && (
          <div className="mt-4 space-y-4">
            <QrCodeCard
              qrDataUrl={setupData.qrCodeDataUrl}
              secret={setupData.secret}
            />
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
          </div>
        )}
      </ConfirmModal>

      {/* Recovery Codes Modal */}
      <ConfirmModal
        open={modal === "recovery-codes"}
        onClose={() => {
          setModal(null);
          setRecoveryCodes([]);
        }}
        onConfirm={() => {
          setModal(null);
          setRecoveryCodes([]);
        }}
        title="Recovery Codes"
        description="Save these codes in a secure location. Each code can only be used once."
        confirmLabel="Done"
        size="md"
      >
        <div className="mt-4 space-y-4">
          <AlertBox variant="warning">
            If you lose access to your authenticator app, you can use these
            codes to sign in.
          </AlertBox>
          <RecoveryCodesGrid codes={recoveryCodes} />
        </div>
      </ConfirmModal>

      {/* Disable MFA Modal */}
      <ConfirmModal
        open={modal === "disable"}
        onClose={closeModal}
        onConfirm={handleDisable}
        title="Disable Two-Factor Authentication"
        description="Disabling MFA will make your account less secure."
        confirmLabel="Disable MFA"
        variant="danger"
        size="md"
        loading={loading}
      >
        <div className="mt-4 space-y-4">
          <AlertBox variant="warning">
            You will need your password to confirm this action.
          </AlertBox>
          <Input
            label="Confirm Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setFieldError("");
              setPassword(e.target.value);
            }}
            placeholder="Enter your password"
            error={fieldError || undefined}
          />
        </div>
      </ConfirmModal>

      {/* Regenerate Recovery Codes Modal */}
      <ConfirmModal
        open={modal === "regenerate"}
        onClose={closeModal}
        onConfirm={handleRegenerate}
        title="Regenerate Recovery Codes"
        description="This will invalidate all existing recovery codes."
        confirmLabel="Regenerate"
        size="md"
        loading={loading}
      >
        <div className="mt-4 space-y-4">
          <AlertBox variant="warning">
            Make sure to save the new codes. Your current codes will stop
            working.
          </AlertBox>
          <Input
            label="Confirm Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setFieldError("");
              setPassword(e.target.value);
            }}
            placeholder="Enter your password"
            error={fieldError || undefined}
          />
        </div>
      </ConfirmModal>
    </div>
  );
}
