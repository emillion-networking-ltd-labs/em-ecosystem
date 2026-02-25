import { Test, TestingModule } from '@nestjs/testing';
import { GitHubStrategy } from '../strategies/github.strategy';
import { AuthService } from '../auth.service';
import { Provider } from '../../users/enums/provider.enum';
import { Role } from '../../users/enums/role.enum';

describe('GitHubStrategy', () => {
  let strategy: GitHubStrategy;
  let authService: jest.Mocked<AuthService>;

  const mockOAuthResult = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
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
      ],
    }).compile();

    strategy = module.get<GitHubStrategy>(GitHubStrategy);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;
  });

  describe('validate', () => {
    it('should call authService.validateOAuthUser with GitHub profile and invoke done', async () => {
      authService.validateOAuthUser.mockResolvedValue(mockOAuthResult);
      const done = jest.fn();

      await strategy.validate(
        'github-access-token',
        'github-refresh-token',
        { emails: [{ value: 'github@example.com' }], id: 'github-id-456' },
        done,
      );

      expect(authService.validateOAuthUser).toHaveBeenCalledWith({
        email: 'github@example.com',
        provider: Provider.GITHUB,
        providerId: 'github-id-456',
      });
      expect(done).toHaveBeenCalledWith(null, mockOAuthResult);
    });

    it('should call done with error when no email is provided', async () => {
      const done = jest.fn();

      await strategy.validate(
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
      const done = jest.fn();

      await strategy.validate(
        'github-access-token',
        'github-refresh-token',
        { id: 'github-id-456' },
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'No email provided by GitHub' }),
      );
    });
  });
});
