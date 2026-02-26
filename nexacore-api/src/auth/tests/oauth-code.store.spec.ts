import { OAuthCodeStore, OAuthTokenPayload } from '../stores/oauth-code.store';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';

describe('OAuthCodeStore', () => {
  let store: OAuthCodeStore;

  const mockPayload: OAuthTokenPayload = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    store = new OAuthCodeStore();
  });

  describe('store', () => {
    it('should return a non-empty code string', () => {
      const code = store.store(mockPayload);
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });

    it('should return unique codes for different store calls', () => {
      const code1 = store.store(mockPayload);
      const code2 = store.store(mockPayload);
      expect(code1).not.toBe(code2);
    });
  });

  describe('exchange', () => {
    it('should return the payload for a valid code', () => {
      const code = store.store(mockPayload);
      const result = store.exchange(code);
      expect(result).toEqual(mockPayload);
    });

    it('should return null for an unknown code', () => {
      expect(store.exchange('nonexistent-code')).toBeNull();
    });

    it('should return null on second exchange (single-use)', () => {
      const code = store.store(mockPayload);
      expect(store.exchange(code)).toEqual(mockPayload);
      expect(store.exchange(code)).toBeNull();
    });

    it('should return null for an expired code', () => {
      const code = store.store(mockPayload);
      const codesMap = (store as unknown as {
        codes: Map<string, { payload: OAuthTokenPayload; timestamp: number }>;
      }).codes;
      const entry = codesMap.get(code)!;
      codesMap.set(code, { ...entry, timestamp: Date.now() - 61 * 1000 });
      expect(store.exchange(code)).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      const code = store.store(mockPayload);
      const codesMap = (store as unknown as {
        codes: Map<string, { payload: OAuthTokenPayload; timestamp: number }>;
      }).codes;
      const entry = codesMap.get(code)!;
      codesMap.set(code, { ...entry, timestamp: Date.now() - 61 * 1000 });
      store.cleanup();
      expect(codesMap.has(code)).toBe(false);
    });

    it('should keep non-expired entries', () => {
      const code = store.store(mockPayload);
      store.cleanup();
      const codesMap = (store as unknown as {
        codes: Map<string, { payload: OAuthTokenPayload; timestamp: number }>;
      }).codes;
      expect(codesMap.has(code)).toBe(true);
    });
  });
});
