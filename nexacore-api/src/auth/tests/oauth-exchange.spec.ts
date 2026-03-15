import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { OAuthController } from '../oauth.controller';
import { AuthService } from '../auth.service';
import { OAuthLinkCodeStore } from '../stores/oauth-link-code.store';
import { TurnstileService } from '../../security/turnstile.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../users/enums/role.enum';

describe('OAuth Exchange Flow (Integration)', () => {
  let controller: OAuthController;
  let authService: { [key: string]: jest.Mock };

  /** In-memory store that simulates the Redis-backed OAuthCodeStore */
  const codeMap = new Map<string, any>();

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

  const mockUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    firstName: null,
    lastName: null,
    avatarUrl: null,
    role: Role.USER,
    hasPassword: false,
    oauthProviders: ['GOOGLE'],
    emailVerified: true,
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    lockoutCount: 0,
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRes = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    codeMap.clear();

    authService = {
      generateOAuthCode: jest.fn().mockImplementation(async (payload) => {
        const code = `code-${Date.now()}-${Math.random()}`;
        codeMap.set(code, payload);
        return code;
      }),
      exchangeOAuthCode: jest.fn().mockImplementation(async (code) => {
        const result = codeMap.get(code) || null;
        codeMap.delete(code);
        if (!result) {
          throw new UnauthorizedException(
            'Invalid or expired authorization code',
          );
        }
        return result;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OAuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
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
              const config: Record<string, any> = {
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
  });

  it('should complete the full OAuth code exchange cycle via cookie', async () => {
    const tokenPayload = {
      accessToken: 'real-access-token',
      user: mockUser,
      cookie: mockCookie,
    };
    const req = { user: tokenPayload };
    const redirectResult = await controller.googleAuthCallback(
      req,
      mockRes as any,
    );

    // URL should NOT contain code
    expect(redirectResult.url).toBe('http://localhost:3001/auth/callback');
    expect(redirectResult.url).not.toContain('?code=');

    // Code should be set as httpOnly cookie
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'oauth_code',
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: 'strict' }),
    );

    // Extract code from the cookie call
    const code = mockRes.cookie.mock.calls[0][1];

    // Exchange using cookie
    const exchangeReq = { cookies: { oauth_code: code } };
    const exchangeResult = await controller.exchangeOAuthCode(
      exchangeReq,
      mockRes as any,
    );
    expect(exchangeResult.accessToken).toBe('real-access-token');
    expect(exchangeResult.user.email).toBe('test@example.com');
    expect(mockRes.clearCookie).toHaveBeenCalledWith('oauth_code', {
      path: '/',
    });
  });

  it('should reject a code that has already been used', async () => {
    const req = {
      user: { accessToken: 'at', user: mockUser, cookie: mockCookie },
    };
    await controller.googleAuthCallback(req, mockRes as any);
    const code = mockRes.cookie.mock.calls[0][1];

    // First exchange succeeds
    await controller.exchangeOAuthCode(
      { cookies: { oauth_code: code } },
      mockRes as any,
    );

    // Second exchange fails
    await expect(
      controller.exchangeOAuthCode(
        { cookies: { oauth_code: code } },
        mockRes as any,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject a fabricated code', async () => {
    await expect(
      controller.exchangeOAuthCode(
        { cookies: { oauth_code: 'fabricated-code-123' } },
        mockRes as any,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject when no cookie is present', async () => {
    await expect(
      controller.exchangeOAuthCode({ cookies: {} }, mockRes as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject when cookies object is undefined', async () => {
    await expect(
      controller.exchangeOAuthCode({}, mockRes as any),
    ).rejects.toThrow(UnauthorizedException);
  });
});
