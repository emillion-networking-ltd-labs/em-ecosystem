"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  ShieldCheck,
  Laptop,
  Smartphone,
  Trash2,
  Plus,
} from "lucide-react";
import { useTrustedDevices } from "@/hooks/useTrustedDevices";
import { useToast } from "@/context/ToastContext";
import { useNow } from "@/hooks/useNow";
import { PROFILE_TOAST, AUTH_TOAST } from "@/lib/toast-messages";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Input from "@/components/ui/Input";
import RateLimitBanner from "@/components/ui/RateLimitBanner";
import Spinner from "@/components/ui/Spinner";
import { useRateLimit } from "@/hooks/useRateLimit";
import type { TrustedDeviceResponse } from "@/lib/types";

function isMobileDevice(name: string): boolean {
  return /mobile|android|iphone|ipad|phone/i.test(name);
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TrustedDevices({ bare }: { bare?: boolean }) {
  const {
    devices,
    isLoading,
    fetchDevices,
    trustCurrentDevice,
    revokeDevice,
    revokeAllDevices,
  } = useTrustedDevices();

  const { addToast } = useToast();
  const { rateLimitInfo, setRateLimit, clearRateLimit } = useRateLimit();
  // Re-render every 30 s so 'X min ago' / 'Expires Y' captions tick forward.
  useNow();

  // Trust modal
  const [trustModalOpen, setTrustModalOpen] = useState(false);
  const [trustPassword, setTrustPassword] = useState("");
  const [trustFieldError, setTrustFieldError] = useState("");
  const [isTrusting, setIsTrusting] = useState(false);

  // Revoke single modal
  const [revokeTarget, setRevokeTarget] =
    useState<TrustedDeviceResponse | null>(null);
  const [revokePassword, setRevokePassword] = useState("");
  const [revokeFieldError, setRevokeFieldError] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  // Revoke all modal
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [revokeAllPassword, setRevokeAllPassword] = useState("");
  const [revokeAllFieldError, setRevokeAllFieldError] = useState("");
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  // Block enter animations until first fetch completes
  const allowAnimations = useRef(false);
  useEffect(() => {
    fetchDevices().then(() => {
      // Enable animations after a tick so the first render doesn't animate
      requestAnimationFrame(() => {
        allowAnimations.current = true;
      });
    });
  }, [fetchDevices]);

  const closeTrustModal = () => {
    setTrustModalOpen(false);
    setTrustPassword("");
    setTrustFieldError("");
  };

  const closeRevokeModal = () => {
    setRevokeTarget(null);
    setRevokePassword("");
    setRevokeFieldError("");
  };

  const closeRevokeAllModal = () => {
    setShowRevokeAll(false);
    setRevokeAllPassword("");
    setRevokeAllFieldError("");
  };

  const handleTrust = async () => {
    if (!trustPassword) {
      setTrustFieldError("Enter your password");
      return;
    }
    setTrustFieldError("");
    setIsTrusting(true);
    const result = await trustCurrentDevice(trustPassword);
    setIsTrusting(false);

    if (result === "trusted") {
      addToast(PROFILE_TOAST.DEVICE_TRUSTED);
      closeTrustModal();
    } else if (result === "already") {
      addToast(PROFILE_TOAST.DEVICE_ALREADY_TRUSTED);
      closeTrustModal();
    } else if (result === "invalid-password") {
      // Backend 401 → toast (per feedback_toast_only_for_backend_errors.md).
      // Modal stays open; field retains the wrong value so the user can edit.
      addToast(PROFILE_TOAST.DEVICE_TRUST_INVALID_PASSWORD);
    } else if (typeof result === "object" && result.status === "rate-limited") {
      // SCRUM-349 sub-task 1: toast alongside the existing inline banner.
      addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC());
      setRateLimit(result.retryAfter, "Too many attempts.", "throttle");
      closeTrustModal();
    } else {
      addToast(PROFILE_TOAST.DEVICE_TRUST_FAILED);
      closeTrustModal();
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    if (!revokePassword) {
      setRevokeFieldError("Enter your password");
      return;
    }
    setRevokeFieldError("");
    setIsRevoking(true);
    const result = await revokeDevice(revokeTarget.id, revokePassword);
    setIsRevoking(false);

    if (result === true) {
      addToast(PROFILE_TOAST.DEVICE_REVOKED);
      closeRevokeModal();
    } else if (result === "invalid-password") {
      // Backend 401 → toast. Modal stays open so the user can retry.
      addToast(PROFILE_TOAST.DEVICE_REVOKE_INVALID_PASSWORD);
    } else if (typeof result === "object" && result.status === "rate-limited") {
      // SCRUM-327: rate-limited → toast + banner + close modal (matches Trust).
      addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC());
      setRateLimit(result.retryAfter, "Too many attempts.", "throttle");
      closeRevokeModal();
    } else {
      addToast(PROFILE_TOAST.DEVICE_REVOKE_FAILED);
      closeRevokeModal();
    }
  };

  const handleRevokeAll = async () => {
    if (!revokeAllPassword) {
      setRevokeAllFieldError("Enter your password");
      return;
    }
    setRevokeAllFieldError("");
    setIsRevokingAll(true);
    const result = await revokeAllDevices(revokeAllPassword);
    setIsRevokingAll(false);

    if (result === true) {
      addToast(PROFILE_TOAST.DEVICE_REVOKED);
      closeRevokeAllModal();
    } else if (result === "invalid-password") {
      // Backend 401 → toast. Modal stays open.
      addToast(PROFILE_TOAST.DEVICE_REVOKE_INVALID_PASSWORD);
    } else if (typeof result === "object" && result.status === "rate-limited") {
      // SCRUM-327: rate-limited → toast + banner + close modal.
      addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC());
      setRateLimit(result.retryAfter, "Too many attempts.", "throttle");
      closeRevokeAllModal();
    } else {
      addToast(PROFILE_TOAST.DEVICE_REVOKE_FAILED);
      closeRevokeAllModal();
    }
  };

  return (
    <div
      className={
        bare
          ? ""
          : "h-full rounded-xl border border-line-strong bg-surface-primary p-6"
      }
    >
      {!bare && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-content-secondary" />
            <h2 className="text-body font-semibold text-content-primary">
              Trusted Devices
            </h2>
            {devices.length > 0 && (
              <Badge variant="info" size="sm">
                {devices.length}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && devices.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && devices.length === 0 && (
        <EmptyState
          icon={<ShieldCheck size={48} />}
          title="No trusted devices"
          description="When you log in with MFA and trust this device, it appears here."
          action={
            <Button
              variant="primary"
              size="md"
              fullWidth={false}
              disabled={rateLimitInfo.isRateLimited}
              onClick={() => {
                setTrustPassword("");
                setTrustFieldError("");
                setTrustModalOpen(true);
              }}
            >
              <Plus size={16} />
              Trust This Device
            </Button>
          }
        />
      )}

      {/* Device list */}
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {devices.map((device) => (
            <motion.div
              key={device.id}
              initial={
                allowAnimations.current
                  ? { opacity: 0, scale: 0.96, y: -8 }
                  : false
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col gap-3 rounded-xl border border-line-control p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary">
                  {isMobileDevice(device.deviceName) ? (
                    <Smartphone size={24} className="text-content-secondary" />
                  ) : (
                    <Laptop size={24} className="text-content-secondary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-body font-normal text-content-primary">
                    {device.deviceName}
                  </p>
                  <p className="mt-0.5 text-caption text-content-tertiary">
                    {device.ipAddress}
                    <span className="text-content-disabled"> · </span>
                    {formatRelativeTime(device.lastVerifiedAt)}
                    <span className="text-content-disabled"> · </span>
                    Expires {formatDate(device.expiresAt)}
                  </p>
                </div>
              </div>
              <div className="flex justify-center sm:justify-end">
                <IconButton
                  variant="danger"
                  size="sm"
                  tooltip
                  icon={Trash2}
                  disabled={rateLimitInfo.isRateLimited}
                  onClick={() => {
                    setRevokePassword("");
                    setRevokeFieldError("");
                    setRevokeTarget(device);
                  }}
                  aria-label={`Revoke trust for ${device.deviceName}`}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Action buttons — only when devices exist (empty state renders its own Trust action) */}
      {devices.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="primary"
            size="md"
            disabled={rateLimitInfo.isRateLimited}
            onClick={() => {
              setTrustPassword("");
              setTrustFieldError("");
              setTrustModalOpen(true);
            }}
            className="sm:w-auto"
          >
            <Plus size={16} />
            Trust This Device
          </Button>
          <Button
            variant="danger"
            size="md"
            className="sm:w-auto"
            disabled={rateLimitInfo.isRateLimited}
            onClick={() => {
              setRevokeAllPassword("");
              setRevokeAllFieldError("");
              setShowRevokeAll(true);
            }}
          >
            Revoke All
          </Button>
        </div>
      )}

      {/* Rate limit banner — below buttons */}
      {rateLimitInfo.isRateLimited && rateLimitInfo.retryAfter && (
        <div className="mt-3">
          <RateLimitBanner
            retryAfter={rateLimitInfo.retryAfter}
            message="Too many attempts."
            onExpired={clearRateLimit}
          />
        </div>
      )}

      {/* Trust device modal */}
      <ConfirmModal
        open={trustModalOpen}
        onClose={closeTrustModal}
        onConfirm={handleTrust}
        title="Trust This Device"
        description="This device will skip MFA on future logins. Confirm with your password."
        confirmLabel="Trust Device"
        size="md"
        loading={isTrusting}
      >
        <div className="mt-4">
          <Input
            label="Confirm with your password"
            type="password"
            name="trust-device-password"
            value={trustPassword}
            onChange={(e) => {
              setTrustPassword(e.target.value);
              setTrustFieldError("");
            }}
            placeholder="Enter your password"
            error={trustFieldError || undefined}
            autoFocus
          />
        </div>
      </ConfirmModal>

      {/* Revoke single device modal */}
      <ConfirmModal
        open={!!revokeTarget}
        onClose={closeRevokeModal}
        onConfirm={handleRevoke}
        title="Revoke Device Trust"
        description="This device will require MFA verification on next login."
        confirmLabel="Revoke"
        variant="danger"
        size="md"
        loading={isRevoking}
      >
        <div className="mt-4">
          <Input
            label="Confirm with your password"
            type="password"
            name="revoke-device-password"
            value={revokePassword}
            onChange={(e) => {
              setRevokePassword(e.target.value);
              setRevokeFieldError("");
            }}
            placeholder="Enter your password"
            error={revokeFieldError || undefined}
            autoFocus
          />
        </div>
      </ConfirmModal>

      {/* Revoke all devices modal */}
      <ConfirmModal
        open={showRevokeAll}
        onClose={closeRevokeAllModal}
        onConfirm={handleRevokeAll}
        title="Revoke All Devices"
        description={`All devices will require MFA verification on next login. ${devices.length} device${devices.length !== 1 ? "s" : ""} will be affected.`}
        confirmLabel="Revoke All"
        variant="danger"
        size="md"
        loading={isRevokingAll}
      >
        <div className="mt-4">
          <Input
            label="Confirm with your password"
            type="password"
            name="revoke-all-devices-password"
            value={revokeAllPassword}
            onChange={(e) => {
              setRevokeAllPassword(e.target.value);
              setRevokeAllFieldError("");
            }}
            placeholder="Enter your password"
            error={revokeAllFieldError || undefined}
            autoFocus
          />
        </div>
      </ConfirmModal>
    </div>
  );
}
