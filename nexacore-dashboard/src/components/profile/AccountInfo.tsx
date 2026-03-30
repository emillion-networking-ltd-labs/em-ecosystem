"use client";

import { Check, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AccountInfo() {
  const { user } = useAuth();

  if (!user) return null;

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isLocked = !user.isActive;
  const statusLabel = isLocked
    ? "Locked"
    : user.isActive
      ? "Active"
      : "Inactive";
  const statusDotClass = isLocked
    ? "bg-error"
    : user.isActive
      ? "bg-success"
      : "bg-content-disabled";

  return (
    <div className="rounded-xl border border-border-default bg-surface-primary p-6">
      <h2 className="mb-6 text-body font-semibold uppercase tracking-wider text-content-primary">
        Account Information
      </h2>

      <dl className="grid grid-cols-[140px_1fr] gap-y-3">
        <dt className="text-body text-content-tertiary">Member since</dt>
        <dd className="text-body text-content-primary">{memberSince}</dd>

        <dt className="text-body text-content-tertiary">Role</dt>
        <dd>
          <span className="inline-flex items-center rounded-md bg-surface-subtle px-2 py-0.5 text-caption font-normal text-content-secondary">
            {user.role}
          </span>
        </dd>

        <dt className="text-body text-content-tertiary">Status</dt>
        <dd className="flex items-center gap-1.5 text-body text-content-primary">
          <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
          {statusLabel}
        </dd>

        <dt className="text-body text-content-tertiary">Email</dt>
        <dd className="flex items-center gap-1.5 text-body">
          {user.emailVerified ? (
            <>
              <Check size={16} className="text-success" />
              <span className="text-success">Verified</span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} className="text-warning" />
              <span className="text-warning">Not verified</span>
            </>
          )}
        </dd>
      </dl>
    </div>
  );
}
