'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, RotateCcw, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import Can from '@/components/guards/Can';
import type { Permission, RolePermissionsResponse, UserRole } from '@/lib/types';

type RolePermMap = Record<string, Set<string>>;

const EDITABLE_ROLES: UserRole[] = ['USER', 'ADMIN'];

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [allPerms, userPerms, adminPerms] = await Promise.all([
        apiClient.get<Permission[]>('/permissions'),
        apiClient.get<RolePermissionsResponse>('/permissions/roles/USER'),
        apiClient.get<RolePermissionsResponse>('/permissions/roles/ADMIN'),
      ]);

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
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
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
      addToast({ variant: 'success', title: `${role} permissions saved successfully.` });
    } catch {
      addToast({ variant: 'error', title: `Failed to save ${role} permissions.` });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-content-tertiary" />
      </div>
    );
  }

  if (loadError && permissions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-border-default bg-surface-primary">
        <p className="text-body-sm text-error">Failed to load permissions data.</p>
      </div>
    );
  }

  const grouped = groupByResource(permissions);

  return (
    <div className="space-y-6">
      {/* Matrix table */}
      <div className="overflow-x-auto rounded-2xl border border-border-default bg-surface-primary">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default">
              <th className="px-6 py-4 text-left text-caption font-semibold uppercase tracking-wider text-content-tertiary">
                Permission
              </th>
              {EDITABLE_ROLES.map((role) => (
                <th
                  key={role}
                  className="px-6 py-4 text-center text-caption font-semibold uppercase tracking-wider text-content-tertiary"
                >
                  {role}
                </th>
              ))}
              <th className="px-6 py-4 text-center text-caption font-semibold uppercase tracking-wider text-brand-primary">
                SUPERADMIN
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from(grouped.entries()).map(([resource, perms]) => (
              <ResourceGroup key={resource} resource={resource}>
                {perms.map((perm) => (
                  <tr
                    key={perm.id}
                    className="border-b border-border-default last:border-b-0 hover:bg-surface-subtle/50"
                  >
                    <td className="px-6 py-3">
                      <div>
                        <span className="text-body-sm font-medium text-content-primary">
                          {perm.key}
                        </span>
                        <p className="text-caption text-content-tertiary">
                          {perm.description}
                        </p>
                      </div>
                    </td>
                    {EDITABLE_ROLES.map((role) => (
                      <td key={role} className="px-6 py-3 text-center">
                        <Can permission="permissions:write" fallback={
                          <input
                            type="checkbox"
                            checked={current[role]?.has(perm.key) ?? false}
                            disabled
                            className="h-4 w-4 cursor-not-allowed accent-brand-primary opacity-50"
                          />
                        }>
                          <input
                            type="checkbox"
                            checked={current[role]?.has(perm.key) ?? false}
                            onChange={() => toggle(role, perm.key)}
                            className="h-4 w-4 cursor-pointer accent-brand-primary"
                          />
                        </Can>
                      </td>
                    ))}
                    {/* SUPERADMIN: always checked, disabled */}
                    <td className="px-6 py-3 text-center">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        className="h-4 w-4 cursor-not-allowed accent-brand-primary"
                      />
                    </td>
                  </tr>
                ))}
              </ResourceGroup>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save/Reset buttons per role */}
      <Can permission="permissions:write">
        <div className="flex flex-wrap gap-4">
          {EDITABLE_ROLES.map((role) => (
            <div
              key={role}
              className="flex items-center gap-2 rounded-xl border border-border-default bg-surface-primary px-4 py-3"
            >
              <span className="text-body-sm font-medium text-content-primary">
                {role}
              </span>
              <button
                onClick={() => saveRole(role)}
                disabled={!isDirty(role) || saving === role}
                className="flex items-center gap-1 rounded-lg bg-brand-primary px-3 py-1.5 text-caption font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving === role ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save
              </button>
              <button
                onClick={() => resetRole(role)}
                disabled={!isDirty(role)}
                className="flex items-center gap-1 rounded-lg border border-border-default px-3 py-1.5 text-caption font-medium text-content-secondary transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </div>
          ))}
        </div>
      </Can>
    </div>
  );
}

/* ---- Sub-component: resource group header ---- */

function ResourceGroup({
  resource,
  children,
}: {
  resource: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <tr className="bg-surface-secondary">
        <td
          colSpan={4}
          className="px-6 py-2 text-caption font-semibold uppercase tracking-wider text-content-tertiary"
        >
          {resource}
        </td>
      </tr>
      {children}
    </>
  );
}
