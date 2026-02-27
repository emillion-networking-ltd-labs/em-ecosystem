import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Provider } from '../enums/provider.enum';
import { Role } from '../enums/role.enum';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { SessionsService } from '../../sessions/sessions.service';

jest.mock('bcrypt');

describe('UsersService', () => {
  let usersService: UsersService;
  let auditService: { log: jest.Mock };
  let sessionsService: { revokeAllUserSessions: jest.Mock };
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  const mockUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    firstName: null,
    lastName: null,
    avatarUrl: null,
    role: Role.USER,
    provider: Provider.LOCAL,
    providerId: null,
    emailVerified: false,
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    lockoutCount: 0,
    mfaEnabled: false,
    mfaSecret: null,
    mfaRecoveryCodes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    sessionsService = { revokeAllUserSessions: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
        {
          provide: SessionsService,
          useValue: sessionsService,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await usersService.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.findById('uuid-123');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
      });
    });

    it('should return null when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await usersService.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user with email and passwordHash', async () => {
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await usersService.create({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      });

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed-password',
          provider: Provider.LOCAL,
        },
      });
    });

    it('should create user with specified provider', async () => {
      prisma.user.create.mockResolvedValue({
        ...mockUser,
        provider: Provider.GOOGLE,
      });

      await usersService.create({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        provider: Provider.GOOGLE,
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed-password',
          provider: Provider.GOOGLE,
        },
      });
    });

    it('should throw ConflictException on duplicate email (P2002)', async () => {
      const prismaError = new Error('Unique constraint failed');
      (prismaError as unknown as { code: string }).code = 'P2002';
      prisma.user.create.mockRejectedValue(prismaError);

      await expect(
        usersService.create({
          email: 'test@example.com',
          passwordHash: 'hashed-password',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException on other errors', async () => {
      prisma.user.create.mockRejectedValue(
        new Error('Database connection lost'),
      );

      await expect(
        usersService.create({
          email: 'test@example.com',
          passwordHash: 'hashed-password',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('incrementFailedAttempts', () => {
    it('should increment failedAttempts by 1', async () => {
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        failedAttempts: 1,
      });

      const result = await usersService.incrementFailedAttempts('uuid-123');

      expect(result.failedAttempts).toBe(1);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { failedAttempts: { increment: 1 } },
      });
    });
  });

  describe('resetFailedAttempts', () => {
    it('should reset failedAttempts to 0 and clear lockedUntil', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.resetFailedAttempts('uuid-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    });
  });

  describe('lockAccount', () => {
    it('should set lockedUntil to 15 minutes from now for first lockout', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      const before = Date.now();
      await usersService.lockAccount('uuid-123', 0);
      const after = Date.now();

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: {
          lockedUntil: expect.any(Date),
          lockoutCount: { increment: 1 },
        },
      });

      const lockDate = prisma.user.update.mock.calls[0][0].data
        .lockedUntil as Date;
      const lockMs = lockDate.getTime();
      expect(lockMs).toBeGreaterThanOrEqual(before + 15 * 60 * 1000);
      expect(lockMs).toBeLessThanOrEqual(after + 15 * 60 * 1000);
    });
  });

  describe('findOrCreateByOAuth', () => {
    const googleProfile = {
      email: 'oauth@example.com',
      provider: Provider.GOOGLE,
      providerId: 'google-id-123',
    };

    it('should return existing user when provider and providerId match', async () => {
      const existingOAuthUser = {
        ...mockUser,
        email: 'oauth@example.com',
        provider: Provider.GOOGLE,
        providerId: 'google-id-123',
      };
      prisma.user.findUnique.mockResolvedValue(existingOAuthUser);

      const result = await usersService.findOrCreateByOAuth(googleProfile);

      expect(result).toEqual(existingOAuthUser);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should link OAuth to existing LOCAL account by updating provider', async () => {
      const localUser = {
        ...mockUser,
        email: 'oauth@example.com',
        provider: Provider.LOCAL,
        providerId: null,
      };
      const linkedUser = {
        ...localUser,
        provider: Provider.GOOGLE,
        providerId: 'google-id-123',
        emailVerified: true,
      };
      prisma.user.findUnique.mockResolvedValue(localUser);
      prisma.user.update.mockResolvedValue(linkedUser);

      const result = await usersService.findOrCreateByOAuth(googleProfile);

      expect(result).toEqual(linkedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: localUser.id },
        data: {
          provider: Provider.GOOGLE,
          providerId: 'google-id-123',
          emailVerified: true,
        },
      });
    });

    it('should return existing user when email matches but provider is different OAuth', async () => {
      const githubUser = {
        ...mockUser,
        email: 'oauth@example.com',
        provider: Provider.GITHUB,
        providerId: 'github-id-789',
      };
      prisma.user.findUnique.mockResolvedValue(githubUser);

      const result = await usersService.findOrCreateByOAuth(googleProfile);

      expect(result).toEqual(githubUser);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should create new user when no existing user with that email', async () => {
      const newOAuthUser = {
        ...mockUser,
        email: 'oauth@example.com',
        provider: Provider.GOOGLE,
        providerId: 'google-id-123',
        passwordHash: null,
        emailVerified: true,
      };
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(newOAuthUser);

      const result = await usersService.findOrCreateByOAuth(googleProfile);

      expect(result).toEqual(newOAuthUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'oauth@example.com',
          provider: Provider.GOOGLE,
          providerId: 'google-id-123',
          emailVerified: true,
        },
      });
    });

    it('should update profile fields when existing OAuth user has empty fields', async () => {
      const existingOAuthUser = {
        ...mockUser,
        email: 'oauth@example.com',
        provider: Provider.GOOGLE,
        providerId: 'google-id-123',
        firstName: null,
        lastName: null,
        avatarUrl: null,
      };
      const updatedUser = {
        ...existingOAuthUser,
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      };
      prisma.user.findUnique.mockResolvedValue(existingOAuthUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await usersService.findOrCreateByOAuth({
        ...googleProfile,
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: existingOAuthUser.id },
        data: {
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      });
    });
  });

  // ─── resetLockoutEscalation ─────────────────────────────────────

  describe('resetLockoutEscalation', () => {
    it('should reset failedAttempts, lockedUntil, and lockoutCount to 0/null', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.resetLockoutEscalation('uuid-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
          lockoutCount: 0,
        },
      });
    });
  });

  // ─── findAll ────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated users with meta', async () => {
      const users = [mockUser, { ...mockUser, id: 'uuid-456', email: 'other@example.com' }];
      prisma.user.findMany.mockResolvedValue(users);
      prisma.user.count.mockResolvedValue(2);

      const result = await usersService.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).not.toHaveProperty('passwordHash');
      expect(result.meta).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply default page=1 and limit=10 when not provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await usersService.findAll({});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should calculate skip correctly for page 3', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(25);

      const result = await usersService.findAll({ page: 3, limit: 5 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        }),
      );
      expect(result.meta.totalPages).toBe(5);
    });

    it('should filter by role when provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await usersService.findAll({ role: Role.ADMIN });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: Role.ADMIN }),
        }),
      );
    });

    it('should apply search filter across email, firstName, lastName', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await usersService.findAll({ search: 'john' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { email: { contains: 'john', mode: 'insensitive' } },
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should use valid sortBy field', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await usersService.findAll({ sortBy: 'email', sortOrder: 'asc' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { email: 'asc' },
        }),
      );
    });

    it('should default to createdAt desc for invalid sortBy', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await usersService.findAll({ sortBy: 'INVALID_FIELD' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  // ─── updateProfile ──────────────────────────────────────────────

  describe('updateProfile', () => {
    it('should update only provided fields and return SafeUser', async () => {
      const updatedUser = { ...mockUser, firstName: 'Jane' };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await usersService.updateProfile('uuid-123', {
        firstName: 'Jane',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { firstName: 'Jane' },
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('mfaSecret');
    });

    it('should fire audit log (fire-and-forget)', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.updateProfile(
        'uuid-123',
        { firstName: 'Jane', lastName: 'Doe' },
        { ipAddress: '10.0.0.1', userAgent: 'test-agent' },
      );

      expect(auditService.log).toHaveBeenCalledWith({
        action: AuditAction.PROFILE_UPDATE,
        userId: 'uuid-123',
        ipAddress: '10.0.0.1',
        userAgent: 'test-agent',
        metadata: {
          updatedFields: ['firstName', 'lastName'],
        },
      });
    });

    it('should not include undefined fields in update data', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.updateProfile('uuid-123', { firstName: 'Jane' });

      const updateData = prisma.user.update.mock.calls[0][0].data;
      expect(updateData).toHaveProperty('firstName');
      expect(updateData).not.toHaveProperty('lastName');
      expect(updateData).not.toHaveProperty('avatarUrl');
    });

    it('should not throw when audit log rejects (fire-and-forget)', async () => {
      auditService.log.mockRejectedValue(new Error('audit fail'));
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await usersService.updateProfile(
        'uuid-123',
        { firstName: 'Jane' },
        { ipAddress: '10.0.0.1', userAgent: 'test-agent' },
      );

      await new Promise(process.nextTick);

      expect(result).toBeDefined();
    });
  });

  // ─── changePassword ────────────────────────────────────────────

  describe('changePassword', () => {
    const changeDto = {
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass456!',
    };

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        usersService.changePassword('uuid-123', changeDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for OAuth accounts (no password)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
        provider: Provider.GOOGLE,
      });

      await expect(
        usersService.changePassword('uuid-123', changeDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        usersService.changePassword('uuid-123', changeDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should hash new password, update, and revoke all sessions', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.changePassword('uuid-123', changeDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass456!', 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { passwordHash: 'new-hashed-password' },
      });
      expect(sessionsService.revokeAllUserSessions).toHaveBeenCalledWith('uuid-123');
    });

    it('should fire audit log on successful password change', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.changePassword('uuid-123', changeDto, {
        ipAddress: '10.0.0.1',
        userAgent: 'test-agent',
      });

      expect(auditService.log).toHaveBeenCalledWith({
        action: AuditAction.PASSWORD_CHANGE,
        userId: 'uuid-123',
        ipAddress: '10.0.0.1',
        userAgent: 'test-agent',
      });
    });

    it('should not throw when audit log rejects (fire-and-forget)', async () => {
      auditService.log.mockRejectedValue(new Error('audit fail'));
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.changePassword('uuid-123', changeDto, {
        ipAddress: '10.0.0.1',
        userAgent: 'test-agent',
      });

      await new Promise(process.nextTick);
    });
  });

  // ─── adminUpdateUser ───────────────────────────────────────────

  describe('adminUpdateUser', () => {
    const actingAdmin = { id: 'admin-1', role: Role.ADMIN };
    const actingSuperadmin = { id: 'superadmin-1', role: Role.SUPERADMIN };

    it('should throw NotFoundException when target user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        usersService.adminUpdateUser('nonexistent', { role: Role.ADMIN }, actingSuperadmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when trying to modify SUPERADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        role: Role.SUPERADMIN,
      });

      await expect(
        usersService.adminUpdateUser('uuid-123', { isActive: false }, actingSuperadmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when non-SUPERADMIN assigns ADMIN role', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        usersService.adminUpdateUser('uuid-123', { role: Role.ADMIN }, actingAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when non-SUPERADMIN assigns SUPERADMIN role', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        usersService.adminUpdateUser('uuid-123', { role: Role.SUPERADMIN }, actingAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SUPERADMIN to assign ADMIN role', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, role: Role.ADMIN };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await usersService.adminUpdateUser(
        'uuid-123',
        { role: Role.ADMIN },
        actingSuperadmin,
      );

      expect(result).not.toHaveProperty('passwordHash');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { role: Role.ADMIN },
      });
    });

    it('should fire role change audit log when role changes', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, role: Role.ADMIN });

      await usersService.adminUpdateUser(
        'uuid-123',
        { role: Role.ADMIN },
        actingSuperadmin,
        { ipAddress: '10.0.0.1', userAgent: 'test-agent' },
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.USER_ROLE_CHANGE,
          userId: 'superadmin-1',
          targetUserId: 'uuid-123',
          metadata: { previousRole: Role.USER, newRole: Role.ADMIN },
        }),
      );
    });

    it('should fire activation audit log when isActive changes to true', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      prisma.user.findUnique.mockResolvedValue(inactiveUser);
      prisma.user.update.mockResolvedValue({ ...inactiveUser, isActive: true });

      await usersService.adminUpdateUser(
        'uuid-123',
        { isActive: true },
        actingSuperadmin,
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.USER_ACTIVATED,
          targetUserId: 'uuid-123',
        }),
      );
    });

    it('should fire deactivation audit log when isActive changes to false', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      await usersService.adminUpdateUser(
        'uuid-123',
        { isActive: false },
        actingSuperadmin,
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.USER_DEACTIVATED,
          targetUserId: 'uuid-123',
        }),
      );
    });

    it('should not throw when role-change audit log rejects (fire-and-forget)', async () => {
      auditService.log.mockRejectedValue(new Error('audit fail'));
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, role: Role.ADMIN });

      const result = await usersService.adminUpdateUser(
        'uuid-123',
        { role: Role.ADMIN },
        actingSuperadmin,
      );

      await new Promise(process.nextTick);

      expect(result).toBeDefined();
    });

    it('should not throw when activation audit log rejects (fire-and-forget)', async () => {
      auditService.log.mockRejectedValue(new Error('audit fail'));
      const inactiveUser = { ...mockUser, isActive: false };
      prisma.user.findUnique.mockResolvedValue(inactiveUser);
      prisma.user.update.mockResolvedValue({ ...inactiveUser, isActive: true });

      const result = await usersService.adminUpdateUser(
        'uuid-123',
        { isActive: true },
        actingSuperadmin,
      );

      await new Promise(process.nextTick);

      expect(result).toBeDefined();
    });
  });

  // ─── softDelete ────────────────────────────────────────────────

  describe('softDelete', () => {
    it('should throw NotFoundException when target not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        usersService.softDelete('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when target is SUPERADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        role: Role.SUPERADMIN,
      });

      await expect(
        usersService.softDelete('uuid-123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should set isActive=false and fire audit log', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      await usersService.softDelete('uuid-123', 'admin-1', {
        ipAddress: '10.0.0.1',
        userAgent: 'test-agent',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { isActive: false },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.USER_DELETED,
          userId: 'admin-1',
          targetUserId: 'uuid-123',
          metadata: { email: 'test@example.com' },
        }),
      );
    });

    it('should not throw when audit log rejects (fire-and-forget)', async () => {
      auditService.log.mockRejectedValue(new Error('audit fail'));
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      await usersService.softDelete('uuid-123', 'admin-1', {
        ipAddress: '10.0.0.1',
        userAgent: 'test-agent',
      });

      await new Promise(process.nextTick);
    });
  });

  // ─── MFA methods ───────────────────────────────────────────────

  describe('updateMfaSetupData', () => {
    it('should update mfaSecret and mfaRecoveryCodes', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.updateMfaSetupData(
        'uuid-123',
        'encrypted-secret',
        ['code1-hash', 'code2-hash'],
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: {
          mfaSecret: 'encrypted-secret',
          mfaRecoveryCodes: ['code1-hash', 'code2-hash'],
        },
      });
    });
  });

  describe('enableMfa', () => {
    it('should set mfaEnabled to true', async () => {
      prisma.user.update.mockResolvedValue({ ...mockUser, mfaEnabled: true });

      await usersService.enableMfa('uuid-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { mfaEnabled: true },
      });
    });
  });

  describe('disableMfa', () => {
    it('should set mfaEnabled=false and clear secret and codes', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.disableMfa('uuid-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          mfaRecoveryCodes: [],
        },
      });
    });
  });

  describe('updateRecoveryCodes', () => {
    it('should update mfaRecoveryCodes array', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.updateRecoveryCodes('uuid-123', [
        'new-code1-hash',
        'new-code2-hash',
      ]);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { mfaRecoveryCodes: ['new-code1-hash', 'new-code2-hash'] },
      });
    });
  });
});
