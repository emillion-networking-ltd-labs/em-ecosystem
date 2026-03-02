import { Test, TestingModule } from '@nestjs/testing';
import { OAuthStateStore } from '../stores/oauth-state.store';
import { REDIS_CLIENT } from '../../common/services/redis.constants';

describe('OAuthStateStore', () => {
  let store: OAuthStateStore;
  let redis: { get: jest.Mock; set: jest.Mock; del: jest.Mock; getdel: jest.Mock };

  beforeEach(async () => {
    redis = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      getdel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthStateStore,
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    store = module.get<OAuthStateStore>(OAuthStateStore);
  });

  describe('generate', () => {
    it('should return an object with state and codeChallenge strings', async () => {
      const result = await store.generate();
      expect(typeof result.state).toBe('string');
      expect(result.state.length).toBeGreaterThan(0);
      expect(typeof result.codeChallenge).toBe('string');
      expect(result.codeChallenge.length).toBeGreaterThan(0);
    });

    it('should return unique values on each call', async () => {
      const result1 = await store.generate();
      const result2 = await store.generate();
      expect(result1.state).not.toBe(result2.state);
      expect(result1.codeChallenge).not.toBe(result2.codeChallenge);
    });

    it('should store state in Redis with 300s TTL', async () => {
      const result = await store.generate();
      expect(redis.set).toHaveBeenCalledWith(
        `oauth:state:${result.state}`,
        expect.any(String),
        'EX',
        300,
      );
    });

    it('should store codeVerifier as JSON in Redis', async () => {
      await store.generate();
      const storedValue = redis.set.mock.calls[0][1];
      const parsed = JSON.parse(storedValue);
      expect(parsed).toHaveProperty('codeVerifier');
      expect(typeof parsed.codeVerifier).toBe('string');
      expect(parsed.codeVerifier.length).toBeGreaterThan(0);
    });
  });

  describe('validate', () => {
    it('should atomically get and delete key for an existing state', async () => {
      redis.getdel.mockResolvedValue(JSON.stringify({ codeVerifier: 'abc' }));
      const result = await store.validate('test-state');
      expect(result).toBe(true);
      expect(redis.getdel).toHaveBeenCalledWith('oauth:state:test-state');
      expect(redis.get).not.toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should return false for an unknown state', async () => {
      redis.getdel.mockResolvedValue(null);
      const result = await store.validate('nonexistent-state');
      expect(result).toBe(false);
    });
  });

  describe('getCodeVerifier', () => {
    it('should return code verifier for a valid state', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ codeVerifier: 'test-verifier' }));
      const verifier = await store.getCodeVerifier('test-state');
      expect(verifier).toBe('test-verifier');
      expect(redis.get).toHaveBeenCalledWith('oauth:state:test-state');
    });

    it('should return undefined for an unknown state', async () => {
      redis.get.mockResolvedValue(null);
      const result = await store.getCodeVerifier('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should not delete the key (peek only)', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ codeVerifier: 'abc' }));
      await store.getCodeVerifier('test-state');
      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should be a no-op (Redis TTL handles expiration)', () => {
      store.cleanup();
      expect(redis.get).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();
    });
  });
});
