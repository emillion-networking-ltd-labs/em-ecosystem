import { Test, TestingModule } from '@nestjs/testing';
import { OAuthCodeStore, OAuthTokenPayload } from '../stores/oauth-code.store';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';
import { REDIS_CLIENT } from '../../common/services/redis.constants';

describe('OAuthCodeStore', () => {
  let store: OAuthCodeStore;
  let redis: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  const mockDate = new Date('2026-03-02T12:00:00.000Z');
  const mockPayload: OAuthTokenPayload = {
    accessToken: 'test-access-token',
    user: {
      id: 'uuid-123',
      email: 'test@example.com',
      firstName: null,
      lastName: null,
      avatarUrl: null,
      role: Role.USER,
      provider: Provider.GOOGLE,
      providerId: 'google-123',
      emailVerified: true,
      isActive: true,
      failedAttempts: 0,
      lockedUntil: null,
      lockoutCount: 0,
      mfaEnabled: false,
      createdAt: mockDate,
      updatedAt: mockDate,
    },
    cookie: {
      name: 'refresh_token',
      value: 'signed-refresh-jwt',
      options: {
        httpOnly: true,
        secure: false,
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 604800,
      },
    },
  };

  beforeEach(async () => {
    redis = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthCodeStore,
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    store = module.get<OAuthCodeStore>(OAuthCodeStore);
  });

  describe('store', () => {
    it('should return a non-empty code string', async () => {
      const code = await store.store(mockPayload);
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });

    it('should return unique codes for different store calls', async () => {
      const code1 = await store.store(mockPayload);
      const code2 = await store.store(mockPayload);
      expect(code1).not.toBe(code2);
    });

    it('should store payload in Redis with 60s TTL', async () => {
      const code = await store.store(mockPayload);
      expect(redis.set).toHaveBeenCalledWith(
        `oauth:code:${code}`,
        expect.any(String),
        'EX',
        60,
      );
    });

    it('should serialize the payload as JSON', async () => {
      await store.store(mockPayload);
      const storedValue = redis.set.mock.calls[0][1];
      const parsed = JSON.parse(storedValue);
      expect(parsed.accessToken).toBe('test-access-token');
      expect(parsed.user.email).toBe('test@example.com');
    });
  });

  describe('exchange', () => {
    it('should return the payload for a valid code', async () => {
      redis.get.mockResolvedValue(JSON.stringify(mockPayload));
      const result = await store.exchange('valid-code');
      expect(result).not.toBeNull();
      expect(result!.accessToken).toBe('test-access-token');
      expect(result!.user.email).toBe('test@example.com');
    });

    it('should get and then delete the key (single-use)', async () => {
      redis.get.mockResolvedValue(JSON.stringify(mockPayload));
      await store.exchange('valid-code');
      expect(redis.get).toHaveBeenCalledWith('oauth:code:valid-code');
      expect(redis.del).toHaveBeenCalledWith('oauth:code:valid-code');
    });

    it('should return null and not delete for an unknown code', async () => {
      redis.get.mockResolvedValue(null);
      const result = await store.exchange('nonexistent-code');
      expect(result).toBeNull();
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should reconstruct Date objects from JSON serialization', async () => {
      redis.get.mockResolvedValue(JSON.stringify(mockPayload));
      const result = await store.exchange('valid-code');
      expect(result!.user.createdAt).toBeInstanceOf(Date);
      expect(result!.user.updatedAt).toBeInstanceOf(Date);
      expect(result!.user.createdAt.toISOString()).toBe(mockDate.toISOString());
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
