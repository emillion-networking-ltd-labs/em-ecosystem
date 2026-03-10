import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Provider } from '../enums/provider.enum';
import { Role } from '../enums/role.enum';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { SessionsService } from '../../sessions/sessions.service';
import { MailService } from '../../mail/mail.service';
import { PasswordBreachService } from '../../auth/password-breach.service';
import { TrustedDeviceService } from '../../auth/trusted-device.service';
import { TokenDenyListService } from '../../auth/token-deny-list.service';

jest.mock('bcrypt');

describe('UsersService', () => {
  let usersService: UsersService;
  let auditService: { log: jest.Mock };
  let sessionsService: { revokeAllUserSessions: jest.Mock };
  let passwordBreachService: { isBreached: jest.Mock };
  let trustedDeviceService: { revokeAllDevices: jest.Mock };
  let mailService: {
    sendPasswordChangeNotification: jest.Mock;
    sendEmailChangeVerificationEmail: jest.Mock;
    sendEmailChangeRequestNotification: jest.Mock;
    sendEmailChangedConfirmation: jest.Mock;
    sendAccountDeletionConfirmation: jest.Mock;
  };
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    emailVerificationToken: {
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    session: {
      deleteMany: jest.Mock;
    };
    passwordResetToken: {
      deleteMany: jest.Mock;
    };
    auditLog: {
      updateMany: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    oAuthAccount: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const mockUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    firstName: null,
    lastName: null,
    avatarUrl: null,
    role: Role.USER,
    emailVerified: false,
    pendingEmail: null,
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
      emailVerificationToken: {
        create: jest.fn().mockResolvedValue(undefined),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      session: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      passwordResetToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      auditLog: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      oAuthAccount: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        delete: jest.fn().mockResolvedValue(undefined),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };

    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    sessionsService = { revokeAllUserSessions: jest.fn().mockResolvedValue(undefined) };
    passwordBreachService = { isBreached: jest.fn().mockResolvedValue(false) };
    trustedDeviceService = { revokeAllDevices: jest.fn().mockResolvedValue(0) };

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
        {
          provide: MailService,
          useValue: {
            sendPasswordChangeNotification: jest.fn().mockResolvedValue(undefined),
            sendEmailChangeVerificationEmail: jest.fn().mockResolvedValue(undefined),
            sendEmailChangeRequestNotification: jest.fn().mockResolvedValue(undefined),
            sendEmailChangedConfirmation: jest.fn().mockResolvedValue(undefined),
            sendAccountDeletionConfirmation: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PasswordBreachService,
          useValue: passwordBreachService,
        },
        {
          provide: TrustedDeviceService,
          useValue: trustedDeviceService,
        },
        {
          provide: TokenDenyListService,
          useValue: { denyToken: jest.fn().mockResolvedValue(undefined), denyAllForUser: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    mailService = module.get(MailService);
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { oauthAccounts: { select: { provider: true } } },
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
        include: { oauthAccounts: { select: { provider: true } } },
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
        oauthAccounts: [{ provider: Provider.GOOGLE }],
      };
      prisma.oAuthAccount.findUnique.mockResolvedValue({
        provider: Provider.GOOGLE,
        providerId: 'google-id-123',
        user: existingOAuthUser,
      });

      const result = await usersService.findOrCreateByOAuth(googleProfile);

      expect(result).toEqual({ user: existingOAuthUser, action: 'login' });
      expect(prisma.oAuthAccount.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerId: {
            provider: Provider.GOOGLE,
            providerId: 'google-id-123',
          },
        },
        include: { user: { include: { oauthAccounts: { select: { provider: true } } } } },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should link OAuth to existing LOCAL account by updating provider', async () => {
      const localUser = {
        ...mockUser,
        email: 'oauth@example.com',
        emailVerified: true,
        oauthAccounts: [],
      };
      const linkedUser = {
        ...localUser,
        emailVerified: true,
        oauthAccounts: [{ provider: Provider.GOOGLE }],
      };
      // Step 1: No existing OAuthAccount
      prisma.oAuthAccount.findUnique.mockResolvedValue(null);
      // Step 2: findByEmail returns the local user
      prisma.user.findUnique.mockResolvedValue(localUser);
      // Step 3: $transaction for dual-write + OAuthAccount creation
      prisma.$transaction.mockResolvedValue([linkedUser]);

      const result = await usersService.findOrCreateByOAuth(googleProfile);

      expect(result).toEqual({ user: linkedUser, action: 'linked' });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException when email matches but is not verified', async () => {
      const unverifiedUser = {
        ...mockUser,
        email: 'oauth@example.com',
        emailVerified: false,
        oauthAccounts: [],
      };
      // No existing OAuthAccount
      prisma.oAuthAccount.findUnique.mockResolvedValue(null);
      // findByEmail returns unverified user
      prisma.user.findUnique.mockResolvedValue(unverifiedUser);

      await expect(
        usersService.findOrCreateByOAuth(googleProfile),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new user when no existing user with that email', async () => {
      const newOAuthUser = {
        ...mockUser,
        email: 'oauth@example.com',
        passwordHash: null,
        emailVerified: true,
        oauthAccounts: [{ provider: Provider.GOOGLE }],
      };
      // No existing OAuthAccount
      prisma.oAuthAccount.findUnique.mockResolvedValue(null);
      // No existing user by email
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(newOAuthUser);

      const result = await usersService.findOrCreateByOAuth(googleProfile);

      expect(result).toEqual({ user: newOAuthUser, action: 'created' });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'oauth@example.com',
          emailVerified: true,
          oauthAccounts: {
            create: {
              provider: Provider.GOOGLE,
              providerId: 'google-id-123',
              email: 'oauth@example.com',
            },
          },
        },
        include: { oauthAccounts: { select: { provider: true } } },
      });
    });

    it('should update profile fields when existing OAuth user has empty fields', async () => {
      const existingOAuthUser = {
        ...mockUser,
        email: 'oauth@example.com',
        firstName: null,
        lastName: null,
        avatarUrl: null,
        oauthAccounts: [{ provider: Provider.GOOGLE }],
      };
      const updatedUser = {
        ...existingOAuthUser,
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      };
      prisma.oAuthAccount.findUnique.mockResolvedValue({
        provider: Provider.GOOGLE,
        providerId: 'google-id-123',
        user: existingOAuthUser,
      });
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await usersService.findOrCreateByOAuth({
        ...googleProfile,
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      expect(result).toEqual({ user: updatedUser, action: 'login' });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: existingOAuthUser.id },
        data: {
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        include: { oauthAccounts: { select: { provider: true } } },
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

    it('should throw UnauthorizedException when user not found (CWE-200)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        usersService.changePassword('uuid-123', changeDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should allow setting password for OAuth accounts (no existing password)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });
      passwordBreachService.isBreached.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.changePassword('uuid-123', changeDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { passwordHash: 'new-hashed-password' },
      });
      // Should NOT revoke sessions/devices when setting password for the first time
      expect(sessionsService.revokeAllUserSessions).not.toHaveBeenCalled();
      expect(trustedDeviceService.revokeAllDevices).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        usersService.changePassword('uuid-123', changeDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when new password is breached', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      passwordBreachService.isBreached.mockResolvedValue(true);

      await expect(
        usersService.changePassword('uuid-123', changeDto),
      ).rejects.toThrow(BadRequestException);

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should hash new password, update, revoke all sessions and trusted devices', async () => {
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
      expect(trustedDeviceService.revokeAllDevices).toHaveBeenCalledWith('uuid-123');
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

    it('should revoke all sessions when deactivating a user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: true });
      prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      await usersService.adminUpdateUser(
        'uuid-123',
        { isActive: false },
        actingSuperadmin,
      );

      expect(sessionsService.revokeAllUserSessions).toHaveBeenCalledWith('uuid-123');
    });

    it('should NOT revoke sessions when activating a user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      prisma.user.findUnique.mockResolvedValue(inactiveUser);
      prisma.user.update.mockResolvedValue({ ...inactiveUser, isActive: true });

      await usersService.adminUpdateUser(
        'uuid-123',
        { isActive: true },
        actingSuperadmin,
      );

      expect(sessionsService.revokeAllUserSessions).not.toHaveBeenCalled();
    });

    it('should NOT revoke sessions on role-only change', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, role: Role.ADMIN });

      await usersService.adminUpdateUser(
        'uuid-123',
        { role: Role.ADMIN },
        actingSuperadmin,
      );

      expect(sessionsService.revokeAllUserSessions).not.toHaveBeenCalled();
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

    it('should revoke all sessions on soft delete', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      await usersService.softDelete('uuid-123', 'admin-1');

      expect(sessionsService.revokeAllUserSessions).toHaveBeenCalledWith('uuid-123');
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

  // ─── requestEmailChange ─────────────────────────────────────────

  describe('requestEmailChange', () => {
    const changeEmailDto = { newEmail: 'new@example.com', password: 'StrongPass1!' };

    it('should throw UnauthorizedException when user not found (CWE-200)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        usersService.requestEmailChange('uuid-123', changeEmailDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException for OAuth accounts (no passwordHash)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });

      await expect(
        usersService.requestEmailChange('uuid-123', changeEmailDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        usersService.requestEmailChange('uuid-123', changeEmailDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when new email is same as current (case-insensitive)', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        usersService.requestEmailChange('uuid-123', {
          newEmail: 'TEST@EXAMPLE.COM',
          password: 'StrongPass1!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when new email is already registered', async () => {
      // findById returns the user, then findByEmail returns an existing user
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: 'uuid-other', email: 'new@example.com' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        usersService.requestEmailChange('uuid-123', changeEmailDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should store pendingEmail and create verification token on success', async () => {
      // findById returns user, findByEmail returns null (email available)
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({ ...mockUser, pendingEmail: 'new@example.com' });

      await usersService.requestEmailChange('uuid-123', changeEmailDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { pendingEmail: 'new@example.com' },
      });
      expect(prisma.emailVerificationToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'uuid-123',
          type: 'EMAIL_CHANGE',
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should send verification email to new address and notification to old address', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({ ...mockUser, pendingEmail: 'new@example.com' });

      await usersService.requestEmailChange('uuid-123', changeEmailDto);

      expect(mailService.sendEmailChangeVerificationEmail).toHaveBeenCalledWith(
        'new@example.com',
        expect.any(String),
        mockUser.firstName,
      );
      expect(mailService.sendEmailChangeRequestNotification).toHaveBeenCalledWith(
        mockUser.email,
        'new@example.com',
        mockUser.firstName,
      );
    });

    it('should fire EMAIL_CHANGE_REQUESTED audit log', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({ ...mockUser, pendingEmail: 'new@example.com' });

      await usersService.requestEmailChange('uuid-123', changeEmailDto, {
        ipAddress: '10.0.0.1',
        userAgent: 'test-agent',
      });

      expect(auditService.log).toHaveBeenCalledWith({
        action: AuditAction.EMAIL_CHANGE_REQUESTED,
        userId: 'uuid-123',
        ipAddress: '10.0.0.1',
        userAgent: 'test-agent',
        metadata: { newEmail: 'new@example.com' },
      });
    });

    it('should not throw when audit log rejects (fire-and-forget)', async () => {
      auditService.log.mockRejectedValue(new Error('audit fail'));
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({ ...mockUser, pendingEmail: 'new@example.com' });

      const result = await usersService.requestEmailChange('uuid-123', changeEmailDto, {
        ipAddress: '10.0.0.1',
        userAgent: 'test-agent',
      });

      await new Promise(process.nextTick);

      expect(result).toEqual({ message: 'Verification email sent to new address' });
    });
  });

  // ── selfDeleteAccount (SCRUM-105) ──

  describe('selfDeleteAccount', () => {
    const deleteDto = { password: 'ValidPass1!' };
    const ctx = { ipAddress: '10.0.0.1', userAgent: 'test-agent' };

    it('should throw UnauthorizedException when user not found (CWE-200)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        usersService.selfDeleteAccount('nonexistent', deleteDto, ctx),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for SUPERADMIN accounts', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        role: 'SUPERADMIN',
      });

      await expect(
        usersService.selfDeleteAccount('uuid-123', deleteDto, ctx),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when local account provides no password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        usersService.selfDeleteAccount('uuid-123', {}, ctx),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        usersService.selfDeleteAccount('uuid-123', deleteDto, ctx),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should succeed for local account with correct password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await usersService.selfDeleteAccount('uuid-123', deleteDto, ctx);

      expect(result).toEqual({ message: 'Account deleted successfully' });
    });

    it('should succeed for OAuth-only account without password', async () => {
      const oauthUser = { ...mockUser, passwordHash: null };
      prisma.user.findUnique.mockResolvedValue(oauthUser);

      const result = await usersService.selfDeleteAccount('uuid-123', {}, ctx);

      expect(result).toEqual({ message: 'Account deleted successfully' });
    });

    it('should send confirmation email before anonymization', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await usersService.selfDeleteAccount('uuid-123', deleteDto, ctx);

      expect(mailService.sendAccountDeletionConfirmation).toHaveBeenCalledWith(
        'test@example.com',
        null,
      );
      // Email should be called before $transaction
      const emailCallOrder = mailService.sendAccountDeletionConfirmation.mock.invocationCallOrder[0];
      const txCallOrder = prisma.$transaction.mock.invocationCallOrder[0];
      expect(emailCallOrder).toBeLessThan(txCallOrder);
    });

    it('should execute $transaction with 5 operations', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await usersService.selfDeleteAccount('uuid-123', deleteDto, ctx);

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.anything(), // user.update (anonymize)
          expect.anything(), // session.deleteMany
          expect.anything(), // emailVerificationToken.deleteMany
          expect.anything(), // passwordResetToken.deleteMany
          expect.anything(), // auditLog.updateMany
        ]),
      );
      // Verify exactly 5 operations
      expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(5);
    });

    it('should anonymize all PII fields in the transaction', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await usersService.selfDeleteAccount('uuid-123', deleteDto, ctx);

      // The user.update call is part of the $transaction array
      // Verify that prisma.user.update was called with anonymization data
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: expect.objectContaining({
          email: 'deleted-uuid-123@anonymized.local',
          passwordHash: null,
          firstName: null,
          lastName: null,
          avatarUrl: null,
          pendingEmail: null,
          emailVerified: false,
          isActive: false,
          failedAttempts: 0,
          lockedUntil: null,
          lockoutCount: 0,
          mfaEnabled: false,
          mfaSecret: null,
          mfaRecoveryCodes: [],
        }),
      });
    });

    it('should delete all sessions', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await usersService.selfDeleteAccount('uuid-123', deleteDto, ctx);

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'uuid-123' },
      });
    });

    it('should delete all email verification tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await usersService.selfDeleteAccount('uuid-123', deleteDto, ctx);

      expect(prisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'uuid-123' },
      });
    });

    it('should delete all password reset tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await usersService.selfDeleteAccount('uuid-123', deleteDto, ctx);

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'uuid-123' },
      });
    });

    it('should scrub audit log PII (ipAddress, userAgent, metadata)', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await usersService.selfDeleteAccount('uuid-123', deleteDto, ctx);

      expect(prisma.auditLog.updateMany).toHaveBeenCalledWith({
        where: { OR: [{ userId: 'uuid-123' }, { targetUserId: 'uuid-123' }] },
        data: { ipAddress: null, userAgent: null, metadata: expect.anything() },
      });
    });

    it('should log ACCOUNT_SELF_DELETED audit after transaction', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await usersService.selfDeleteAccount('uuid-123', deleteDto, ctx);

      expect(auditService.log).toHaveBeenCalledWith({
        action: AuditAction.ACCOUNT_SELF_DELETED,
        userId: 'uuid-123',
        ipAddress: '10.0.0.1',
        userAgent: 'test-agent',
      });
    });

    it('should not throw when audit log rejects (fire-and-forget)', async () => {
      auditService.log.mockRejectedValue(new Error('audit fail'));
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await usersService.selfDeleteAccount('uuid-123', deleteDto, ctx);

      await new Promise(process.nextTick);

      expect(result).toEqual({ message: 'Account deleted successfully' });
    });
  });

  // ─── linkOAuthProvider (SCRUM-169) ──────────────────────────────

  describe('linkOAuthProvider', () => {
    const oauthProfile = {
      email: 'test@example.com',
      provider: Provider.GOOGLE,
      providerId: 'google-123',
      firstName: 'Test',
      lastName: 'User',
      avatarUrl: undefined,
    };
    const ctx = { ipAddress: '10.0.0.1', userAgent: 'test-agent' };

    it('rejects when OAuth email differs from user email', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        email: 'alice@example.com',
      });

      await expect(
        usersService.linkOAuthProvider(
          mockUser.id,
          { ...oauthProfile, email: 'bob@different.com' },
          ctx,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts matching email case-insensitively', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        email: 'Test@Example.COM',
      });
      prisma.oAuthAccount.findUnique.mockResolvedValue(null);
      prisma.oAuthAccount.create.mockResolvedValue({
        provider: Provider.GOOGLE,
        providerId: 'google-123',
        email: 'test@example.com',
        createdAt: new Date(),
      });

      const result = await usersService.linkOAuthProvider(
        mockUser.id,
        { ...oauthProfile, email: 'test@example.com' },
        ctx,
      );

      expect(result.provider).toBe(Provider.GOOGLE);
    });

    it('rejects when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        usersService.linkOAuthProvider(mockUser.id, oauthProfile, ctx),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── unlinkOAuth (SCRUM-111) ──────────────────────────────────

  describe('unlinkOAuth', () => {
    const unlinkDto = { password: 'ValidPass1!' };
    const ctx = { ipAddress: '10.0.0.1', userAgent: 'test-agent' };

    const googleUser = {
      ...mockUser,
      passwordHash: 'hashed-password',
      oauthAccounts: [{ provider: Provider.GOOGLE }],
    };

    const githubUser = {
      ...mockUser,
      passwordHash: 'hashed-password',
      oauthAccounts: [{ provider: Provider.GITHUB }],
    };

    const googleAccount = {
      id: 'oauth-acc-1',
      userId: 'uuid-123',
      provider: Provider.GOOGLE,
      providerId: 'google-id-123',
      email: 'test@example.com',
    };

    const githubAccount = {
      id: 'oauth-acc-2',
      userId: 'uuid-123',
      provider: Provider.GITHUB,
      providerId: 'github-id-456',
      email: 'test@example.com',
    };

    it('should successfully unlink Google provider', async () => {
      prisma.user.findUnique.mockResolvedValue(googleUser);
      prisma.oAuthAccount.findUnique.mockResolvedValue(googleAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.oAuthAccount.delete.mockResolvedValue(googleAccount);

      const result = await usersService.unlinkOAuth('uuid-123', 'GOOGLE', unlinkDto, ctx);

      expect(result).toEqual({ message: 'OAuth provider unlinked successfully' });
      expect(prisma.oAuthAccount.delete).toHaveBeenCalledWith({
        where: { id: googleAccount.id },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should successfully unlink GitHub provider', async () => {
      prisma.user.findUnique.mockResolvedValue(githubUser);
      prisma.oAuthAccount.findUnique.mockResolvedValue(githubAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.oAuthAccount.delete.mockResolvedValue(githubAccount);

      const result = await usersService.unlinkOAuth('uuid-123', 'GITHUB', unlinkDto, ctx);

      expect(result).toEqual({ message: 'OAuth provider unlinked successfully' });
      expect(prisma.oAuthAccount.delete).toHaveBeenCalledWith({
        where: { id: githubAccount.id },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should not revoke sessions after unlink', async () => {
      prisma.user.findUnique.mockResolvedValue(googleUser);
      prisma.oAuthAccount.findUnique.mockResolvedValue(googleAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.oAuthAccount.delete.mockResolvedValue(googleAccount);

      await usersService.unlinkOAuth('uuid-123', 'GOOGLE', unlinkDto, ctx);

      expect(sessionsService.revokeAllUserSessions).not.toHaveBeenCalled();
    });

    it('should not revoke trusted devices after unlink', async () => {
      prisma.user.findUnique.mockResolvedValue(googleUser);
      prisma.oAuthAccount.findUnique.mockResolvedValue(googleAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.oAuthAccount.delete.mockResolvedValue(googleAccount);

      await usersService.unlinkOAuth('uuid-123', 'GOOGLE', unlinkDto, ctx);

      expect(trustedDeviceService.revokeAllDevices).not.toHaveBeenCalled();
    });

    it('should audit OAUTH_UNLINKED with provider metadata', async () => {
      prisma.user.findUnique.mockResolvedValue(googleUser);
      prisma.oAuthAccount.findUnique.mockResolvedValue(googleAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.oAuthAccount.delete.mockResolvedValue(googleAccount);

      await usersService.unlinkOAuth('uuid-123', 'GOOGLE', unlinkDto, ctx);

      expect(auditService.log).toHaveBeenCalledWith({
        action: AuditAction.OAUTH_UNLINKED,
        userId: 'uuid-123',
        ipAddress: '10.0.0.1',
        userAgent: 'test-agent',
        metadata: { provider: Provider.GOOGLE, providerId: 'google-id-123' },
      });
    });

    it('should throw UnauthorizedException if user not found (CWE-200)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        usersService.unlinkOAuth('nonexistent', 'GOOGLE', unlinkDto, ctx),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if provider not linked', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, oauthAccounts: [] });
      prisma.oAuthAccount.findUnique.mockResolvedValue(null);

      await expect(
        usersService.unlinkOAuth('uuid-123', 'GOOGLE', unlinkDto, ctx),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no password set (OAuth-only)', async () => {
      const oauthOnlyUser = { ...googleUser, passwordHash: null };
      prisma.user.findUnique.mockResolvedValue(oauthOnlyUser);
      prisma.oAuthAccount.findUnique.mockResolvedValue(googleAccount);

      await expect(
        usersService.unlinkOAuth('uuid-123', 'GOOGLE', unlinkDto, ctx),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(googleUser);
      prisma.oAuthAccount.findUnique.mockResolvedValue(googleAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        usersService.unlinkOAuth('uuid-123', 'GOOGLE', unlinkDto, ctx),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not throw when audit log rejects (fire-and-forget)', async () => {
      auditService.log.mockRejectedValue(new Error('audit fail'));
      prisma.user.findUnique.mockResolvedValue(googleUser);
      prisma.oAuthAccount.findUnique.mockResolvedValue(googleAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.oAuthAccount.delete.mockResolvedValue(googleAccount);

      const result = await usersService.unlinkOAuth('uuid-123', 'GOOGLE', unlinkDto, ctx);

      await new Promise(process.nextTick);

      expect(result).toEqual({ message: 'OAuth provider unlinked successfully' });
    });

    it('should pass ipAddress and userAgent from ctx to audit', async () => {
      prisma.user.findUnique.mockResolvedValue(googleUser);
      prisma.oAuthAccount.findUnique.mockResolvedValue(googleAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.oAuthAccount.delete.mockResolvedValue(googleAccount);

      await usersService.unlinkOAuth('uuid-123', 'GOOGLE', unlinkDto, {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      );
    });

    it('should work without ctx parameter', async () => {
      prisma.user.findUnique.mockResolvedValue(googleUser);
      prisma.oAuthAccount.findUnique.mockResolvedValue(googleAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.oAuthAccount.delete.mockResolvedValue(googleAccount);

      const result = await usersService.unlinkOAuth('uuid-123', 'GOOGLE', unlinkDto);

      expect(result).toEqual({ message: 'OAuth provider unlinked successfully' });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: undefined,
          userAgent: undefined,
        }),
      );
    });
  });

  // ─── getSecurityActivity (SCRUM-135) ─────────────────────────

  describe('getSecurityActivity', () => {
    const mockLogs = [
      {
        id: 'log-1',
        action: 'LOGIN_SUCCESS',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: null,
        createdAt: new Date('2026-03-05T10:00:00Z'),
      },
      {
        id: 'log-2',
        action: 'PASSWORD_CHANGE',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { updatedFields: ['password'] },
        createdAt: new Date('2026-03-05T09:00:00Z'),
      },
    ];

    it('should return paginated security events for the user', async () => {
      prisma.auditLog.findMany.mockResolvedValue(mockLogs);
      prisma.auditLog.count.mockResolvedValue(2);

      const result = await usersService.getSecurityActivity('uuid-123', 1, 20);

      expect(result).toEqual({
        data: mockLogs,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });
    });

    it('should filter by userId only (not targetUserId)', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await usersService.getSecurityActivity('uuid-123', 1, 20);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'uuid-123' },
        }),
      );
      expect(prisma.auditLog.count).toHaveBeenCalledWith({
        where: { userId: 'uuid-123' },
      });
    });

    it('should use select to exclude sensitive fields', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await usersService.getSecurityActivity('uuid-123', 1, 20);

      const findManyCall = prisma.auditLog.findMany.mock.calls[0][0];
      expect(findManyCall.select).toEqual({
        id: true,
        action: true,
        ipAddress: true,
        userAgent: true,
        metadata: true,
        createdAt: true,
      });
      expect(findManyCall.select.userId).toBeUndefined();
      expect(findManyCall.select.targetUserId).toBeUndefined();
    });

    it('should order by createdAt DESC', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await usersService.getSecurityActivity('uuid-123', 1, 20);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should calculate skip and take correctly for pagination', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(45);

      const result = await usersService.getSecurityActivity('uuid-123', 2, 10);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.meta).toEqual({
        total: 45,
        page: 2,
        limit: 10,
        totalPages: 5,
      });
    });

    it('should return empty results when user has no activity', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      const result = await usersService.getSecurityActivity('uuid-123', 1, 20);

      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
    });

    it('should calculate totalPages correctly with remainder', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(45);

      const result = await usersService.getSecurityActivity('uuid-123', 1, 20);

      expect(result.meta.totalPages).toBe(3);
    });
  });
});
