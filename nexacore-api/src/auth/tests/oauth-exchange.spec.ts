import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { TrustedDeviceService } from '../trusted-device.service';
import { SessionsService } from '../../sessions/sessions.service';
import { AuditService } from '../../audit/audit.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';

describe('OAuth Exchange Flow (Integration)', () => {
  let controller: AuthController;
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
    provider: Provider.GOOGLE,
    providerId: 'google-123',
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
  };

  beforeEach(async () => {
    codeMap.clear();

    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
      buildClearCookie: jest.fn(),
      generateOAuthCode: jest
        .fn()
        .mockImplementation(async (payload) => {
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
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: SessionsService,
          useValue: {
            getActiveSessions: jest.fn(),
            revokeSession: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            getPermissionKeysForRole: jest
              .fn()
              .mockResolvedValue(['dashboard:read']),
          },
        },
        {
          provide: TrustedDeviceService,
          useValue: {
            trustDevice: jest.fn(),
            listTrustedDevices: jest.fn(),
            revokeDevice: jest.fn(),
            revokeAllDevices: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should complete the full OAuth code exchange cycle', async () => {
    const tokenPayload = {
      accessToken: 'real-access-token',
      user: mockUser,
      cookie: mockCookie,
    };
    const req = { user: tokenPayload };
    const redirectResult = await controller.googleAuthCallback(req);

    const url = new URL(redirectResult.url);
    const code = url.searchParams.get('code');
    expect(code).toBeTruthy();
    expect(url.searchParams.has('accessToken')).toBe(false);
    expect(url.searchParams.has('refreshToken')).toBe(false);

    const exchangeResult = await controller.exchangeOAuthCode(
      { code: code! },
      mockRes as any,
    );
    expect(exchangeResult.accessToken).toBe('real-access-token');
    expect(exchangeResult.user.email).toBe('test@example.com');
    expect(mockRes.cookie).toHaveBeenCalled();
  });

  it('should reject a code that has already been used', async () => {
    const req = {
      user: { accessToken: 'at', user: mockUser, cookie: mockCookie },
    };
    const redirectResult = await controller.googleAuthCallback(req);
    const code = new URL(redirectResult.url).searchParams.get('code')!;

    // First exchange succeeds
    await controller.exchangeOAuthCode({ code }, mockRes as any);

    // Second exchange fails
    await expect(
      controller.exchangeOAuthCode({ code }, mockRes as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject a fabricated code', async () => {
    await expect(
      controller.exchangeOAuthCode(
        { code: 'fabricated-code-123' },
        mockRes as any,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});
