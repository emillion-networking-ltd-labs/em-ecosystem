import {
  GLOBAL_RATE_LIMIT,
  AUTH_RATE_LIMITS,
} from '../constants/auth.constants';

describe('Rate Limiting Configuration', () => {
  describe('GLOBAL_RATE_LIMIT', () => {
    it('should allow 100 requests per 60 seconds', () => {
      expect(GLOBAL_RATE_LIMIT.limit).toBe(100);
      expect(GLOBAL_RATE_LIMIT.ttl).toBe(60_000);
    });
  });

  describe('AUTH_RATE_LIMITS', () => {
    it('should have stricter limit for login (5 per 60s)', () => {
      expect(AUTH_RATE_LIMITS.login.limit).toBe(5);
      expect(AUTH_RATE_LIMITS.login.ttl).toBe(60_000);
    });

    it('should have stricter limit for register (3 per 60s)', () => {
      expect(AUTH_RATE_LIMITS.register.limit).toBe(3);
      expect(AUTH_RATE_LIMITS.register.ttl).toBe(60_000);
    });

    it('should have moderate limit for refresh (10 per 60s)', () => {
      expect(AUTH_RATE_LIMITS.refresh.limit).toBe(10);
      expect(AUTH_RATE_LIMITS.refresh.ttl).toBe(60_000);
    });

    it('should have stricter limit for oauth (5 per 60s)', () => {
      expect(AUTH_RATE_LIMITS.oauth.limit).toBe(5);
      expect(AUTH_RATE_LIMITS.oauth.ttl).toBe(60_000);
    });

    it('should have all auth limits stricter than global', () => {
      Object.values(AUTH_RATE_LIMITS).forEach((config) => {
        expect(config.limit).toBeLessThan(GLOBAL_RATE_LIMIT.limit);
      });
    });
  });
});
