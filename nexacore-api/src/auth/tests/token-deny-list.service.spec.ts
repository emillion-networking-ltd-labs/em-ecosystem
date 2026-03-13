import { Test, TestingModule } from '@nestjs/testing';
import { TokenDenyListService } from '../token-deny-list.service';
import { REDIS_CLIENT } from '../../common/services/redis.constants';

describe('TokenDenyListService', () => {
  let service: TokenDenyListService;
  let redis: {
    set: jest.Mock;
    pipeline: jest.Mock;
  };
  let mockPipeline: {
    exists: jest.Mock;
    get: jest.Mock;
    exec: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPipeline = {
      exists: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      pipeline: jest.fn().mockReturnValue(mockPipeline),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenDenyListService,
        {
          provide: REDIS_CLIENT,
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get<TokenDenyListService>(TokenDenyListService);
  });

  describe('denyToken', () => {
    it('should call Redis SET with correct key and TTL', async () => {
      await service.denyToken('test-jti', 900);

      expect(redis.set).toHaveBeenCalledWith(
        'deny:jti:test-jti',
        '1',
        'EX',
        900,
      );
    });

    it('should not throw when Redis fails (fail-open)', async () => {
      redis.set.mockRejectedValue(new Error('Redis connection lost'));

      await expect(service.denyToken('test-jti', 900)).resolves.toBeUndefined();
    });
  });

  describe('denyAllForUser', () => {
    it('should call Redis SET with timestamp value and TTL', async () => {
      const before = Math.floor(Date.now() / 1000);
      await service.denyAllForUser('user-123', 900);
      const after = Math.floor(Date.now() / 1000);

      expect(redis.set).toHaveBeenCalledTimes(1);
      const [key, value, ex, ttl] = redis.set.mock.calls[0];
      expect(key).toBe('deny:user:user-123');
      expect(ex).toBe('EX');
      expect(ttl).toBe(900);

      const ts = parseInt(value, 10);
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });

    it('should not throw when Redis fails (fail-open)', async () => {
      redis.set.mockRejectedValue(new Error('Redis connection lost'));

      await expect(
        service.denyAllForUser('user-123', 900),
      ).resolves.toBeUndefined();
    });
  });

  describe('isDenied', () => {
    it('should return true when jti key exists', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 1], // jti exists
        [null, null], // no user deny
      ]);

      const result = await service.isDenied('test-jti', 'user-123', 1000);

      expect(result).toBe(true);
      expect(mockPipeline.exists).toHaveBeenCalledWith('deny:jti:test-jti');
      expect(mockPipeline.get).toHaveBeenCalledWith('deny:user:user-123');
    });

    it('should return true when token iat is before user deny timestamp', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 0], // jti does not exist
        [null, '2000'], // user denied at timestamp 2000
      ]);

      const result = await service.isDenied('test-jti', 'user-123', 1500);

      expect(result).toBe(true);
    });

    it('should return false when token iat is after user deny timestamp', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 0], // jti does not exist
        [null, '2000'], // user denied at timestamp 2000
      ]);

      const result = await service.isDenied('test-jti', 'user-123', 2001);

      expect(result).toBe(false);
    });

    it('should return true when token iat equals user deny timestamp', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 0],
        [null, '2000'],
      ]);

      const result = await service.isDenied('test-jti', 'user-123', 2000);

      expect(result).toBe(true);
    });

    it('should return false when neither key exists', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 0],
        [null, null],
      ]);

      const result = await service.isDenied('test-jti', 'user-123', 1000);

      expect(result).toBe(false);
    });

    it('should fallback to deny when no iat provided and user key exists', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 0],
        [null, '2000'],
      ]);

      const result = await service.isDenied('test-jti', 'user-123');

      expect(result).toBe(true);
    });

    it('should return false when pipeline returns null', async () => {
      mockPipeline.exec.mockResolvedValue(null);

      const result = await service.isDenied('test-jti', 'user-123', 1000);

      expect(result).toBe(false);
    });

    it('should return false when Redis fails (fail-open)', async () => {
      mockPipeline.exec.mockRejectedValue(new Error('Redis connection lost'));

      const result = await service.isDenied('test-jti', 'user-123', 1000);

      expect(result).toBe(false);
    });
  });
});
