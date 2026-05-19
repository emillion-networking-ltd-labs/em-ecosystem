import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PermissionsService } from '../../permissions/permissions.service';
import { Role } from '../../users/enums/role.enum';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let permissionsService: jest.Mocked<PermissionsService>;

  function createMockContext(user?: {
    id: string;
    role: Role;
    isPlatformAdmin?: boolean;
  }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    permissionsService = {
      roleHasAllPermissions: jest.fn(),
    } as any;

    guard = new PermissionsGuard(reflector, permissionsService);
  });

  it('should allow access when no permissions metadata is set', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ id: 'user-1', role: Role.USER });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should allow access for empty permissions array', async () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const context = createMockContext({ id: 'user-1', role: Role.USER });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when no user is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(['users:read']);
    const context = createMockContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should allow SUPERADMIN regardless of required permissions', async () => {
    reflector.getAllAndOverride.mockReturnValue(['users:read', 'users:delete']);
    const context = createMockContext({
      id: 'admin-1',
      role: Role.SUPERADMIN,
      isPlatformAdmin: true,
    });

    expect(await guard.canActivate(context)).toBe(true);
    expect(permissionsService.roleHasAllPermissions).not.toHaveBeenCalled();
  });

  it('should allow when user has all required permissions', async () => {
    reflector.getAllAndOverride.mockReturnValue(['users:read']);
    permissionsService.roleHasAllPermissions.mockResolvedValue(true);
    const context = createMockContext({ id: 'user-1', role: Role.ADMIN });

    expect(await guard.canActivate(context)).toBe(true);
    expect(permissionsService.roleHasAllPermissions).toHaveBeenCalledWith(
      Role.ADMIN,
      ['users:read'],
    );
  });

  it('should throw ForbiddenException when user lacks permissions', async () => {
    reflector.getAllAndOverride.mockReturnValue(['users:delete']);
    permissionsService.roleHasAllPermissions.mockResolvedValue(false);
    const context = createMockContext({ id: 'user-1', role: Role.USER });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(guard.canActivate(context)).rejects.toThrow('Access denied');
  });

  it('should check ALL required permissions (AND logic)', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      'users:read',
      'users:write',
      'users:delete',
    ]);
    permissionsService.roleHasAllPermissions.mockResolvedValue(false);
    const context = createMockContext({ id: 'user-1', role: Role.ADMIN });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(permissionsService.roleHasAllPermissions).toHaveBeenCalledWith(
      Role.ADMIN,
      ['users:read', 'users:write', 'users:delete'],
    );
  });
});
