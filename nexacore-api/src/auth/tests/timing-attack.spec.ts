import { DUMMY_PASSWORD_HASH, BCRYPT_ROUNDS } from '../constants/auth.constants';

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
});
