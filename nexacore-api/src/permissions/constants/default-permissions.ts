import { Role } from '../../users/enums/role.enum';

export interface PermissionDefinition {
  key: string;
  description: string;
  resource: string;
  action: string;
}

export const DEFAULT_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'dashboard:read',
    description: 'Access dashboard',
    resource: 'dashboard',
    action: 'read',
  },
  {
    key: 'users:read',
    description: 'View user list and details',
    resource: 'users',
    action: 'read',
  },
  {
    key: 'users:write',
    description: 'Edit user accounts (role, lock/unlock)',
    resource: 'users',
    action: 'write',
  },
  {
    key: 'users:delete',
    description: 'Delete user accounts',
    resource: 'users',
    action: 'delete',
  },
  {
    key: 'audit-logs:read',
    description: 'View audit log entries',
    resource: 'audit-logs',
    action: 'read',
  },
  {
    key: 'permissions:read',
    description: 'View permission definitions and role assignments',
    resource: 'permissions',
    action: 'read',
  },
  {
    key: 'permissions:write',
    description: 'Modify role permission assignments',
    resource: 'permissions',
    action: 'write',
  },
  {
    key: 'settings:read',
    description: 'View application settings',
    resource: 'settings',
    action: 'read',
  },
  {
    key: 'settings:write',
    description: 'Modify application settings',
    resource: 'settings',
    action: 'write',
  },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  [Role.USER]: ['dashboard:read', 'settings:read'],
  [Role.ADMIN]: [
    'dashboard:read',
    'users:read',
    'users:write',
    'users:delete',
    'audit-logs:read',
    'permissions:read',
    'settings:read',
    'settings:write',
  ],
  // SUPERADMIN bypasses all permission checks — not stored
};
