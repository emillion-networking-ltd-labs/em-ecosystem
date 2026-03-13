import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { OAuthLinkGuard } from '../guards/oauth-link.guard';
import { OAuthLinkCodeStore } from '../stores/oauth-link-code.store';
import { ErrorMessages } from '../../common/constants/error-messages';

describe('OAuthLinkGuard', () => {
  let guard: OAuthLinkGuard;
  let store: { generate: jest.Mock; consume: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    store = { generate: jest.fn(), consume: jest.fn() };
    guard = new OAuthLinkGuard(store as unknown as OAuthLinkCodeStore);
  });

  const createMockContext = (query: Record<string, string> = {}) => {
    const request = {
      query,
      user: undefined as any,
      oauthAction: undefined as any,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      _request: request,
    } as unknown as ExecutionContext & { _request: typeof request };
  };

  it('should return true and set req.user + req.oauthAction with valid link code', async () => {
    store.consume.mockResolvedValue('user-123');
    const context = createMockContext({ code: 'valid-code' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(store.consume).toHaveBeenCalledWith('valid-code');
    expect((context as any)._request.user).toEqual({ id: 'user-123' });
    expect((context as any)._request.oauthAction).toBe('link');
  });

  it('should throw UnauthorizedException when code is missing', async () => {
    const context = createMockContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(store.consume).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when code is invalid or expired', async () => {
    store.consume.mockResolvedValue(null);
    const context = createMockContext({ code: 'invalid-code' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(store.consume).toHaveBeenCalledWith('invalid-code');
  });

  it('should throw UnauthorizedException when code has already been consumed', async () => {
    store.consume.mockResolvedValue(null);
    const context = createMockContext({ code: 'already-used-code' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
