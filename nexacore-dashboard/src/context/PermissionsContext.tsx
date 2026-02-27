'use client';

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';

type PermissionsContextType = {
  permissions: string[];
  hasPermission: (key: string) => boolean;
  hasAllPermissions: (keys: string[]) => boolean;
  hasAnyPermission: (keys: string[]) => boolean;
  isSuperAdmin: boolean;
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const permissions = useMemo(() => user?.permissions ?? [], [user?.permissions]);
  const isSuperAdmin = permissions.includes('*');

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const value = useMemo<PermissionsContextType>(
    () => ({
      permissions,
      isSuperAdmin,
      hasPermission: (key: string) => isSuperAdmin || permissionSet.has(key),
      hasAllPermissions: (keys: string[]) =>
        isSuperAdmin || keys.every((k) => permissionSet.has(k)),
      hasAnyPermission: (keys: string[]) =>
        isSuperAdmin || keys.some((k) => permissionSet.has(k)),
    }),
    [permissions, isSuperAdmin, permissionSet],
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}
