"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import { Save, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import Spinner from "@/components/ui/Spinner";
import StickyCard from "@/components/ui/StickyCard";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import Can from "@/components/guards/Can";
import Checkbox from "@/components/ui/Checkbox";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import type {
  Permission,
  RolePermissionsResponse,
  UserRole,
} from "@/lib/types";

type RolePermMap = Record<string, Set<string>>;

const EDITABLE_ROLES: UserRole[] = ["USER", "ADMIN"];

function groupByResource(permissions: Permission[]): Map<string, Permission[]> {
  const map = new Map<string, Permission[]>();
  for (const p of permissions) {
    const group = map.get(p.resource) ?? [];
    group.push(p);
    map.set(p.resource, group);
  }
  return map;
}

export default function PermissionsMatrix() {
  const { addToast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [original, setOriginal] = useState<RolePermMap>({});
  const [current, setCurrent] = useState<RolePermMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<UserRole | null>(null);
  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(false);
    try {
      const [allPerms, userPerms, adminPerms] = await Promise.all([
        apiClient.get<Permission[]>("/permissions", { signal }),
        apiClient.get<RolePermissionsResponse>("/permissions/roles/USER", {
          signal,
        }),
        apiClient.get<RolePermissionsResponse>("/permissions/roles/ADMIN", {
          signal,
        }),
      ]);

      if (signal?.aborted) return;

      setPermissions(allPerms);

      const origMap: RolePermMap = {
        USER: new Set(userPerms.permissions.map((p) => p.key)),
        ADMIN: new Set(adminPerms.permissions.map((p) => p.key)),
      };
      setOriginal(origMap);
      setCurrent({
        USER: new Set(origMap.USER),
        ADMIN: new Set(origMap.ADMIN),
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      if (!signal?.aborted) setLoadError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const toggle = (role: UserRole, key: string) => {
    setCurrent((prev) => {
      const next = { ...prev };
      const set = new Set(next[role]);
      if (set.has(key)) {
        set.delete(key);
      } else {
        set.add(key);
      }
      next[role] = set;
      return next;
    });
  };

  const isDirty = (role: UserRole): boolean => {
    const orig = original[role];
    const curr = current[role];
    if (!orig || !curr) return false;
    if (orig.size !== curr.size) return true;
    return Array.from(orig).some((k) => !curr.has(k));
  };

  const resetRole = (role: UserRole) => {
    setCurrent((prev) => ({
      ...prev,
      [role]: new Set(original[role]),
    }));
  };

  const saveRole = async (role: UserRole) => {
    setSaving(role);
    try {
      await apiClient.put(`/permissions/roles/${role}`, {
        permissionKeys: Array.from(current[role]),
      });
      setOriginal((prev) => ({
        ...prev,
        [role]: new Set(current[role]),
      }));
      addToast({
        variant: "success",
        title: "Permissions saved",
        description: `${role} permissions updated successfully.`,
      });
    } catch {
      addToast({
        variant: "error",
        title: "Save failed",
        description: `Could not save ${role} permissions.`,
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (loadError && permissions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border-strong bg-surface-primary">
        <p className="text-body text-error">Failed to load permissions data.</p>
      </div>
    );
  }

  const grouped = groupByResource(permissions);

  return (
    <div className="space-y-6">
      {/* Matrix tables — one DataTable per resource group */}
      <div className="card-flat space-y-6">
        {Array.from(grouped.entries()).map(([resource, perms]) => {
          const columns: ColumnDef<Permission>[] = [
            {
              key: "permission",
              label: "Permission",
              render: (perm) => (
                <div>
                  <span className="text-body font-normal text-content-primary">
                    {perm.key}
                  </span>
                  <p className="text-caption text-content-tertiary">
                    {perm.description}
                  </p>
                </div>
              ),
            },
            ...EDITABLE_ROLES.map((role) => ({
              key: role,
              label: role,
              align: "center" as const,
              render: (perm: Permission) => (
                <Can
                  permission="permissions:write"
                  fallback={
                    <Checkbox
                      checked={current[role]?.has(perm.key) ?? false}
                      disabled
                      size="md"
                    />
                  }
                >
                  <Checkbox
                    checked={current[role]?.has(perm.key) ?? false}
                    onChange={() => toggle(role, perm.key)}
                    size="md"
                  />
                </Can>
              ),
            })),
            {
              key: "superadmin",
              label: "SUPERADMIN",
              align: "center" as const,
              headerClassName: "!text-brand-primary",
              render: () => <Checkbox checked disabled size="md" />,
            },
          ];

          return (
            <div key={resource}>
              <p className="mb-2 text-h3 font-semibold uppercase tracking-wider text-content-primary">
                {resource.replace(/_/g, " ")}
              </p>
              <DataTable
                data={perms}
                columns={columns}
                keyExtractor={(perm) => perm.id}
              />
            </div>
          );
        })}
      </div>

      {/* Save/Reset — sticky action bar */}
      <Can permission="permissions:write">
        <StickyCard className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {EDITABLE_ROLES.map((role, index) => (
            <Fragment key={role}>
              {index > 0 && (
                <>
                  <Divider className="sm:hidden" />
                  <Divider orientation="vertical" className="hidden sm:block" />
                </>
              )}
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
                <span className="text-body font-semibold text-content-primary">
                  {role}
                </span>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => saveRole(role)}
                    disabled={!isDirty(role)}
                    loading={saving === role}
                  >
                    <Save size={16} />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => resetRole(role)}
                    disabled={!isDirty(role)}
                  >
                    <RotateCcw size={16} />
                    Reset
                  </Button>
                </div>
              </div>
            </Fragment>
          ))}
        </StickyCard>
      </Can>
    </div>
  );
}
