"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import InlineError from "@/components/ui/InlineError";
import { useAuth } from "@/hooks/useAuth";

/**
 * TenantPickStep — workspace selector for the AuthIntent v2 login flow.
 *
 * SCRUM-499 / AUTH v2 Phase 2.3. The only genuinely new screen in this ticket
 * (no v1 equivalent — v1 was single-tenant). Visual parity with the rest of
 * the auth flow:
 *   - same 330/348 column layout
 *   - same `text-h1 font-semibold text-content-primary` heading
 *   - same `text-justify text-body text-content-secondary` subtitle
 *   - tenant choices rendered as full-width `<Button variant="outline">` rows
 *     stacked vertically (gap-2) — matches the visual weight of `<Input>` rows
 *     used in LoginFormV2 / MfaTotpStepV2
 *   - same outline-Cancel button at the bottom (mirrors v1 MfaTotpStep)
 *
 * Per plan decision D2 (locked at /enrich-us): tenant choices show raw
 * tenantIds in monospace short form. Tenant-name lookup is deferred to a
 * follow-up ticket if UX demands (would require a new backend endpoint —
 * `GET /tenants/:tenantId` does not exist in the live API surface as of 2026-05-22).
 */
export default function TenantPickStep() {
  const {
    authIntentAvailableTenantIds,
    advanceTenantPickV2,
    cancelAuthIntentV2,
    isLoading,
  } = useAuth();
  const [pickingTenantId, setPickingTenantId] = useState<string | null>(null);

  const handlePick = async (tenantId: string) => {
    setPickingTenantId(tenantId);
    try {
      await advanceTenantPickV2(tenantId);
    } catch {
      // Errors surface via AuthContext.error / toasts; no extra handling here.
      setPickingTenantId(null);
    }
  };

  const tenantIds = authIntentAvailableTenantIds ?? [];

  // Defensive: should never happen (backend filters availableTenantIds to active
  // memberships). If it does, show a recoverable error instead of an empty list.
  if (tenantIds.length === 0) {
    return (
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex w-full flex-col gap-2 md:w-[330px]">
          <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
            <h1 className="text-h1 font-semibold text-content-primary">
              Select Workspace
            </h1>
            <p className="text-justify text-body text-content-secondary">
              We could not find any workspaces for your account. Please contact
              support if this is unexpected.
            </p>
          </div>
        </div>

        <div className="w-full md:w-[348px]">
          <div className="flex flex-col gap-2">
            <div className="flex min-h-[116px] flex-col gap-2">
              <InlineError message="No workspaces available." />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={cancelAuthIntentV2}
              className="flex-1"
            >
              Back to sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Short-id formatting: 8 chars prefix + ellipsis + 4 chars suffix.
  // Renders the raw UUID in a readable, comparable shape until tenant names
  // become available via a future backend endpoint.
  const formatTenantId = (id: string): string =>
    id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="flex w-full flex-col gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-h1 font-semibold text-content-primary">
            Select Workspace
          </h1>
          <p className="text-justify text-body text-content-secondary">
            Choose the workspace you would like to sign in to.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[348px]">
        <div className="flex flex-col gap-2">
          {/* Workspaces list — vertical stack of outline buttons (same visual
              weight as `<Input>` rows used elsewhere in the auth flow). */}
          <div
            className="flex flex-col gap-2"
            role="radiogroup"
            aria-label="Available workspaces"
          >
            {tenantIds.map((tenantId) => (
              <Button
                key={tenantId}
                type="button"
                variant="outline"
                onClick={() => handlePick(tenantId)}
                disabled={isLoading}
                loading={pickingTenantId === tenantId}
                aria-label={`Select workspace ${tenantId}`}
              >
                <span className="font-mono text-sm">
                  {formatTenantId(tenantId)}
                </span>
              </Button>
            ))}
          </div>

          {/* Cancel — mirrors the outline-cancel position used in MfaTotpStep */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelAuthIntentV2}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
