"use client";

import { useEffect, useRef, useState } from "react";
import { Shield, Laptop, Smartphone, Trash2, Plus } from "lucide-react";
import { useTrustedDevices } from "@/hooks/useTrustedDevices";
import { useToast } from "@/context/ToastContext";
import { PROFILE_TOAST } from "@/lib/toast-messages";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";
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

  const [isTrusting, setIsTrusting] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const prevDeviceIds = useRef<Set<string>>(new Set());
  const [revokeTarget, setRevokeTarget] =
    useState<TrustedDeviceResponse | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Detect new device added to list
  useEffect(() => {
    const currentIds = new Set(devices.map((d) => d.id));
    if (prevDeviceIds.current.size > 0) {
      const added = devices.find((d) => !prevDeviceIds.current.has(d.id));
      if (added) {
        setNewDeviceId(added.id);
        setTimeout(() => setNewDeviceId(null), 1000);
      }
    }
    prevDeviceIds.current = currentIds;
  }, [devices]);

  const handleTrust = async () => {
    setIsTrusting(true);
    const ok = await trustCurrentDevice();
    setIsTrusting(false);
    if (ok) {
      addToast(PROFILE_TOAST.DEVICE_TRUSTED);
    } else {
      addToast(PROFILE_TOAST.DEVICE_REVOKE_FAILED);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    const targetId = revokeTarget.id;
    setRevokeTarget(null);
    setRemovingId(targetId);
    // Animate out first, then revoke
    await new Promise((r) => setTimeout(r, 500));
    setIsRevoking(true);
    const ok = await revokeDevice(targetId);
    setIsRevoking(false);
    setRemovingId(null);
    if (ok) {
      addToast(PROFILE_TOAST.DEVICE_REVOKED);
    } else {
      addToast(PROFILE_TOAST.DEVICE_REVOKE_FAILED);
    }
  };

  const handleRevokeAll = async () => {
    setIsRevokingAll(true);
    const ok = await revokeAllDevices();
    setIsRevokingAll(false);
    setShowRevokeAll(false);
    if (ok) {
      addToast(PROFILE_TOAST.DEVICE_REVOKED);
    } else {
      addToast(PROFILE_TOAST.DEVICE_REVOKE_FAILED);
    }
  };

  return (
    <div
      className={
        bare
          ? ""
          : "h-full rounded-xl border border-border-strong bg-surface-primary p-6"
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
          <Spinner size="md" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && devices.length === 0 && (
        <p className="py-4 text-center text-body text-content-secondary">
          No trusted devices. When you log in with MFA and trust a device, it
          will appear here.
        </p>
      )}

      {/* Device list */}
      {devices.length > 0 && (
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`flex items-center justify-between rounded-xl border border-border-components p-4 ${
                device.id === newDeviceId
                  ? "animate-slide-in-fade"
                  : device.id === removingId
                    ? "animate-slide-out-fade"
                    : ""
              }`}
            >
              <div className="flex items-center gap-3">
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
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-caption text-content-secondary">
                    <span>{device.ipAddress}</span>
                    <span>
                      Last verified: {formatRelativeTime(device.lastVerifiedAt)}
                    </span>
                    <span>Expires: {formatDate(device.expiresAt)}</span>
                  </div>
                </div>
              </div>
              <IconButton
                variant="danger"
                size="sm"
                onClick={() => setRevokeTarget(device)}
                aria-label={`Revoke trust for ${device.deviceName}`}
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="primary"
          size="md"
          loading={isTrusting}
          onClick={handleTrust}
          className="sm:w-auto"
        >
          <Plus size={16} />
          Trust This Device
        </Button>
        {devices.length > 0 && (
          <Button
            variant="danger"
            size="md"
            className="sm:w-auto"
            onClick={() => setShowRevokeAll(true)}
          >
            Revoke All
          </Button>
        )}
      </div>

      {/* Revoke single device modal */}
      <ConfirmModal
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke Device Trust"
        description="This device will require MFA verification on next login."
        confirmLabel="Revoke"
        variant="danger"
        loading={isRevoking}
      />

      {/* Revoke all devices modal */}
      <ConfirmModal
        open={showRevokeAll}
        onClose={() => setShowRevokeAll(false)}
        onConfirm={handleRevokeAll}
        title="Revoke All Devices"
        description={`All devices will require MFA verification on next login. ${devices.length} device${devices.length !== 1 ? "s" : ""} will be affected.`}
        confirmLabel="Revoke All"
        variant="danger"
        loading={isRevokingAll}
      />
    </div>
  );
}
