import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { CustomThrottlerGuard } from '../custom-throttler.guard';

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;

  beforeEach(() => {
    // Create guard without DI — we'll test methods directly
    guard = Object.create(CustomThrottlerGuard.prototype);
  });

  describe('generateKey', () => {
    it('should generate key with throttlerName-class-handler-ip-suffix format', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ ip: '192.168.1.1' }),
        }),
        getHandler: () => ({ name: 'login' }),
        getClass: () => ({ name: 'AuthController' }),
      } as unknown as ExecutionContext;

      const key = guard['generateKey'](mockContext, 'short', 'default');

      expect(key).toBe('default-AuthController-login-192.168.1.1-short');
    });

    it('should use connection.remoteAddress when ip is not available', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            ip: undefined,
            connection: { remoteAddress: '10.0.0.1' },
          }),
        }),
        getHandler: () => ({ name: 'register' }),
        getClass: () => ({ name: 'AuthController' }),
      } as unknown as ExecutionContext;

      const key = guard['generateKey'](mockContext, 'medium', 'auth');

      expect(key).toBe('auth-AuthController-register-10.0.0.1-medium');
    });

    it('should use "unknown" when no IP source is available', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ ip: undefined, connection: {} }),
        }),
        getHandler: () => ({ name: 'test' }),
        getClass: () => ({ name: 'TestController' }),
      } as unknown as ExecutionContext;

      const key = guard['generateKey'](mockContext, 'suffix', 'throttle');

      expect(key).toBe('throttle-TestController-test-unknown-suffix');
    });
  });

  describe('handleRequest', () => {
    let mockResponse: { setHeader: jest.Mock };
    let mockContext: ExecutionContext;

    beforeEach(() => {
      mockResponse = { setHeader: jest.fn() };
      mockContext = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;
    });

    it('should set rate limit headers on successful request', async () => {
      // Mock the parent handleRequest to succeed
      const parentHandleRequest = jest.fn().mockResolvedValue(true);
      Object.getPrototypeOf(Object.getPrototypeOf(guard)).handleRequest = parentHandleRequest;

      const result = await guard['handleRequest']({
        context: mockContext,
        limit: 100,
        ttl: 60000,
        throttler: { name: 'default', ttl: 60000, limit: 100 },
        blockDuration: 0,
        getTracker: jest.fn(),
        generateKey: jest.fn(),
      } as any);

      expect(result).toBe(true);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(Number),
      );
    });

    it('should throw HttpException(429) with RATE_LIMIT_EXCEEDED on throttle', async () => {
      const parentHandleRequest = jest.fn().mockRejectedValue(
        new ThrottlerException('Too Many Requests'),
      );
      Object.getPrototypeOf(Object.getPrototypeOf(guard)).handleRequest = parentHandleRequest;

      try {
        await guard['handleRequest']({
          context: mockContext,
          limit: 10,
          ttl: 60000,
          throttler: { name: 'default', ttl: 60000, limit: 10 },
          blockDuration: 0,
          getTracker: jest.fn(),
          generateKey: jest.fn(),
        } as any);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);

        const body = (error as HttpException).getResponse() as any;
        expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(body.error.retryAfter).toBe(60);
      }

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 0);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', 60);
    });

    it('should re-throw non-ThrottlerException errors', async () => {
      const genericError = new Error('Something unexpected');
      const parentHandleRequest = jest.fn().mockRejectedValue(genericError);
      Object.getPrototypeOf(Object.getPrototypeOf(guard)).handleRequest = parentHandleRequest;

      await expect(
        guard['handleRequest']({
          context: mockContext,
          limit: 10,
          ttl: 60000,
          throttler: { name: 'default', ttl: 60000, limit: 10 },
          blockDuration: 0,
          getTracker: jest.fn(),
          generateKey: jest.fn(),
        } as any),
      ).rejects.toThrow('Something unexpected');
    });
  });
});
