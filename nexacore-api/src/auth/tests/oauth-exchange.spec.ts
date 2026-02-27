import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { SessionsService } from '../../sessions/sessions.service';
import { AuditService } from '../../audit/audit.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { OAuthCodeStore } from '../stores/oauth-code.store';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';

describe('OAuth Exchange Flow (Integration)', () => {
  let controller: AuthController;
  let authService: { [key: string]: jest.Mock };
  let oauthCodeStore: OAuthCodeStore;

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
    oauthCodeStore = new OAuthCodeStore();

    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
      buildClearCookie: jest.fn(),
      generateOAuthCode: jest
        .fn()
        .mockImplementation((payload) => oauthCodeStore.store(payload)),
      exchangeOAuthCode: jest.fn().mockImplementation((code) => {
        const result = oauthCodeStore.exchange(code);
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
    const redirectResult = controller.googleAuthCallback(req);

    const url = new URL(redirectResult.url);
    const code = url.searchParams.get('code');
    expect(code).toBeTruthy();
    expect(url.searchParams.has('accessToken')).toBe(false);
    expect(url.searchParams.has('refreshToken')).toBe(false);

    const exchangeResult = controller.exchangeOAuthCode(
      { code: code! },
      mockRes as any,
    );
    expect(exchangeResult.accessToken).toBe('real-access-token');
    expect(exchangeResult.user.email).toBe('test@example.com');
    expect(mockRes.cookie).toHaveBeenCalled();
  });

  it('should reject a code that has already been used', () => {
    const req = {
      user: { accessToken: 'at', user: mockUser, cookie: mockCookie },
    };
    const redirectResult = controller.googleAuthCallback(req);
    const code = new URL(redirectResult.url).searchParams.get('code')!;

    // First exchange succeeds
    controller.exchangeOAuthCode({ code }, mockRes as any);

    // Second exchange fails
    expect(() =>
      controller.exchangeOAuthCode({ code }, mockRes as any),
    ).toThrow(UnauthorizedException);
  });

  it('should reject a fabricated code', () => {
    expect(() =>
      controller.exchangeOAuthCode(
        { code: 'fabricated-code-123' },
        mockRes as any,
      ),
    ).toThrow(UnauthorizedException);
  });
});
