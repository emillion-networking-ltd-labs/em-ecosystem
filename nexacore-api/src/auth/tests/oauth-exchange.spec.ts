import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { OAuthCodeStore } from '../stores/oauth-code.store';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';

describe('OAuth Exchange Flow (Integration)', () => {
  let controller: AuthController;
  let authService: { [key: string]: jest.Mock };
  let oauthCodeStore: OAuthCodeStore;

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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    oauthCodeStore = new OAuthCodeStore();

    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should complete the full OAuth code exchange cycle', async () => {
    const tokenPayload = {
      accessToken: 'real-access-token',
      refreshToken: 'real-refresh-token',
      user: mockUser,
    };
    const req = { user: tokenPayload };
    const redirectResult = controller.googleAuthCallback(req);

    const url = new URL(redirectResult.url);
    const code = url.searchParams.get('code');
    expect(code).toBeTruthy();
    expect(url.searchParams.has('accessToken')).toBe(false);
    expect(url.searchParams.has('refreshToken')).toBe(false);

    const exchangeResult = controller.exchangeOAuthCode({ code: code! });
    expect(exchangeResult.accessToken).toBe('real-access-token');
    expect(exchangeResult.refreshToken).toBe('real-refresh-token');
    expect(exchangeResult.user.email).toBe('test@example.com');
  });

  it('should reject a code that has already been used', () => {
    const req = {
      user: { accessToken: 'at', refreshToken: 'rt', user: mockUser },
    };
    const redirectResult = controller.googleAuthCallback(req);
    const code = new URL(redirectResult.url).searchParams.get('code')!;

    // First exchange succeeds
    controller.exchangeOAuthCode({ code });

    // Second exchange fails
    expect(() => controller.exchangeOAuthCode({ code })).toThrow(
      UnauthorizedException,
    );
  });

  it('should reject a fabricated code', () => {
    expect(() =>
      controller.exchangeOAuthCode({ code: 'fabricated-code-123' }),
    ).toThrow(UnauthorizedException);
  });
});
