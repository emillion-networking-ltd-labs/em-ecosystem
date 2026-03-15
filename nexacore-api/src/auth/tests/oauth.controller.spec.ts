import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { OAuthController } from '../oauth.controller';
import { AuthService } from '../auth.service';
import { OAuthLinkCodeStore } from '../stores/oauth-link-code.store';
import { TurnstileService } from '../../security/turnstile.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../users/enums/role.enum';

describe('OAuthController', () => {
  let controller: OAuthController;
  let authService: jest.Mocked<AuthService>;

  const mockCookie = {
    name: 'refresh_token',
    value: 'signed-refresh-jwt',
    options: {
      httpOnly: true,
      secure: false,
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 604800,
    },
  };

  const mockAuthResult = {
    accessToken: 'access-token-123',
    user: {
      id: 'uuid-123',
      email: 'test@example.com',
      firstName: null,
      lastName: null,
      avatarUrl: null,
      role: Role.USER,
      hasPassword: true,
      oauthProviders: [],
      emailVerified: false,
      isActive: true,
      failedAttempts: 0,
      lockedUntil: null,
      lockoutCount: 0,
      mfaEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    cookie: mockCookie,
  };

  const mockRes = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OAuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            generateOAuthCode: jest
              .fn()
              .mockResolvedValue('ephemeral-code-uuid'),
            exchangeOAuthCode: jest.fn(),
          },
        },
        {
          provide: OAuthLinkCodeStore,
          useValue: {
            generate: jest.fn().mockResolvedValue('test-link-code'),
            consume: jest.fn().mockResolvedValue('uuid-123'),
          },
        },
        {
          provide: TurnstileService,
          useValue: {
            verify: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'app.frontendUrl': 'http://localhost:3001',
                'app.oauthAllowedRedirectUrls': '',
                'app.nodeEnv': 'development',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<OAuthController>(OAuthController);
    authService = module.get(AuthService);
  });

  describe('googleAuth', () => {
    it('should be defined (guard handles redirect)', () => {
      expect(controller.googleAuth()).toBeUndefined();
    });
  });

  describe('githubAuth', () => {
    it('should be defined (guard handles redirect)', () => {
      expect(controller.githubAuth()).toBeUndefined();
    });
  });

  describe('googleAuthCallback', () => {
    it('should set oauth_code cookie and redirect without code in URL', async () => {
      const req = {
        user: {
          accessToken: 'google-access',
          user: mockAuthResult.user,
          cookie: mockCookie,
        },
      };

      const result = await controller.googleAuthCallback(req, mockRes as any);

      expect(result.url).toBe('http://localhost:3001/auth/callback');
      expect(result.url).not.toContain('?code=');
      expect(result.url).not.toContain('accessToken');
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'oauth_code',
        'ephemeral-code-uuid',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 30_000,
        }),
      );
      expect(authService.generateOAuthCode).toHaveBeenCalledWith(req.user);
    });
  });

  describe('githubAuthCallback', () => {
    it('should set oauth_code cookie and redirect without code in URL', async () => {
      const req = {
        user: {
          accessToken: 'github-access',
          user: mockAuthResult.user,
          cookie: mockCookie,
        },
      };

      const result = await controller.githubAuthCallback(req, mockRes as any);

      expect(result.url).toBe('http://localhost:3001/auth/callback');
      expect(result.url).not.toContain('?code=');
      expect(result.url).not.toContain('accessToken');
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'oauth_code',
        'ephemeral-code-uuid',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 30_000,
        }),
      );
      expect(authService.generateOAuthCode).toHaveBeenCalledWith(req.user);
    });
  });

  describe('exchangeOAuthCode', () => {
    it('should have @Throttle decorator', () => {
      const limitMeta = Reflect.getMetadata(
        'THROTTLER:LIMITglobal',
        controller.exchangeOAuthCode,
      );
      const ttlMeta = Reflect.getMetadata(
        'THROTTLER:TTLglobal',
        controller.exchangeOAuthCode,
      );
      expect(limitMeta).toBeDefined();
      expect(ttlMeta).toBeDefined();
    });

    it('should read code from cookie, clear it, and return tokens', async () => {
      authService.exchangeOAuthCode.mockResolvedValue(mockAuthResult as any);
      const req = { cookies: { oauth_code: 'valid-code' } };

      const result = await controller.exchangeOAuthCode(req, mockRes as any);

      expect(authService.exchangeOAuthCode).toHaveBeenCalledWith('valid-code');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('oauth_code', {
        path: '/',
      });
      expect(result.accessToken).toBe('access-token-123');
      expect(result.user.email).toBe('test@example.com');
      expect(mockRes.cookie).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when cookie is missing', async () => {
      const req = { cookies: {} };

      await expect(
        controller.exchangeOAuthCode(req, mockRes as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when cookies object is undefined', async () => {
      const req = {};

      await expect(
        controller.exchangeOAuthCode(req, mockRes as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should propagate UnauthorizedException for invalid code', async () => {
      authService.exchangeOAuthCode.mockRejectedValue(
        new UnauthorizedException('Invalid or expired authorization code'),
      );
      const req = { cookies: { oauth_code: 'invalid-code' } };

      await expect(
        controller.exchangeOAuthCode(req, mockRes as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
