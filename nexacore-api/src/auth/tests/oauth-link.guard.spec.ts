import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuthLinkGuard } from '../guards/oauth-link.guard';
import { ErrorMessages } from '../../common/constants/error-messages';

describe('OAuthLinkGuard', () => {
  let guard: OAuthLinkGuard;
  let jwtService: { verify: jest.Mock };

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    guard = new OAuthLinkGuard(jwtService as unknown as JwtService);
  });

  const createMockContext = (
    headers: Record<string, string> = {},
    query: Record<string, string> = {},
  ) => {
    const request = {
      headers,
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

  it('should return true and set req.user + req.oauthAction with valid JWT in Authorization header', () => {
    jwtService.verify.mockReturnValue({ sub: 'user-123' });
    const context = createMockContext({ authorization: 'Bearer valid-token' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
    expect((context as any)._request.user).toEqual({ id: 'user-123' });
    expect((context as any)._request.oauthAction).toBe('link');
  });

  it('should return true and set req.user + req.oauthAction with valid JWT in ?token= query param', () => {
    jwtService.verify.mockReturnValue({ sub: 'user-456' });
    const context = createMockContext({}, { token: 'query-token' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('query-token');
    expect((context as any)._request.user).toEqual({ id: 'user-456' });
    expect((context as any)._request.oauthAction).toBe('link');
  });

  it('should prefer Authorization header over query param when both present', () => {
    jwtService.verify.mockReturnValue({ sub: 'user-789' });
    const context = createMockContext(
      { authorization: 'Bearer header-token' },
      { token: 'query-token' },
    );

    guard.canActivate(context);

    expect(jwtService.verify).toHaveBeenCalledWith('header-token');
  });

  it('should throw UnauthorizedException when no token provided', () => {
    const context = createMockContext();

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(
      ErrorMessages.auth.AUTHENTICATION_FAILED,
    );
  });

  it('should throw UnauthorizedException when JWT verification fails', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const context = createMockContext({
      authorization: 'Bearer expired-token',
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(
      ErrorMessages.auth.AUTHENTICATION_FAILED,
    );
  });

  it('should throw UnauthorizedException when Authorization header is not Bearer scheme', () => {
    const context = createMockContext({ authorization: 'Basic xyz123' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(
      ErrorMessages.auth.AUTHENTICATION_FAILED,
    );
  });
});
