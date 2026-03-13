import {
  applyPkceAuthenticate,
  applyPkceAuthorizationParams,
} from '../strategies/pkce-authenticate';

describe('applyPkceAuthenticate', () => {
  let mockOauthStateStore: { getCodeVerifier: jest.Mock };
  let originalGetOAuthAccessToken: jest.Mock;
  let strategy: { _oauth2: { getOAuthAccessToken: jest.Mock } };
  let superAuthenticate: jest.Mock;

  beforeEach(() => {
    mockOauthStateStore = { getCodeVerifier: jest.fn() };
    originalGetOAuthAccessToken = jest.fn();
    strategy = {
      _oauth2: { getOAuthAccessToken: originalGetOAuthAccessToken },
    };
    superAuthenticate = jest.fn();
  });

  it('should inject code_verifier when state has a verifier', async () => {
    mockOauthStateStore.getCodeVerifier.mockResolvedValue('test-verifier');

    const req = { query: { code: 'auth-code', state: 'state-123' } };

    await applyPkceAuthenticate(
      strategy,
      mockOauthStateStore as any,
      req,
      {},
      superAuthenticate,
    );

    // The oauth2 method should have been monkey-patched
    // superAuthenticate was called, which would trigger Passport's flow
    expect(superAuthenticate).toHaveBeenCalledWith(req, {});
    expect(mockOauthStateStore.getCodeVerifier).toHaveBeenCalledWith(
      'state-123',
    );
  });

  it('should restore original oauth2 method after patched function is called', async () => {
    mockOauthStateStore.getCodeVerifier.mockResolvedValue('test-verifier');

    const req = { query: { code: 'auth-code', state: 'state-123' } };

    await applyPkceAuthenticate(
      strategy,
      mockOauthStateStore as any,
      req,
      {},
      superAuthenticate,
    );

    // Capture the patched function
    const patchedFn = strategy._oauth2.getOAuthAccessToken;
    expect(patchedFn).not.toBe(originalGetOAuthAccessToken);

    // Call the patched function — it should restore the original
    const callback = jest.fn();
    patchedFn('code', {}, callback);

    expect(strategy._oauth2.getOAuthAccessToken).toBe(
      originalGetOAuthAccessToken,
    );
    expect(originalGetOAuthAccessToken).toHaveBeenCalledWith(
      'code',
      { code_verifier: 'test-verifier' },
      callback,
    );
  });

  it('should call superAuthenticate with correct context and args', async () => {
    mockOauthStateStore.getCodeVerifier.mockResolvedValue(undefined);

    const req = { query: { code: 'auth-code', state: 'state-123' } };
    const options = { scope: 'email' };

    await applyPkceAuthenticate(
      strategy,
      mockOauthStateStore as any,
      req,
      options,
      superAuthenticate,
    );

    expect(superAuthenticate).toHaveBeenCalled();
    // superAuthenticate.call(strategy, req, options)
    expect(superAuthenticate.mock.instances[0]).toBe(strategy);
  });

  it('should not patch oauth2 when no code_verifier is found', async () => {
    mockOauthStateStore.getCodeVerifier.mockResolvedValue(undefined);

    const req = { query: { code: 'auth-code', state: 'state-123' } };

    await applyPkceAuthenticate(
      strategy,
      mockOauthStateStore as any,
      req,
      {},
      superAuthenticate,
    );

    expect(strategy._oauth2.getOAuthAccessToken).toBe(
      originalGetOAuthAccessToken,
    );
    expect(superAuthenticate).toHaveBeenCalled();
  });

  it('should not patch oauth2 when req has no code or state', async () => {
    const req = { query: {} };

    await applyPkceAuthenticate(
      strategy,
      mockOauthStateStore as any,
      req,
      {},
      superAuthenticate,
    );

    expect(mockOauthStateStore.getCodeVerifier).not.toHaveBeenCalled();
    expect(strategy._oauth2.getOAuthAccessToken).toBe(
      originalGetOAuthAccessToken,
    );
    expect(superAuthenticate).toHaveBeenCalled();
  });
});

describe('applyPkceAuthorizationParams', () => {
  it('should merge code_challenge and default method S256', () => {
    const result = applyPkceAuthorizationParams({
      code_challenge: 'challenge-value',
    });

    expect(result).toEqual({
      code_challenge: 'challenge-value',
      code_challenge_method: 'S256',
    });
  });

  it('should use custom code_challenge_method if provided', () => {
    const result = applyPkceAuthorizationParams({
      code_challenge: 'challenge-value',
      code_challenge_method: 'plain',
    });

    expect(result).toEqual({
      code_challenge: 'challenge-value',
      code_challenge_method: 'plain',
    });
  });

  it('should return only base params when no code_challenge', () => {
    const result = applyPkceAuthorizationParams(
      {},
      { redirect_uri: 'http://localhost' },
    );

    expect(result).toEqual({ redirect_uri: 'http://localhost' });
  });

  it('should preserve existing base params alongside PKCE params', () => {
    const result = applyPkceAuthorizationParams(
      { code_challenge: 'challenge-value' },
      { redirect_uri: 'http://localhost', scope: 'email' },
    );

    expect(result).toEqual({
      redirect_uri: 'http://localhost',
      scope: 'email',
      code_challenge: 'challenge-value',
      code_challenge_method: 'S256',
    });
  });
});
