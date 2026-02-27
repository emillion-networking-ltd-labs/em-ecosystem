import { Role } from '../../users/enums/role.enum';

export interface Permission {
  id: string;
  key: string;
  description: string;
  resource: string;
  action: string;
  createdAt: Date;
}

export interface RolePermission {
  id: string;
  role: Role;
  permissionId: string;
  permission?: Permission;
  createdAt: Date;
}

export interface RolePermissionsResponse {
  role: Role;
  permissions: Permission[];
}
