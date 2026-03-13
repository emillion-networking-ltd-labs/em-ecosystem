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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    cookie: mockCookie,
  };

  const mockRes = {
    cookie: jest.fn(),
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
    it('should return redirect URL with ephemeral code', async () => {
      const req = {
        user: {
          accessToken: 'google-access',
          user: mockAuthResult.user,
          cookie: mockCookie,
        },
      };

      const result = await controller.googleAuthCallback(req);

      expect(result.url).toBe(
        'http://localhost:3001/auth/callback?code=ephemeral-code-uuid',
      );
      expect(result.url).not.toContain('accessToken');
      expect(authService.generateOAuthCode).toHaveBeenCalledWith(req.user);
    });
  });

  describe('githubAuthCallback', () => {
    it('should return redirect URL with ephemeral code', async () => {
      const req = {
        user: {
          accessToken: 'github-access',
          user: mockAuthResult.user,
          cookie: mockCookie,
        },
      };

      const result = await controller.githubAuthCallback(req);

      expect(result.url).toBe(
        'http://localhost:3001/auth/callback?code=ephemeral-code-uuid',
      );
      expect(result.url).not.toContain('accessToken');
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

    it('should set cookie and return accessToken + user for a valid code', async () => {
      authService.exchangeOAuthCode.mockResolvedValue(mockAuthResult as any);

      const result = await controller.exchangeOAuthCode(
        { code: 'valid-code' },
        mockRes as any,
      );

      expect(authService.exchangeOAuthCode).toHaveBeenCalledWith('valid-code');
      expect(result.accessToken).toBe('access-token-123');
      expect(result.user.email).toBe('test@example.com');
      expect(mockRes.cookie).toHaveBeenCalled();
    });

    it('should propagate UnauthorizedException for invalid code', async () => {
      authService.exchangeOAuthCode.mockRejectedValue(
        new UnauthorizedException('Invalid or expired authorization code'),
      );

      await expect(
        controller.exchangeOAuthCode({ code: 'invalid-code' }, mockRes as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
