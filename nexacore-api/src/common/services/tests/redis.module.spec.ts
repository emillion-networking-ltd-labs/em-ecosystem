const mockRedisInstance = {
  on: jest.fn().mockReturnThis(),
  quit: jest.fn().mockResolvedValue('OK'),
};

const MockRedis = jest.fn().mockImplementation(() => mockRedisInstance);

jest.mock('ioredis', () => ({
  __esModule: true,
  default: MockRedis,
}));

import { Test } from '@nestjs/testing';
import { REDIS_CLIENT } from '../redis.constants';
import { RedisModule } from '../redis.module';

describe('RedisModule', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;
    delete process.env.REDIS_DB;
    delete process.env.REDIS_KEY_PREFIX;
    delete process.env.REDIS_TLS_ENABLED;
    delete process.env.REDIS_TLS_REJECT_UNAUTHORIZED;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  async function compileModule() {
    const module = await Test.createTestingModule({
      imports: [RedisModule],
    }).compile();
    return module;
  }

  function getConstructorOptions(): Record<string, unknown> {
    return MockRedis.mock.calls[0][0];
  }

  // ─── TLS configuration ─────────────────────────────────────

  describe('TLS configuration', () => {
    it('should not include tls option when REDIS_TLS_ENABLED is not set', async () => {
      await compileModule();

      const options = getConstructorOptions();
      expect(options).not.toHaveProperty('tls');
    });

    it('should not include tls option when REDIS_TLS_ENABLED is "false"', async () => {
      process.env.REDIS_TLS_ENABLED = 'false';

      await compileModule();

      const options = getConstructorOptions();
      expect(options).not.toHaveProperty('tls');
    });

    it('should include tls option when REDIS_TLS_ENABLED is "true"', async () => {
      process.env.REDIS_TLS_ENABLED = 'true';

      await compileModule();

      const options = getConstructorOptions();
      expect(options).toHaveProperty('tls');
      expect(options.tls).toEqual({ rejectUnauthorized: true });
    });

    it('should set rejectUnauthorized to false when REDIS_TLS_REJECT_UNAUTHORIZED is "false"', async () => {
      process.env.REDIS_TLS_ENABLED = 'true';
      process.env.REDIS_TLS_REJECT_UNAUTHORIZED = 'false';

      await compileModule();

      const options = getConstructorOptions();
      expect(options.tls).toEqual({ rejectUnauthorized: false });
    });

    it('should default rejectUnauthorized to true when REDIS_TLS_REJECT_UNAUTHORIZED is not set', async () => {
      process.env.REDIS_TLS_ENABLED = 'true';

      await compileModule();

      const options = getConstructorOptions();
      expect(options.tls).toEqual({ rejectUnauthorized: true });
    });
  });

  // ─── Default configuration ─────────────────────────────────

  describe('default configuration', () => {
    it('should use default host and port when env vars are not set', async () => {
      await compileModule();

      const options = getConstructorOptions();
      expect(options.host).toBe('localhost');
      expect(options.port).toBe(6379);
    });

    it('should use custom host and port from env vars', async () => {
      process.env.REDIS_HOST = 'redis.example.com';
      process.env.REDIS_PORT = '6380';

      await compileModule();

      const options = getConstructorOptions();
      expect(options.host).toBe('redis.example.com');
      expect(options.port).toBe(6380);
    });
  });

  // ─── Logging ───────────────────────────────────────────────

  describe('logging', () => {
    it('should include TLS indicator in connect log when TLS is enabled', async () => {
      process.env.REDIS_TLS_ENABLED = 'true';

      await compileModule();

      const connectHandler = mockRedisInstance.on.mock.calls.find(
        (call: [string, () => void]) => call[0] === 'connect',
      );
      expect(connectHandler).toBeDefined();

      const logSpy = jest.spyOn(
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('@nestjs/common').Logger.prototype,
        'log',
      );

      connectHandler[1]();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('(TLS)'));

      logSpy.mockRestore();
    });

    it('should not include TLS indicator in connect log when TLS is disabled', async () => {
      await compileModule();

      const connectHandler = mockRedisInstance.on.mock.calls.find(
        (call: [string, () => void]) => call[0] === 'connect',
      );
      expect(connectHandler).toBeDefined();

      const logSpy = jest.spyOn(
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('@nestjs/common').Logger.prototype,
        'log',
      );

      connectHandler[1]();

      expect(logSpy).toHaveBeenCalledWith(expect.not.stringContaining('(TLS)'));

      logSpy.mockRestore();
    });
  });
});
