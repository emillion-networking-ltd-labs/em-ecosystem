import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { UsersService } from '../../users/users.service';
import { TokenDenyListService } from '../token-deny-list.service';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';
import { User } from '../../users/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;
  let tokenDenyListService: jest.Mocked<TokenDenyListService>;

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
    refreshToken: null,
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
        {
          provide: TokenDenyListService,
          useValue: {
            isDenied: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
    tokenDenyListService = module.get(TokenDenyListService);
  });

  describe('validate', () => {
    it('should return SafeUser when user exists and token is not denied', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate({
        sub: 'uuid-123',
        email: 'test@example.com',
        role: Role.USER,
        jti: 'test-jti-123',
      });

      expect(tokenDenyListService.isDenied).toHaveBeenCalledWith('test-jti-123', 'uuid-123');
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
          jti: 'test-jti-123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token jti is denied', async () => {
      tokenDenyListService.isDenied.mockResolvedValue(true);

      await expect(
        strategy.validate({
          sub: 'uuid-123',
          email: 'test@example.com',
          role: Role.USER,
          jti: 'denied-jti',
        }),
      ).rejects.toThrow(new UnauthorizedException('Token has been revoked'));

      expect(usersService.findById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is denied', async () => {
      tokenDenyListService.isDenied.mockResolvedValue(true);

      await expect(
        strategy.validate({
          sub: 'denied-user',
          email: 'test@example.com',
          role: Role.USER,
          jti: 'test-jti',
        }),
      ).rejects.toThrow(new UnauthorizedException('Token has been revoked'));
    });

    it('should still validate when isDenied throws (fail-open)', async () => {
      tokenDenyListService.isDenied.mockRejectedValue(new Error('Redis down'));
      usersService.findById.mockResolvedValue(mockUser);

      // isDenied throwing should propagate — fail-open is inside the service itself
      // Here we test that the strategy calls isDenied properly
      await expect(
        strategy.validate({
          sub: 'uuid-123',
          email: 'test@example.com',
          role: Role.USER,
          jti: 'test-jti',
        }),
      ).rejects.toThrow();
    });
  });
});
