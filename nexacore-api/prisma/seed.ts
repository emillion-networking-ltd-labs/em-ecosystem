import { PrismaClient, Role } from '@prisma/client';

const DEFAULT_PERMISSIONS = [
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

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
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
};

const prisma = new PrismaClient();

async function main() {
  // Upsert all permissions
  for (const perm of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description, resource: perm.resource, action: perm.action },
      create: perm,
    });
  }

  console.log(`Seeded ${DEFAULT_PERMISSIONS.length} permissions`);

  // Assign permissions to roles
  let assignmentCount = 0;
  for (const [role, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const key of keys) {
      const permission = await prisma.permission.findUnique({ where: { key } });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: role as Role, permissionId: permission.id } },
        update: {},
        create: { role: role as Role, permissionId: permission.id },
      });
      assignmentCount++;
    }
  }

  console.log(`Seeded ${assignmentCount} role-permission assignments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
