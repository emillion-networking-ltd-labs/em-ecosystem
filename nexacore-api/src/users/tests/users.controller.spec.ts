import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { Role } from '../enums/role.enum';
import { Provider } from '../enums/provider.enum';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../audit/audit.service';
import { PermissionsService } from '../../permissions/permissions.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    updateProfile: jest.Mock;
    changePassword: jest.Mock;
    requestEmailChange: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    adminUpdateUser: jest.Mock;
    softDelete: jest.Mock;
  };

  const mockSafeUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: null,
    role: Role.USER,
    provider: Provider.LOCAL,
    providerId: null,
    emailVerified: true,
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    lockoutCount: 0,
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReq = {
    user: { id: 'uuid-123', role: Role.USER },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
  };

  const mockAdminReq = {
    user: { id: 'admin-1', role: Role.ADMIN },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    usersService = {
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      requestEmailChange: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      adminUpdateUser: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: PermissionsService,
          useValue: { roleHasAllPermissions: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  // ─── PATCH /users/me ─────────────────────────────────────────

  describe('updateProfile', () => {
    it('should delegate to usersService.updateProfile with userId and context', async () => {
      usersService.updateProfile.mockResolvedValue(mockSafeUser);

      const result = await controller.updateProfile(mockReq, {
        firstName: 'Jane',
      });

      expect(usersService.updateProfile).toHaveBeenCalledWith(
        'uuid-123',
        { firstName: 'Jane' },
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual(mockSafeUser);
    });
  });

  // ─── PATCH /users/me/password ────────────────────────────────

  describe('changePassword', () => {
    it('should delegate to usersService.changePassword and return success message', async () => {
      usersService.changePassword.mockResolvedValue(undefined);

      const result = await controller.changePassword(mockReq, {
        currentPassword: 'OldPass1!',
        newPassword: 'NewPass2!',
      });

      expect(usersService.changePassword).toHaveBeenCalledWith(
        'uuid-123',
        { currentPassword: 'OldPass1!', newPassword: 'NewPass2!' },
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual({ message: 'Password changed successfully' });
    });
  });

  // ─── GET /users ──────────────────────────────────────────────

  describe('listUsers', () => {
    it('should delegate to usersService.findAll with query params', async () => {
      const paginatedResult = {
        data: [mockSafeUser],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      usersService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.listUsers({
        page: 1,
        limit: 10,
        role: Role.ADMIN,
      });

      expect(usersService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        role: Role.ADMIN,
      });
      expect(result).toEqual(paginatedResult);
    });
  });

  // ─── GET /users/:id ──────────────────────────────────────────

  describe('getUser', () => {
    it('should return SafeUser when user exists', async () => {
      const fullUser = {
        ...mockSafeUser,
        passwordHash: 'hashed',
        mfaSecret: null,
        mfaRecoveryCodes: [],
      };
      usersService.findById.mockResolvedValue(fullUser);

      const result = await controller.getUser('uuid-123');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should return error object when user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      const result = await controller.getUser('nonexistent');

      expect(result).toEqual({ error: 'User not found' });
    });
  });

  // ─── PATCH /users/:id ────────────────────────────────────────

  describe('adminUpdateUser', () => {
    it('should delegate to usersService.adminUpdateUser with acting user context', async () => {
      usersService.adminUpdateUser.mockResolvedValue({
        ...mockSafeUser,
        role: Role.ADMIN,
      });

      const result = await controller.adminUpdateUser(
        'uuid-123',
        { role: Role.ADMIN },
        mockAdminReq,
      );

      expect(usersService.adminUpdateUser).toHaveBeenCalledWith(
        'uuid-123',
        { role: Role.ADMIN },
        { id: 'admin-1', role: Role.ADMIN },
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result.role).toBe(Role.ADMIN);
    });
  });

  // ─── DELETE /users/:id ───────────────────────────────────────

  describe('deleteUser', () => {
    it('should delegate to usersService.softDelete and return success message', async () => {
      usersService.softDelete.mockResolvedValue(undefined);

      const result = await controller.deleteUser('uuid-123', mockAdminReq);

      expect(usersService.softDelete).toHaveBeenCalledWith(
        'uuid-123',
        'admin-1',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual({ message: 'User deactivated successfully' });
    });
  });

  // ─── POST /users/me/email ───────────────────────────────────

  describe('requestEmailChange', () => {
    it('should delegate to usersService.requestEmailChange with userId and context', async () => {
      usersService.requestEmailChange.mockResolvedValue({
        message: 'Verification email sent to new address',
      });

      const result = await controller.requestEmailChange(mockReq, {
        newEmail: 'new@example.com',
        password: 'StrongPass1!',
      });

      expect(usersService.requestEmailChange).toHaveBeenCalledWith(
        'uuid-123',
        { newEmail: 'new@example.com', password: 'StrongPass1!' },
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual({
        message: 'Verification email sent to new address',
      });
    });
  });
});
