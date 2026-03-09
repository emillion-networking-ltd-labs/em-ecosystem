import { Test, TestingModule } from '@nestjs/testing';
import { GitHubStrategy } from '../strategies/github.strategy';
import { AuthService } from '../auth.service';
import { OAuthStateStore } from '../stores/oauth-state.store';
import { Strategy as PassportGitHubStrategy } from 'passport-github2';
import { Provider } from '../../users/enums/provider.enum';
import { Role } from '../../users/enums/role.enum';

describe('GitHubStrategy', () => {
  let strategy: GitHubStrategy;
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
      id: 'uuid-456',
      email: 'github@example.com',
      firstName: null,
      lastName: null,
      avatarUrl: null,
      role: Role.USER,
      provider: Provider.GITHUB,
      providerId: 'github-id-456',
      hasPassword: false,
      oauthProviders: ['GITHUB'],
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

    process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitHubStrategy,
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
      ],
    }).compile();

    strategy = module.get<GitHubStrategy>(GitHubStrategy);
    authService = module.get(AuthService);
    oauthStateStore = module.get(OAuthStateStore);
  });

  afterEach(() => {
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;
  });

  describe('validate', () => {
    const validReq = {
      query: { state: 'valid-state' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    };

    it('should call authService.validateOAuthUser with GitHub profile and requestMeta', async () => {
      oauthStateStore.validate.mockResolvedValue(true);
      authService.validateOAuthUser.mockResolvedValue(mockOAuthResult);
      const done = jest.fn();

      await strategy.validate(
        validReq,
        'github-access-token',
        'github-refresh-token',
        { emails: [{ value: 'github@example.com' }], id: 'github-id-456' },
        done,
      );

      expect(oauthStateStore.validate).toHaveBeenCalledWith('valid-state');
      expect(authService.validateOAuthUser).toHaveBeenCalledWith(
        {
          email: 'github@example.com',
          provider: Provider.GITHUB,
          providerId: 'github-id-456',
        },
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
      );
      expect(done).toHaveBeenCalledWith(null, mockOAuthResult);
    });

    it('should call done with error when no email is provided', async () => {
      oauthStateStore.validate.mockResolvedValue(true);
      const done = jest.fn();

      await strategy.validate(
        validReq,
        'github-access-token',
        'github-refresh-token',
        { emails: [], id: 'github-id-456' },
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'No email provided by GitHub' }),
      );
      expect(authService.validateOAuthUser).not.toHaveBeenCalled();
    });

    it('should call done with error when emails array is undefined', async () => {
      oauthStateStore.validate.mockResolvedValue(true);
      const done = jest.fn();

      await strategy.validate(
        validReq,
        'github-access-token',
        'github-refresh-token',
        { id: 'github-id-456' },
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'No email provided by GitHub' }),
      );
    });

    it('should call done with error when state is invalid', async () => {
      oauthStateStore.validate.mockResolvedValue(false);
      const done = jest.fn();

      await strategy.validate(
        { ...validReq, query: { state: 'invalid-state' } },
        'github-access-token',
        'github-refresh-token',
        { emails: [{ value: 'github@example.com' }], id: 'github-id-456' },
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication failed',
        }),
      );
      expect(authService.validateOAuthUser).not.toHaveBeenCalled();
    });

    it('should call done with error when state is missing', async () => {
      const done = jest.fn();

      await strategy.validate(
        { ...validReq, query: {} },
        'github-access-token',
        'github-refresh-token',
        { emails: [{ value: 'github@example.com' }], id: 'github-id-456' },
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication failed',
        }),
      );
      expect(authService.validateOAuthUser).not.toHaveBeenCalled();
    });

    it('should pass firstName and lastName as undefined when displayName is absent', async () => {
      oauthStateStore.validate.mockResolvedValue(true);
      authService.validateOAuthUser.mockResolvedValue(mockOAuthResult);
      const done = jest.fn();

      await strategy.validate(
        validReq,
        'github-access-token',
        'github-refresh-token',
        { emails: [{ value: 'github@example.com' }], id: 'gh-1' },
        done,
      );

      expect(authService.validateOAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: undefined,
          lastName: undefined,
        }),
        expect.anything(),
        expect.anything(),
      );
      expect(done).toHaveBeenCalledWith(null, mockOAuthResult);
    });

    it('should parse single-word displayName as firstName only', async () => {
      oauthStateStore.validate.mockResolvedValue(true);
      authService.validateOAuthUser.mockResolvedValue(mockOAuthResult);
      const done = jest.fn();

      await strategy.validate(
        validReq,
        'github-access-token',
        'github-refresh-token',
        {
          emails: [{ value: 'github@example.com' }],
          id: 'gh-2',
          displayName: 'Mononym',
        },
        done,
      );

      expect(authService.validateOAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Mononym',
          lastName: undefined,
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('should parse multi-word displayName into firstName and lastName', async () => {
      oauthStateStore.validate.mockResolvedValue(true);
      authService.validateOAuthUser.mockResolvedValue(mockOAuthResult);
      const done = jest.fn();

      await strategy.validate(
        validReq,
        'github-access-token',
        'github-refresh-token',
        {
          emails: [{ value: 'github@example.com' }],
          id: 'gh-3',
          displayName: 'John Van Doe',
        },
        done,
      );

      expect(authService.validateOAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Van Doe',
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('should call done with error when validateOAuthUser throws', async () => {
      oauthStateStore.validate.mockResolvedValue(true);
      authService.validateOAuthUser.mockRejectedValue(
        new Error('OAuth error'),
      );
      const done = jest.fn();

      await strategy.validate(
        validReq,
        'github-access-token',
        'github-refresh-token',
        { emails: [{ value: 'github@example.com' }], id: 'gh-4' },
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'OAuth error' }),
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
        .spyOn(PassportGitHubStrategy.prototype, 'authenticate')
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
      (oauthStateStore.getCodeVerifier as jest.Mock).mockResolvedValue(undefined);

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
