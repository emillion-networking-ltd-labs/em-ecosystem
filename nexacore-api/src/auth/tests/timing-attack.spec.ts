import {
  DUMMY_PASSWORD_HASH,
  BCRYPT_ROUNDS,
  MIN_LOGIN_DURATION_MS,
} from '../constants/auth.constants';

describe('Timing Attack Protection', () => {
  describe('DUMMY_PASSWORD_HASH', () => {
    it('should be a valid bcrypt hash string', () => {
      expect(DUMMY_PASSWORD_HASH).toBeDefined();
      expect(typeof DUMMY_PASSWORD_HASH).toBe('string');
      // bcrypt hashes start with $2b$ or $2a$
      expect(DUMMY_PASSWORD_HASH).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('should use the configured BCRYPT_ROUNDS', () => {
      // bcrypt hash format: $2b$12$...
      const roundsStr = DUMMY_PASSWORD_HASH.split('$')[2];
      expect(parseInt(roundsStr, 10)).toBe(BCRYPT_ROUNDS);
    });
  });

  describe('MIN_LOGIN_DURATION_MS', () => {
    it('should be defined and positive', () => {
      expect(MIN_LOGIN_DURATION_MS).toBeDefined();
      expect(typeof MIN_LOGIN_DURATION_MS).toBe('number');
      expect(MIN_LOGIN_DURATION_MS).toBeGreaterThan(0);
    });

    it('should be above typical bcrypt 12-round time (>= 200ms)', () => {
      // MIN_LOGIN_DURATION_MS should be at least 200ms to account for
      // bcrypt 12-round execution time on standard hardware (~200-300ms)
      expect(MIN_LOGIN_DURATION_MS).toBeGreaterThanOrEqual(200);
    });
  });
});
