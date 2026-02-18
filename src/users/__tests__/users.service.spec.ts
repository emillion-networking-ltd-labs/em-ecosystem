import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Provider } from '../enums/provider.enum';
import { Role } from '../enums/role.enum';

describe('UsersService', () => {
  let usersService: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: Role.USER,
    provider: Provider.LOCAL,
    providerId: null,
    emailVerified: false,
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
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
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
});
