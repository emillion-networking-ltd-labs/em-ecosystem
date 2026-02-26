import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from '../strategies/google.strategy';
import { AuthService } from '../auth.service';
import { OAuthStateStore } from '../stores/oauth-state.store';
import { Provider } from '../../users/enums/provider.enum';
import { Role } from '../../users/enums/role.enum';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: jest.Mocked<AuthService>;
  let oauthStateStore: jest.Mocked<OAuthStateStore>;

  const mockOAuthResult = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 'uuid-123',
      email: 'google@example.com',
      firstName: null,
      lastName: null,
      avatarUrl: null,
      role: Role.USER,
      provider: Provider.GOOGLE,
      providerId: 'google-id-123',
      emailVerified: true,
      isActive: true,
      failedAttempts: 0,
      lockedUntil: null,
      lockoutCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
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
    const validReq = { query: { state: 'valid-state' } };

    it('should call authService.validateOAuthUser with Google profile and invoke done', async () => {
      oauthStateStore.validate.mockReturnValue(true);
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
      expect(authService.validateOAuthUser).toHaveBeenCalledWith({
        email: 'google@example.com',
        provider: Provider.GOOGLE,
        providerId: 'google-id-123',
      });
      expect(done).toHaveBeenCalledWith(null, mockOAuthResult);
    });

    it('should call done with error when no email is provided', async () => {
      oauthStateStore.validate.mockReturnValue(true);
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
      oauthStateStore.validate.mockReturnValue(true);
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
      oauthStateStore.validate.mockReturnValue(false);
      const done = jest.fn();

      await strategy.validate(
        { query: { state: 'invalid-state' } },
        'google-access-token',
        'google-refresh-token',
        { emails: [{ value: 'google@example.com' }], id: 'google-id-123' },
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid or expired OAuth state parameter',
        }),
        undefined,
      );
      expect(authService.validateOAuthUser).not.toHaveBeenCalled();
    });

    it('should call done with error when state is missing', async () => {
      const done = jest.fn();

      await strategy.validate(
        { query: {} },
        'google-access-token',
        'google-refresh-token',
        { emails: [{ value: 'google@example.com' }], id: 'google-id-123' },
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid or expired OAuth state parameter',
        }),
        undefined,
      );
      expect(authService.validateOAuthUser).not.toHaveBeenCalled();
    });
  });
});
