import { OAuthLinkCodeStore } from '../stores/oauth-link-code.store';

describe('OAuthLinkCodeStore', () => {
  let store: OAuthLinkCodeStore;
  let redis: { set: jest.Mock; get: jest.Mock; del: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    redis = { set: jest.fn(), get: jest.fn(), del: jest.fn() };
    store = new OAuthLinkCodeStore(redis as any);
  });

  describe('generate', () => {
    it('should return a 64-character hex string', async () => {
      const code = await store.generate('user-123');

      expect(code).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should store userId in Redis with correct key prefix and TTL', async () => {
      const code = await store.generate('user-123');

      expect(redis.set).toHaveBeenCalledWith(
        `oauth:link-code:${code}`,
        'user-123',
        'EX',
        60,
      );
    });

    it('should generate unique codes on each call', async () => {
      const code1 = await store.generate('user-123');
      const code2 = await store.generate('user-123');

      expect(code1).not.toBe(code2);
    });
  });

  describe('consume', () => {
    it('should return userId when key exists', async () => {
      redis.get.mockResolvedValue('user-456');

      const result = await store.consume('valid-code');

      expect(result).toBe('user-456');
      expect(redis.get).toHaveBeenCalledWith('oauth:link-code:valid-code');
    });

    it('should delete the key after consuming (single-use)', async () => {
      redis.get.mockResolvedValue('user-456');

      await store.consume('valid-code');

      expect(redis.del).toHaveBeenCalledWith('oauth:link-code:valid-code');
    });

    it('should return null when key does not exist', async () => {
      redis.get.mockResolvedValue(null);

      const result = await store.consume('unknown-code');

      expect(result).toBeNull();
      expect(redis.del).not.toHaveBeenCalled();
    });
  });
});
