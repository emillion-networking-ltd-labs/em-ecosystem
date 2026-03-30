"use client";

import { useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { PROFILE_TOAST } from "@/lib/toast-messages";
import { apiClient } from "@/lib/api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { SafeUser } from "@/lib/types";

export default function ProfileForm() {
  const { user, refreshSession } = useAuth();
  const { addToast } = useToast();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.patch<SafeUser>("/users/me", { firstName, lastName });
      await refreshSession();
      addToast(PROFILE_TOAST.PROFILE_UPDATED);
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      const msg = apiErr?.error?.message || "Could not update profile.";
      addToast(
        PROFILE_TOAST.PROFILE_UPDATE_FAILED(
          msg.endsWith(".") ? msg : `${msg}.`,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border-default bg-surface-primary p-6">
      <h2 className="mb-6 text-body font-semibold uppercase tracking-wider text-content-primary">
        Profile Information
      </h2>

      {/* Avatar section */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-circle bg-surface-subtle">
          {user?.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt="Avatar"
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-h1 text-content-primary">
              {(user?.firstName?.[0] || user?.email[0] || "?").toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="link-underline"
            size="md"
            fullWidth={false}
          >
            Upload photo
          </Button>
          <Button
            type="button"
            variant="link"
            size="md"
            fullWidth={false}
            className="text-content-primary/50 hover:text-error"
          >
            Remove
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input
            label="First Name"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
          />
          <Input
            label="Last Name"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
          />
        </div>

        <div className="relative">
          <Input
            label="Email"
            name="email"
            value={user?.email || ""}
            disabled
          />
          <Lock
            size={16}
            className="absolute bottom-4 right-4 text-content-tertiary"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="md" fullWidth={false} loading={loading}>
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
