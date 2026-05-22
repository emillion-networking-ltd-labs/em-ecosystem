"use client";

import { useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import InlineError from "@/components/ui/InlineError";
import MfaDigitInput from "@/components/ui/MfaDigitInput";
import RateLimitBanner from "@/components/ui/RateLimitBanner";
import { useAuth } from "@/hooks/useAuth";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useToast } from "@/hooks/useToast";
import { AUTH_TOAST } from "@/lib/toast-messages";
import { RateLimitError } from "@/lib/types";

/**
 * MfaTotpStepV2 — MFA challenge UI for the AuthIntent v2 login flow.
 *
 * SCRUM-499 / AUTH v2 Phase 2.3. Pixel-equivalent to v1 MfaTotpStep with the
 * only differences:
 *   - calls `useAuth().advanceMfaV2(code, recoveryCode)` instead of `verifyMfaLogin()`
 *   - calls `useAuth().cancelAuthIntentV2()` instead of `cancelMfa()`
 *   - omits the "Trust this device" checkbox (not yet plumbed through AuthIntent;
 *     reserved for Phase 3 alongside passkey-first reframing)
 *
 * Visual parity: same 330/348 column layout, same MfaDigitInput, same recovery
 * toggle, same outline-Cancel + primary-Verify buttons.
 */
export default function MfaTotpStepV2() {
  const { advanceMfaV2, cancelAuthIntentV2, isLoading, error, clearError } =
    useAuth();
  const { rateLimitInfo, setRateLimit, clearRateLimit } = useRateLimit();
  const { addToast } = useToast();
  const showRateLimit = rateLimitInfo.isRateLimited;
  const showError = !showRateLimit && !!error;
  const isDisabled = isLoading || rateLimitInfo.isRateLimited;
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");

  const handleVerify = useCallback(
    async (codeStr: string, isRecovery: boolean) => {
      try {
        if (isRecovery) {
          await advanceMfaV2(undefined, codeStr);
        } else {
          await advanceMfaV2(codeStr, undefined);
        }
      } catch (err) {
        if (err instanceof RateLimitError) {
          setRateLimit(err.retryAfter, err.message);
          addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC());
        }
      }
    },
    [advanceMfaV2, setRateLimit, addToast],
  );

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim()) return;
    handleVerify(recoveryCode.trim(), true);
  };

  const handleTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const full = code.join("");
    if (full.length !== 6) return;
    handleVerify(full, false);
  };

  if (useRecovery) {
    return (
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex w-full flex-col gap-2 md:w-[330px]">
          <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
            <h1 className="text-h1 font-semibold text-content-primary">
              Recovery Code
            </h1>
            <p className="text-justify text-body text-content-secondary">
              Enter one of your recovery codes. Each code can only be used once.
            </p>
          </div>
        </div>

        <div className="w-full md:w-[348px]">
          <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-2">
            <div className="flex min-h-[116px] flex-col gap-2">
              <Input
                label="Recovery Code"
                type="text"
                value={recoveryCode}
                onChange={(e) => {
                  clearError();
                  setRecoveryCode(e.target.value);
                }}
                placeholder="xxxx-xxxx-xxxx"
                className="font-mono"
                autoFocus
              />

              {showRateLimit ? (
                <RateLimitBanner
                  retryAfter={rateLimitInfo.retryAfter!}
                  message={rateLimitInfo.message!}
                  onExpired={clearRateLimit}
                />
              ) : (
                <div
                  aria-live="polite"
                  className={showError ? "min-h-6" : "h-6"}
                >
                  {showError && <InlineError message={error!} />}
                </div>
              )}

              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="link-underline"
                  size="md"
                  fullWidth={false}
                  onClick={() => {
                    clearError();
                    clearRateLimit();
                    setUseRecovery(false);
                    setRecoveryCode("");
                  }}
                >
                  <ArrowLeft size={14} />
                  Use authenticator app
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelAuthIntentV2}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isDisabled || !recoveryCode.trim()}
                loading={isLoading}
                className="flex-1"
              >
                Verify
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="flex w-full flex-col gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-h1 font-semibold text-content-primary">
            Two-Factor Authentication
          </h1>
          <p className="text-justify text-body text-content-secondary">
            Enter the 6-digit code from your authenticator app to complete sign
            in.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[348px]">
        <form onSubmit={handleTotpSubmit} className="flex flex-col gap-2">
          <div className="flex min-h-[116px] flex-col gap-2">
            <label
              htmlFor="totp-digit-0"
              className="text-body font-semibold leading-[22px] text-content-primary"
            >
              Verification Code
            </label>

            <MfaDigitInput
              value={code}
              onChange={(v) => {
                clearError();
                setCode(v);
              }}
              onComplete={(full) => handleVerify(full, false)}
              idPrefix="totp-digit"
              autoFocus
            />

            {showRateLimit ? (
              <RateLimitBanner
                retryAfter={rateLimitInfo.retryAfter!}
                message={rateLimitInfo.message!}
                onExpired={clearRateLimit}
              />
            ) : (
              <div aria-live="polite" className={showError ? "min-h-6" : "h-6"}>
                {showError && <InlineError message={error!} />}
              </div>
            )}

            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="link-underline"
                size="md"
                fullWidth={false}
                onClick={() => {
                  clearError();
                  clearRateLimit();
                  setUseRecovery(true);
                  setCode(Array(6).fill(""));
                }}
              >
                Use recovery code
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelAuthIntentV2}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isDisabled || code.join("").length !== 6}
              loading={isLoading}
              className="flex-1"
            >
              Verify
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
