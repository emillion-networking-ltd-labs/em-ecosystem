import {
  validateOAuthCallback,
  OAuthProfile,
} from '../strategies/oauth-validate.helper';
import { Provider } from '../../users/enums/provider.enum';
import { ErrorMessages } from '../../common/constants/error-messages';

describe('validateOAuthCallback', () => {
  let mockOauthStateStore: { validate: jest.Mock };
  let mockOauthAuthService: {
    validateOAuthUser: jest.Mock;
    validateOAuthLink: jest.Mock;
  };
  let done: jest.Mock;

  const mockProfile: OAuthProfile = {
    email: 'test@example.com',
    provider: Provider.GOOGLE,
    providerId: 'google-123',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
  };

  const mockReq = {
    query: { state: 'valid-state' },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOauthStateStore = { validate: jest.fn() };
    mockOauthAuthService = {
      validateOAuthUser: jest.fn(),
      validateOAuthLink: jest.fn(),
    };
    done = jest.fn();
  });

  it('should call done with error when state is missing', async () => {
    const req = { query: {}, ip: '127.0.0.1', headers: {} };

    await validateOAuthCallback(
      mockOauthStateStore as any,
      mockOauthAuthService as any,
      req,
      mockProfile,
      done,
    );

    expect(done).toHaveBeenCalledWith(
      expect.objectContaining({
        message: ErrorMessages.auth.AUTHENTICATION_FAILED,
      }),
      undefined,
    );
    expect(mockOauthStateStore.validate).not.toHaveBeenCalled();
  });

  it('should call done with error when state validation fails', async () => {
    mockOauthStateStore.validate.mockResolvedValue(null);

    await validateOAuthCallback(
      mockOauthStateStore as any,
      mockOauthAuthService as any,
      mockReq,
      mockProfile,
      done,
    );

    expect(mockOauthStateStore.validate).toHaveBeenCalledWith('valid-state');
    expect(done).toHaveBeenCalledWith(
      expect.objectContaining({
        message: ErrorMessages.auth.AUTHENTICATION_FAILED,
      }),
      undefined,
    );
  });

  it('should call validateOAuthUser for login flow', async () => {
    const loginResult = { accessToken: 'jwt', user: {} };
    mockOauthStateStore.validate.mockResolvedValue({
      codeVerifier: 'verifier',
      action: 'login',
    });
    mockOauthAuthService.validateOAuthUser.mockResolvedValue(loginResult);

    await validateOAuthCallback(
      mockOauthStateStore as any,
      mockOauthAuthService as any,
      mockReq,
      mockProfile,
      done,
    );

    expect(mockOauthAuthService.validateOAuthUser).toHaveBeenCalledWith(
      mockProfile,
      expect.objectContaining({ ipAddress: '127.0.0.1' }),
      expect.objectContaining({ ipAddress: '127.0.0.1' }),
    );
    expect(done).toHaveBeenCalledWith(null, loginResult);
  });

  it('should call validateOAuthLink for link flow with userId', async () => {
    const linkResult = { linked: true };
    mockOauthStateStore.validate.mockResolvedValue({
      codeVerifier: 'verifier',
      action: 'link',
      userId: 'user-uuid-123',
    });
    mockOauthAuthService.validateOAuthLink.mockResolvedValue(linkResult);

    await validateOAuthCallback(
      mockOauthStateStore as any,
      mockOauthAuthService as any,
      mockReq,
      mockProfile,
      done,
    );

    expect(mockOauthAuthService.validateOAuthLink).toHaveBeenCalledWith(
      'user-uuid-123',
      mockProfile,
      expect.objectContaining({ ipAddress: '127.0.0.1' }),
    );
    expect(done).toHaveBeenCalledWith(null, linkResult);
  });

  it('should propagate errors from OAuthAuthService', async () => {
    const error = new Error('OAuth service failure');
    mockOauthStateStore.validate.mockResolvedValue({
      codeVerifier: 'verifier',
      action: 'login',
    });
    mockOauthAuthService.validateOAuthUser.mockRejectedValue(error);

    await validateOAuthCallback(
      mockOauthStateStore as any,
      mockOauthAuthService as any,
      mockReq,
      mockProfile,
      done,
    );

    expect(done).toHaveBeenCalledWith(error, undefined);
  });
});
