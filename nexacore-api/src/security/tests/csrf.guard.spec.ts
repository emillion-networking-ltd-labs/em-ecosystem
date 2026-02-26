import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from '../../common/guards/csrf.guard';

jest.mock('../../security/security.config', () => ({
  SecurityConfig: {
    csrf: {
      cookieName: '__csrf',
      headerName: 'x-csrf-token',
      tokenLength: 32,
      getSecret: () => 'test-csrf-secret-must-be-32-chars-long',
      cookieOptions: {
        httpOnly: true,
        sameSite: 'strict',
        secure: false,
        path: '/',
        maxAge: 86400,
      },
    },
  },
}));

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new CsrfGuard(reflector);
  });

  function createMockContext(
    method: string,
    cookies: Record<string, string> = {},
    headers: Record<string, string> = {},
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          cookies,
          headers,
        }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn() as unknown,
    } as unknown as ExecutionContext;
  }

  it('should allow GET requests without CSRF token', () => {
    const context = createMockContext('GET');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow HEAD requests without CSRF token', () => {
    const context = createMockContext('HEAD');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow OPTIONS requests without CSRF token', () => {
    const context = createMockContext('OPTIONS');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when CSRF cookie is missing on POST', () => {
    const context = createMockContext('POST', {}, { 'x-csrf-token': 'token' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('CSRF token missing');
  });

  it('should throw ForbiddenException when CSRF header is missing on POST', () => {
    const context = createMockContext('POST', { __csrf: 'token' }, {});
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('CSRF token missing');
  });

  it('should throw ForbiddenException when tokens do not match', () => {
    const token = CsrfGuard.generateToken();
    const differentToken = CsrfGuard.generateToken();
    const context = createMockContext(
      'POST',
      { __csrf: token },
      { 'x-csrf-token': differentToken },
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('CSRF token mismatch');
  });

  it('should allow POST when cookie and header tokens match and are valid', () => {
    const token = CsrfGuard.generateToken();
    const context = createMockContext(
      'POST',
      { __csrf: token },
      { 'x-csrf-token': token },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow PATCH when cookie and header tokens match and are valid', () => {
    const token = CsrfGuard.generateToken();
    const context = createMockContext(
      'PATCH',
      { __csrf: token },
      { 'x-csrf-token': token },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow DELETE when cookie and header tokens match and are valid', () => {
    const token = CsrfGuard.generateToken();
    const context = createMockContext(
      'DELETE',
      { __csrf: token },
      { 'x-csrf-token': token },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException for tampered token (invalid HMAC)', () => {
    const token = CsrfGuard.generateToken();
    const [randomPart] = token.split('.');
    const tamperedToken = `${randomPart}.invalidsignature`;
    const context = createMockContext(
      'POST',
      { __csrf: tamperedToken },
      { 'x-csrf-token': tamperedToken },
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Invalid CSRF token');
  });

  it('should skip CSRF when @SkipCsrf() decorator is present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext('POST');
    expect(guard.canActivate(context)).toBe(true);
  });

  describe('generateToken', () => {
    it('should generate a token with random part and HMAC signature', () => {
      const token = CsrfGuard.generateToken();
      expect(token).toContain('.');
      const parts = token.split('.');
      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBe(64);
      expect(parts[1].length).toBe(64);
    });

    it('should generate unique tokens on each call', () => {
      const token1 = CsrfGuard.generateToken();
      const token2 = CsrfGuard.generateToken();
      expect(token1).not.toBe(token2);
    });
  });
});
