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
import { TokenDenyListService } from '../../auth/token-deny-list.service';
import { Provider } from '../enums/provider.enum';
import { Role } from '../enums/role.enum';

jest.mock('bcrypt');

describe('UsersService', () => {
  let usersService: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };
  let tokenDenyListService: jest.Mocked<TokenDenyListService>;

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
    refreshToken: null,
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: TokenDenyListService,
          useValue: {
            denyAllForUser: jest.fn().mockResolvedValue(undefined),
            denyToken: jest.fn().mockResolvedValue(undefined),
            isDenied: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    tokenDenyListService = module.get(TokenDenyListService);
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

  describe('updateRefreshToken', () => {
    it('should update refresh token for user', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.updateRefreshToken('uuid-123', 'hashed-refresh-token');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { refreshToken: 'hashed-refresh-token' },
      });
    });

    it('should set null to invalidate refresh token', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.updateRefreshToken('uuid-123', null);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { refreshToken: null },
      });
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
    it('should set lockedUntil to 15 minutes from now', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      const before = Date.now();
      await usersService.lockAccount('uuid-123');
      const after = Date.now();

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: {
          lockedUntil: expect.any(Date),
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
  });

  describe('changePassword', () => {
    const dto = { currentPassword: 'OldPass1!', newPassword: 'NewPass1!' };

    it('should change password and revoke sessions', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.changePassword('uuid-123', dto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { passwordHash: 'new-hash', refreshToken: null },
      });
    });

    it('should call denyAllForUser after password change', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      prisma.user.update.mockResolvedValue(mockUser);

      await usersService.changePassword('uuid-123', dto);

      expect(tokenDenyListService.denyAllForUser).toHaveBeenCalledWith('uuid-123', 900);
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.changePassword('uuid-123', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for OAuth-only accounts', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: null });

      await expect(usersService.changePassword('uuid-123', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(usersService.changePassword('uuid-123', dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should still succeed when denyAllForUser fails (fire-and-forget)', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      prisma.user.update.mockResolvedValue(mockUser);
      tokenDenyListService.denyAllForUser.mockRejectedValue(new Error('Redis down'));

      await expect(usersService.changePassword('uuid-123', dto)).resolves.toBeUndefined();
    });
  });

  describe('adminUpdateUser', () => {
    it('should update user role', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, role: Role.ADMIN });

      const result = await usersService.adminUpdateUser(
        'uuid-123',
        { role: Role.ADMIN },
        { role: Role.SUPERADMIN },
      );

      expect(result.role).toBe(Role.ADMIN);
    });

    it('should call denyAllForUser when deactivating user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      await usersService.adminUpdateUser(
        'uuid-123',
        { isActive: false },
        { role: Role.SUPERADMIN },
      );

      expect(tokenDenyListService.denyAllForUser).toHaveBeenCalledWith('uuid-123', 900);
    });

    it('should call denyAllForUser when changing role', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, role: Role.ADMIN });

      await usersService.adminUpdateUser(
        'uuid-123',
        { role: Role.ADMIN },
        { role: Role.SUPERADMIN },
      );

      expect(tokenDenyListService.denyAllForUser).toHaveBeenCalledWith('uuid-123', 900);
    });

    it('should throw NotFoundException when target not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        usersService.adminUpdateUser('uuid-123', { role: Role.ADMIN }, { role: Role.SUPERADMIN }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when target is SUPERADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, role: Role.SUPERADMIN });

      await expect(
        usersService.adminUpdateUser('uuid-123', { role: Role.ADMIN }, { role: Role.SUPERADMIN }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when non-SUPERADMIN assigns ADMIN role', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        usersService.adminUpdateUser('uuid-123', { role: Role.ADMIN }, { role: Role.ADMIN }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('softDelete', () => {
    it('should deactivate user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      await usersService.softDelete('uuid-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { isActive: false },
      });
    });

    it('should call denyAllForUser after soft delete', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      await usersService.softDelete('uuid-123');

      expect(tokenDenyListService.denyAllForUser).toHaveBeenCalledWith('uuid-123', 900);
    });

    it('should throw NotFoundException when target not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.softDelete('uuid-123')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when target is SUPERADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, role: Role.SUPERADMIN });

      await expect(usersService.softDelete('uuid-123')).rejects.toThrow(ForbiddenException);
    });

    it('should still succeed when denyAllForUser fails (fire-and-forget)', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });
      tokenDenyListService.denyAllForUser.mockRejectedValue(new Error('Redis down'));

      await expect(usersService.softDelete('uuid-123')).resolves.toBeUndefined();
    });
  });
});
