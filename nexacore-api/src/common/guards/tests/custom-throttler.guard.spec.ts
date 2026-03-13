import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { CustomThrottlerGuard } from '../custom-throttler.guard';

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;

  beforeEach(() => {
    jest.clearAllMocks();
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
    let mockRequest: Record<string, unknown>;
    let mockContext: ExecutionContext;
    let mockStorageService: { increment: jest.Mock };

    beforeEach(() => {
      mockResponse = { setHeader: jest.fn() };
      mockRequest = { ip: '127.0.0.1' };
      mockContext = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      mockStorageService = {
        increment: jest.fn(),
      };
      (guard as any).storageService = mockStorageService;
    });

    it('should set rate limit headers including X-RateLimit-Remaining on successful request', async () => {
      // Note: ThrottlerStorageService returns timeToExpire in seconds (not ms)
      mockStorageService.increment.mockResolvedValue({
        totalHits: 5,
        timeToExpire: 60,
        isBlocked: false,
        timeToBlockExpire: 0,
      });

      const result = await guard['handleRequest']({
        context: mockContext,
        limit: 100,
        ttl: 60000,
        throttler: { name: 'default', ttl: 60000, limit: 100 },
        blockDuration: 0,
        getTracker: jest.fn().mockResolvedValue('127.0.0.1'),
        generateKey: jest.fn().mockReturnValue('test-key'),
      } as any);

      expect(result).toBe(true);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        100,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        95,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(Number),
      );
    });

    it('should throw HttpException(429) with RATE_LIMIT_EXCEEDED when limit exceeded', async () => {
      mockStorageService.increment.mockResolvedValue({
        totalHits: 11,
        timeToExpire: 60,
        isBlocked: false,
        timeToBlockExpire: 0,
      });

      try {
        await guard['handleRequest']({
          context: mockContext,
          limit: 10,
          ttl: 60000,
          throttler: { name: 'default', ttl: 60000, limit: 10 },
          blockDuration: 0,
          getTracker: jest.fn().mockResolvedValue('127.0.0.1'),
          generateKey: jest.fn().mockReturnValue('test-key'),
        } as any);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(
          HttpStatus.TOO_MANY_REQUESTS,
        );

        const body = (error as HttpException).getResponse() as any;
        expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(body.error.retryAfter).toBe(60);
      }

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        0,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', 60);
    });

    it('should throw HttpException(429) when request is blocked, using timeToBlockExpire for retryAfter', async () => {
      mockStorageService.increment.mockResolvedValue({
        totalHits: 5,
        timeToExpire: 30,
        isBlocked: true,
        timeToBlockExpire: 45,
      });

      try {
        await guard['handleRequest']({
          context: mockContext,
          limit: 10,
          ttl: 60000,
          throttler: { name: 'default', ttl: 60000, limit: 10 },
          blockDuration: 60000,
          getTracker: jest.fn().mockResolvedValue('127.0.0.1'),
          generateKey: jest.fn().mockReturnValue('test-key'),
        } as any);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(
          HttpStatus.TOO_MANY_REQUESTS,
        );

        const body = (error as HttpException).getResponse() as any;
        expect(body.error.retryAfter).toBe(45);
      }

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        0,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', 45);
    });

    it('should use "default" when throttler.name is undefined', async () => {
      mockStorageService.increment.mockResolvedValue({
        totalHits: 1,
        timeToExpire: 60,
        isBlocked: false,
        timeToBlockExpire: 0,
      });

      await guard['handleRequest']({
        context: mockContext,
        limit: 100,
        ttl: 60000,
        throttler: { ttl: 60000, limit: 100 },
        blockDuration: 0,
        getTracker: jest.fn().mockResolvedValue('127.0.0.1'),
        generateKey: jest.fn().mockReturnValue('test-key'),
      } as any);

      expect(mockStorageService.increment).toHaveBeenCalledWith(
        'test-key',
        60000,
        100,
        0,
        'default',
      );
    });
  });
});
