import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from '../strategies/google.strategy';
import { AuthService } from '../auth.service';
import { OAuthStateStore } from '../stores/oauth-state.store';
import { ConfigService } from '@nestjs/config';
import { Strategy as PassportGoogleStrategy } from 'passport-google-oauth20';
import { Provider } from '../../users/enums/provider.enum';
import { Role } from '../../users/enums/role.enum';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: jest.Mocked<AuthService>;
  let oauthStateStore: jest.Mocked<OAuthStateStore>;

  const mockCookie = {
    name: 'refresh_token',
    value: 'signed-jwt',
    options: {
      httpOnly: true,
      secure: false,
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 604800,
    },
  };

  const mockOAuthResult = {
    accessToken: 'access-token',
    user: {
      id: 'uuid-123',
      email: 'google@example.com',
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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    cookie: mockCookie,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: AuthService,
          useValue: {
            validateOAuthUser: jest.fn(),
          },
        },
        {
          provide: OAuthStateStore,
          useValue: {
            generate: jest.fn(),
            validate: jest.fn(),
            getCodeVerifier: jest.fn(),
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

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    authService = module.get(AuthService);
    oauthStateStore = module.get(OAuthStateStore);
  });

  afterEach(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  describe('validate', () => {
    const validReq = {
      query: { state: 'valid-state' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    };

    it('should call authService.validateOAuthUser with profile and requestMeta', async () => {
      oauthStateStore.validate.mockResolvedValue({
        codeVerifier: 'test',
        action: 'login',
      });
      authService.validateOAuthUser.mockResolvedValue(mockOAuthResult);
      const done = jest.fn();

      await strategy.validate(
        validReq,
        'google-access-token',
        'google-refresh-token',
        { emails: [{ value: 'google@example.com' }], id: 'google-id-123' },
        done,
      );

      expect(oauthStateStore.validate).toHaveBeenCalledWith('valid-state');
      expect(authService.validateOAuthUser).toHaveBeenCalledWith(
        {
          email: 'google@example.com',
          provider: Provider.GOOGLE,
          providerId: 'google-id-123',
        },
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
      );
      expect(done).toHaveBeenCalledWith(null, mockOAuthResult);
    });

    it('should call done with error when no email is provided', async () => {
      oauthStateStore.validate.mockResolvedValue({
        codeVerifier: 'test',
        action: 'login',
      });
      const done = jest.fn();

      await strategy.validate(
        validReq,
        'google-access-token',
        'google-refresh-token',
        { emails: [], id: 'google-id-123' },
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'No email provided by Google' }),
        undefined,
      );
      expect(authService.validateOAuthUser).not.toHaveBeenCalled();
    });

    it('should call done with error when emails array is undefined', async () => {
      oauthStateStore.validate.mockResolvedValue({
        codeVerifier: 'test',
        action: 'login',
      });
      const done = jest.fn();

      await strategy.validate(
        validReq,
        'google-access-token',
        'google-refresh-token',
        { id: 'google-id-123' },
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'No email provided by Google' }),
        undefined,
      );
    });

    it('should call done with error when state is invalid', async () => {
      oauthStateStore.validate.mockResolvedValue(null);
      const done = jest.fn();

      await strategy.validate(
        { ...validReq, query: { state: 'invalid-state' } },
        'google-access-token',
        'google-refresh-token',
        { emails: [{ value: 'google@example.com' }], id: 'google-id-123' },
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication failed',
        }),
        undefined,
      );
      expect(authService.validateOAuthUser).not.toHaveBeenCalled();
    });

    it('should call done with error when state is missing', async () => {
      const done = jest.fn();

      await strategy.validate(
        { ...validReq, query: {} },
        'google-access-token',
        'google-refresh-token',
        { emails: [{ value: 'google@example.com' }], id: 'google-id-123' },
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication failed',
        }),
        undefined,
      );
      expect(authService.validateOAuthUser).not.toHaveBeenCalled();
    });

    it('should call done with error when validateOAuthUser throws', async () => {
      oauthStateStore.validate.mockResolvedValue({
        codeVerifier: 'test',
        action: 'login',
      });
      authService.validateOAuthUser.mockRejectedValue(new Error('OAuth error'));
      const done = jest.fn();

      await strategy.validate(
        validReq,
        'google-access-token',
        'google-refresh-token',
        { emails: [{ value: 'google@example.com' }], id: 'g-1' },
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'OAuth error' }),
        undefined,
      );
    });
  });

  describe('authorizationParams', () => {
    it('should return code_challenge params with S256 default when code_challenge is present', () => {
      const result = strategy.authorizationParams({
        code_challenge: 'abc123',
      });
      expect(result).toEqual({
        code_challenge: 'abc123',
        code_challenge_method: 'S256',
      });
    });

    it('should use provided code_challenge_method instead of default', () => {
      const result = strategy.authorizationParams({
        code_challenge: 'abc123',
        code_challenge_method: 'plain',
      });
      expect(result).toEqual({
        code_challenge: 'abc123',
        code_challenge_method: 'plain',
      });
    });

    it('should return empty object when no code_challenge is present', () => {
      const result = strategy.authorizationParams({});
      expect(result).toEqual({});
    });
  });

  describe('authenticate', () => {
    let superAuthSpy: jest.SpyInstance;

    beforeEach(() => {
      superAuthSpy = jest
        .spyOn(PassportGoogleStrategy.prototype, 'authenticate')
        .mockImplementation(() => {});
    });

    afterEach(() => {
      superAuthSpy.mockRestore();
    });

    it('should monkey-patch _oauth2.getOAuthAccessToken when codeVerifier exists', async () => {
      const originalFn = jest.fn();
      (strategy as any)._oauth2 = { getOAuthAccessToken: originalFn };
      (oauthStateStore.getCodeVerifier as jest.Mock).mockResolvedValue(
        'test-verifier',
      );

      await strategy.authenticate(
        { query: { code: 'auth-code', state: 'test-state' } },
        {},
      );

      expect(oauthStateStore.getCodeVerifier).toHaveBeenCalledWith(
        'test-state',
      );

      // _oauth2.getOAuthAccessToken should now be the wrapper
      const patchedFn = (strategy as any)._oauth2.getOAuthAccessToken;
      expect(patchedFn).not.toBe(originalFn);

      // Call the wrapper and verify it injects code_verifier
      const params: Record<string, string> = {};
      const callback = jest.fn();
      patchedFn('auth-code', params, callback);

      expect(params.code_verifier).toBe('test-verifier');
      expect(originalFn).toHaveBeenCalledWith('auth-code', params, callback);

      // Should have restored original function
      expect((strategy as any)._oauth2.getOAuthAccessToken).toBe(originalFn);

      expect(superAuthSpy).toHaveBeenCalled();
    });

    it('should not monkey-patch when no codeVerifier exists', async () => {
      const originalFn = jest.fn();
      (strategy as any)._oauth2 = { getOAuthAccessToken: originalFn };
      (oauthStateStore.getCodeVerifier as jest.Mock).mockResolvedValue(
        undefined,
      );

      await strategy.authenticate(
        { query: { code: 'auth-code', state: 'test-state' } },
        {},
      );

      expect((strategy as any)._oauth2.getOAuthAccessToken).toBe(originalFn);
      expect(superAuthSpy).toHaveBeenCalled();
    });

    it('should skip PKCE entirely when no code in query', async () => {
      await strategy.authenticate({ query: {} }, {});

      expect(oauthStateStore.getCodeVerifier).not.toHaveBeenCalled();
      expect(superAuthSpy).toHaveBeenCalled();
    });

    it('should restore original getOAuthAccessToken after single use', async () => {
      const originalFn = jest.fn();
      (strategy as any)._oauth2 = { getOAuthAccessToken: originalFn };
      (oauthStateStore.getCodeVerifier as jest.Mock).mockResolvedValue(
        'test-verifier',
      );

      await strategy.authenticate(
        { query: { code: 'auth-code', state: 'test-state' } },
        {},
      );

      const patchedFn = (strategy as any)._oauth2.getOAuthAccessToken;
      patchedFn('code', {}, jest.fn());

      // After one call, original is restored
      expect((strategy as any)._oauth2.getOAuthAccessToken).toBe(originalFn);
    });
  });
});
