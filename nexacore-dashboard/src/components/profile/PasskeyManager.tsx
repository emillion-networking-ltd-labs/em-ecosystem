"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Smartphone,
  Monitor,
  Pencil,
  Trash2,
  Plus,
  ShieldCheck,
} from "lucide-react";
import AlertBox from "@/components/ui/AlertBox";
import { usePasskey } from "@/hooks/usePasskey";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useNow } from "@/hooks/useNow";
import { useToast } from "@/context/ToastContext";
import { PROFILE_TOAST, AUTH_TOAST } from "@/lib/toast-messages";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/Input";
import ConfirmModal from "@/components/ui/ConfirmModal";
import RateLimitBanner from "@/components/ui/RateLimitBanner";
import Spinner from "@/components/ui/Spinner";
import type { PasskeyResponse } from "@/lib/types";

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function DeviceIcon({ deviceType }: { deviceType: string }) {
  return deviceType === "multiDevice" ? (
    <Smartphone size={24} className="text-content-secondary" />
  ) : (
    <Monitor size={24} className="text-content-secondary" />
  );
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -8 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -8 },
};

function PasskeyItem({
  passkey,
  onRename,
  onDelete,
  isNew,
  isRateLimited,
}: {
  passkey: PasskeyResponse;
  onRename: (pk: PasskeyResponse) => void;
  onDelete: (pk: PasskeyResponse) => void;
  isNew: boolean;
  isRateLimited: boolean;
}) {
  return (
    <motion.div
      variants={itemVariants}
      initial={isNew ? "hidden" : false}
      animate="visible"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="flex items-center justify-between rounded-xl border border-border-components p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-tertiary">
          <DeviceIcon deviceType={passkey.deviceType} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-body font-normal text-content-primary">
              {passkey.name || "Passkey"}
            </span>
            {passkey.backedUp && (
              <Badge variant="success" size="sm">
                Synced
              </Badge>
            )}
          </div>
          <span className="text-caption text-content-secondary">
            Last used: {formatRelativeTime(passkey.lastUsedAt)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <IconButton
          size="sm"
          tooltip
          disabled={isRateLimited}
          onClick={() => onRename(passkey)}
          aria-label={`Rename ${passkey.name || "passkey"}`}
        >
          <Pencil size={16} />
        </IconButton>
        <IconButton
          variant="danger"
          size="sm"
          tooltip
          disabled={isRateLimited}
          onClick={() => onDelete(passkey)}
          aria-label={`Delete ${passkey.name || "passkey"}`}
        >
          <Trash2 size={16} />
        </IconButton>
      </div>
    </motion.div>
  );
}

export default function PasskeyManager({ bare }: { bare?: boolean }) {
  const {
    isSupported,
    passkeys,
    isLoadingList,
    fetchPasskeys,
    registerPasskey,
    isRegistering,
    renamePasskey,
    deletePasskey,
    clearError,
  } = usePasskey();

  const { addToast } = useToast();
  // SCRUM-327: rate-limit state owned by the component (matches the
  // TrustedDevices pattern). Hooks return discriminator on 429; component
  // dispatches toast + setRateLimit + closeModal.
  const { rateLimitInfo, setRateLimit, clearRateLimit } = useRateLimit();
  // Re-render every 30 s so 'Last used: Xm ago' captions tick forward.
  useNow();

  const [registerOpen, setRegisterOpen] = useState(false);
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFieldError, setRegFieldError] = useState("");

  // Rename state
  const [renamingPasskey, setRenamingPasskey] =
    useState<PasskeyResponse | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete state
  const [deletingPasskey, setDeletingPasskey] =
    useState<PasskeyResponse | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteFieldError, setDeleteFieldError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Block enter animations until first fetch completes
  const allowAnimations = useRef(false);
  useEffect(() => {
    fetchPasskeys().then(() => {
      requestAnimationFrame(() => {
        allowAnimations.current = true;
      });
    });
  }, [fetchPasskeys]);

  const handleRegister = async () => {
    clearError();
    if (!regPassword) {
      setRegFieldError("Enter your password");
      return;
    }
    setRegFieldError("");
    const result = await registerPasskey(
      regPassword,
      regName.trim() || undefined,
    );
    if (result === "invalid-password") {
      // Backend 401 → action-specific toast. Modal stays open.
      addToast(PROFILE_TOAST.PASSKEY_REGISTER_INVALID_PASSWORD);
      return;
    }
    if (
      result &&
      typeof result === "object" &&
      "status" in result &&
      result.status === "rate-limited"
    ) {
      // SCRUM-327: rate-limited → toast + banner + close modal. Single source
      // of truth via useRateLimit.
      addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC());
      setRateLimit(result.retryAfter, "Too many attempts.", "throttle");
      setRegisterOpen(false);
      setRegName("");
      setRegPassword("");
      setRegFieldError("");
      return;
    }
    if (result) {
      setRegisterOpen(false);
      setRegName("");
      setRegPassword("");
      setRegFieldError("");
      // Wait for modal to close, then fetch so the new item animates in
      setTimeout(async () => {
        await fetchPasskeys();
        addToast(PROFILE_TOAST.PASSKEY_REGISTERED);
      }, 350);
    } else {
      addToast(
        PROFILE_TOAST.PASSKEY_FAILED(
          "Passkey registration failed. Please try again.",
        ),
      );
    }
  };

  const handleRenameSubmit = async () => {
    if (!renamingPasskey || !renameValue.trim()) return;
    setIsRenaming(true);
    const ok = await renamePasskey(renamingPasskey.id, renameValue.trim());
    setIsRenaming(false);
    if (ok) {
      addToast(PROFILE_TOAST.PASSKEY_RENAMED);
      setRenamingPasskey(null);
    } else {
      addToast(PROFILE_TOAST.PASSKEY_FAILED("Failed to rename passkey."));
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingPasskey) return;
    if (!deletePassword.trim()) {
      setDeleteFieldError("Enter your password");
      return;
    }
    setDeleteFieldError("");
    setIsDeleting(true);
    const result = await deletePasskey(deletingPasskey.id, deletePassword);
    setIsDeleting(false);
    if (!result) {
      addToast(PROFILE_TOAST.PASSKEY_DELETED);
      setDeletingPasskey(null);
      setDeletePassword("");
    } else if (result === "invalid-password") {
      // Backend 401 → action-specific toast. Modal stays open.
      addToast(PROFILE_TOAST.PASSKEY_DELETE_INVALID_PASSWORD);
    } else if (
      typeof result === "object" &&
      "status" in result &&
      result.status === "rate-limited"
    ) {
      // SCRUM-327: rate-limited → toast + banner + close modal.
      addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC());
      setRateLimit(result.retryAfter, "Too many attempts.", "throttle");
      setDeletingPasskey(null);
      setDeletePassword("");
    } else if (typeof result === "string") {
      // Generic error message from server.
      addToast(PROFILE_TOAST.PASSKEY_FAILED(result));
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
            <Key size={16} className="text-content-secondary" />
            <h2 className="text-body font-semibold text-content-primary">
              Passkeys
            </h2>
          </div>
          {passkeys.length > 0 && (
            <div className="flex items-center gap-1.5 text-caption text-success">
              <ShieldCheck size={16} />
              <span>{passkeys.length} registered</span>
            </div>
          )}
        </div>
      )}

      {/* Browser support warning */}
      {!isSupported && (
        <AlertBox variant="warning">
          <p className="text-body font-normal text-content-primary">
            Passkeys not supported
          </p>
          <p className="mt-1 text-caption text-content-secondary">
            Your browser does not support WebAuthn. Use a modern browser like
            Chrome, Edge, Safari, or Firefox.
          </p>
        </AlertBox>
      )}

      {/* Loading */}
      {isLoadingList && passkeys.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Passkey list — always visible */}
      {isSupported && (
        <>
          {!isLoadingList && passkeys.length === 0 && (
            <EmptyState
              icon={<Key size={48} />}
              title="No passkeys registered"
              description="Add a passkey for faster, more secure sign-in using biometrics or your device."
              action={
                <Button
                  variant="primary"
                  size="md"
                  fullWidth={false}
                  onClick={() => {
                    clearError();
                    setRegName("");
                    setRegPassword("");
                    setRegFieldError("");
                    setRegisterOpen(true);
                  }}
                  disabled={rateLimitInfo.isRateLimited}
                >
                  <Plus size={16} />
                  Add Passkey
                </Button>
              }
            />
          )}

          {passkeys.length > 0 && (
            <>
              <div className="mb-4 flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {passkeys.map((pk) => (
                    <PasskeyItem
                      key={pk.id}
                      passkey={pk}
                      isNew={allowAnimations.current}
                      isRateLimited={rateLimitInfo.isRateLimited}
                      onRename={(p) => {
                        clearError();
                        setRenameValue(p.name || "");
                        setRenamingPasskey(p);
                      }}
                      onDelete={(p) => {
                        clearError();
                        setDeletePassword("");
                        setDeletingPasskey(p);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  clearError();
                  setRegName("");
                  setRegPassword("");
                  setRegFieldError("");
                  setRegisterOpen(true);
                }}
                disabled={passkeys.length >= 10 || rateLimitInfo.isRateLimited}
                className="sm:w-auto"
              >
                <Plus size={16} />
                Add Passkey
              </Button>

              {passkeys.length >= 10 && (
                <p className="mt-2 text-caption text-content-secondary">
                  Maximum of 10 passkeys reached. Remove one before adding
                  another.
                </p>
              )}
            </>
          )}

          {rateLimitInfo.isRateLimited && rateLimitInfo.retryAfter && (
            <div className="mt-3">
              <RateLimitBanner
                retryAfter={rateLimitInfo.retryAfter}
                message="Too many attempts."
                onExpired={clearRateLimit}
              />
            </div>
          )}
        </>
      )}

      {/* Register Modal */}
      <ConfirmModal
        open={registerOpen}
        onClose={() => {
          setRegisterOpen(false);
          setRegFieldError("");
        }}
        onConfirm={handleRegister}
        title="Add Passkey"
        size="md"
        description="Confirm with your password, then follow the biometric prompt to register the new passkey."
        confirmLabel="Register Passkey"
        loading={isRegistering}
      >
        <div className="mt-4 flex flex-col gap-3">
          <Input
            label="Confirm with your password"
            type="password"
            name="passkey-password"
            value={regPassword}
            onChange={(e) => {
              setRegPassword(e.target.value);
              setRegFieldError("");
            }}
            placeholder="Enter your password"
            error={regFieldError || undefined}
            disabled={isRegistering}
            autoFocus
          />
          <Input
            label="Passkey name (optional)"
            name="passkey-name"
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
            placeholder="e.g. My MacBook"
            maxLength={64}
            disabled={isRegistering}
          />
        </div>
      </ConfirmModal>

      {/* Rename Modal */}
      <ConfirmModal
        open={!!renamingPasskey}
        onClose={() => setRenamingPasskey(null)}
        onConfirm={handleRenameSubmit}
        title="Rename Passkey"
        size="md"
        description={`Enter a new name for "${renamingPasskey?.name || "Passkey"}".`}
        confirmLabel="Save"
        loading={isRenaming}
      >
        <div className="mt-4">
          <Input
            name="rename-passkey"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="New name"
            maxLength={64}
            autoFocus
          />
        </div>
      </ConfirmModal>

      {/* Delete Modal */}
      <ConfirmModal
        open={!!deletingPasskey}
        onClose={() => {
          setDeletingPasskey(null);
          setDeleteFieldError("");
          clearError();
        }}
        onConfirm={handleDeleteSubmit}
        title="Delete Passkey"
        description={`Are you sure you want to delete "${deletingPasskey?.name || "Passkey"}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        size="md"
        loading={isDeleting}
      >
        <div className="mt-4">
          <Input
            label="Confirm with your password"
            type="password"
            name="delete-passkey-password"
            value={deletePassword}
            onChange={(e) => {
              setDeletePassword(e.target.value);
              setDeleteFieldError("");
            }}
            placeholder="Enter your password"
            error={deleteFieldError || undefined}
          />
        </div>
      </ConfirmModal>
    </div>
  );
}
