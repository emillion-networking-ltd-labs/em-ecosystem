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
    exec: jest.Mock;
  };

  beforeEach(async () => {
    mockPipeline = {
      exists: jest.fn().mockReturnThis(),
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

      expect(redis.set).toHaveBeenCalledWith('deny:jti:test-jti', '1', 'EX', 900);
    });

    it('should not throw when Redis fails (fail-open)', async () => {
      redis.set.mockRejectedValue(new Error('Redis connection lost'));

      await expect(service.denyToken('test-jti', 900)).resolves.toBeUndefined();
    });
  });

  describe('denyAllForUser', () => {
    it('should call Redis SET with correct user key and TTL', async () => {
      await service.denyAllForUser('user-123', 900);

      expect(redis.set).toHaveBeenCalledWith('deny:user:user-123', '1', 'EX', 900);
    });

    it('should not throw when Redis fails (fail-open)', async () => {
      redis.set.mockRejectedValue(new Error('Redis connection lost'));

      await expect(service.denyAllForUser('user-123', 900)).resolves.toBeUndefined();
    });
  });

  describe('isDenied', () => {
    it('should return true when jti key exists', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 1], // jti exists
        [null, 0], // user does not
      ]);

      const result = await service.isDenied('test-jti', 'user-123');

      expect(result).toBe(true);
      expect(mockPipeline.exists).toHaveBeenCalledWith('deny:jti:test-jti');
      expect(mockPipeline.exists).toHaveBeenCalledWith('deny:user:user-123');
    });

    it('should return true when user key exists', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 0], // jti does not
        [null, 1], // user exists
      ]);

      const result = await service.isDenied('test-jti', 'user-123');

      expect(result).toBe(true);
    });

    it('should return false when neither key exists', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 0],
        [null, 0],
      ]);

      const result = await service.isDenied('test-jti', 'user-123');

      expect(result).toBe(false);
    });

    it('should return false when pipeline returns null', async () => {
      mockPipeline.exec.mockResolvedValue(null);

      const result = await service.isDenied('test-jti', 'user-123');

      expect(result).toBe(false);
    });

    it('should return false when Redis fails (fail-open)', async () => {
      mockPipeline.exec.mockRejectedValue(new Error('Redis connection lost'));

      const result = await service.isDenied('test-jti', 'user-123');

      expect(result).toBe(false);
    });
  });
});
