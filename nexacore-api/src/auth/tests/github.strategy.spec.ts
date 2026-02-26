import { Test, TestingModule } from '@nestjs/testing';
import { GitHubStrategy } from '../strategies/github.strategy';
import { AuthService } from '../auth.service';
import { OAuthStateStore } from '../stores/oauth-state.store';
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
      oauthStateStore.validate.mockReturnValue(true);
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
      oauthStateStore.validate.mockReturnValue(true);
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
      oauthStateStore.validate.mockReturnValue(true);
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
      oauthStateStore.validate.mockReturnValue(false);
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
          message: 'Invalid or expired OAuth state parameter',
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
          message: 'Invalid or expired OAuth state parameter',
        }),
      );
      expect(authService.validateOAuthUser).not.toHaveBeenCalled();
    });
  });
});
