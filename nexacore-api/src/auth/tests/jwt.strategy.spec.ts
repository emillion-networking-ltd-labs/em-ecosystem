import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { UsersService } from '../../users/users.service';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';
import { User } from '../../users/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;

  const mockUser: User = {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
  });

  describe('validate', () => {
    it('should return SafeUser when user exists', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate({
        sub: 'uuid-123',
        email: 'test@example.com',
        role: Role.USER,
      });

      expect(result.id).toBe('uuid-123');
      expect(result.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        strategy.validate({
          sub: 'nonexistent-id',
          email: 'test@example.com',
          role: Role.USER,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
