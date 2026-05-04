import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { UsersService } from '../../users/users.service';
import { TokenDenyListService } from '../token-deny-list.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../users/enums/role.enum';

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
        {
          provide: TokenDenyListService,
          useValue: {
            isDenied: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                'auth.jwtSecret':
                  'test-secret-that-is-at-least-32-characters-long',
                'auth.jwtAccessExpiration': '15m',
                'auth.jwtRefreshExpiration': '12h',
                'auth.sessionIdleTimeoutHours': 0.5,
                'auth.maxConcurrentSessions': 5,
                'auth.trustedDeviceTtlDays': 30,
                'auth.mfaAppName': 'EM NexaCore',
                'auth.webauthnRpId': 'localhost',
                'auth.webauthnRpName': 'EM NexaCore',
                'auth.webauthnOrigin': 'http://localhost:3001',
                'oauth.googleClientId': 'test-google-id',
                'oauth.googleClientSecret': 'test-google-secret',
                'oauth.googleCallbackUrl':
                  'http://localhost:3000/auth/google/callback',
                'oauth.githubClientId': 'test-github-id',
                'oauth.githubClientSecret': 'test-github-secret',
                'oauth.githubCallbackUrl':
                  'http://localhost:3000/auth/github/callback',
                'app.nodeEnv': 'test',
                'app.frontendUrl': 'http://localhost:3001',
                'app.oauthAllowedRedirectUrls': '',
                'app.isProduction': false,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
    tokenDenyListService = module.get(TokenDenyListService);
  });

  describe('validate', () => {
    it('should return SafeUser when user exists', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate({
        sub: 'uuid-123',
        email: 'test@example.com',
        role: Role.USER,
        jti: 'test-jti-123',
        iat: Math.floor(Date.now() / 1000),
      });

      expect(result.id).toBe('uuid-123');
      expect(result.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshToken');
      expect(tokenDenyListService.isDenied).toHaveBeenCalledWith(
        'test-jti-123',
        'uuid-123',
        expect.any(Number),
        undefined, // SCRUM-347: sessionId param — undefined here (legacy payload shape)
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        strategy.validate({
          sub: 'nonexistent-id',
          email: 'test@example.com',
          role: Role.USER,
          jti: 'test-jti-456',
          iat: Math.floor(Date.now() / 1000),
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is deactivated', async () => {
      usersService.findById.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        strategy.validate({
          sub: 'uuid-123',
          email: 'test@example.com',
          role: Role.USER,
          jti: 'test-jti-789',
          iat: Math.floor(Date.now() / 1000),
        }),
      ).rejects.toThrow(new UnauthorizedException('Authentication failed'));
    });

    it('should throw UnauthorizedException when token is denied', async () => {
      tokenDenyListService.isDenied.mockResolvedValue(true);

      await expect(
        strategy.validate({
          sub: 'uuid-123',
          email: 'test@example.com',
          role: Role.USER,
          jti: 'denied-jti',
          iat: Math.floor(Date.now() / 1000),
        }),
      ).rejects.toThrow(new UnauthorizedException('Authentication failed'));
    });

    // SCRUM-347 — per-session deny propagation
    it('should pass payload.sessionId to isDenied when present', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      await strategy.validate({
        sub: 'uuid-123',
        email: 'test@example.com',
        role: Role.USER,
        jti: 'test-jti-session',
        sessionId: 'session-abc',
        iat: Math.floor(Date.now() / 1000),
      });

      expect(tokenDenyListService.isDenied).toHaveBeenCalledWith(
        'test-jti-session',
        'uuid-123',
        expect.any(Number),
        'session-abc',
      );
    });

    it('should reject token when sessionId-based deny applies (instant per-session revocation)', async () => {
      // Simulate isDenied returning true because of the sessionId leg of the
      // composite deny check (not jti, not user). The strategy doesn't see
      // which leg triggered — only that isDenied returned true.
      tokenDenyListService.isDenied.mockResolvedValue(true);

      await expect(
        strategy.validate({
          sub: 'uuid-123',
          email: 'test@example.com',
          role: Role.USER,
          jti: 'fresh-jti',
          sessionId: 'revoked-session-id',
          iat: Math.floor(Date.now() / 1000),
        }),
      ).rejects.toThrow(new UnauthorizedException('Authentication failed'));
    });
  });
});
