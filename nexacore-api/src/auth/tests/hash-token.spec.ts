import * as crypto from 'crypto';
import { hashToken } from '../utils/hash-token';

describe('hashToken', () => {
  it('should return the SHA-256 hex digest of the input', () => {
    const input = 'test-token-value';
    const expected = crypto.createHash('sha256').update(input).digest('hex');

    expect(hashToken(input)).toBe(expected);
  });

  it('should be deterministic (same input → same output)', () => {
    const input = 'deterministic-check';
    expect(hashToken(input)).toBe(hashToken(input));
  });

  it('should produce different hashes for different inputs', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
  });

  it('should handle empty string without throwing', () => {
    const result = hashToken('');
    expect(typeof result).toBe('string');
    expect(result).toHaveLength(64);
  });

  it('should always return a 64-character hex string', () => {
    const inputs = ['short', 'a'.repeat(1000), '🔐unicode', '   spaces   '];
    for (const input of inputs) {
      const result = hashToken(input);
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});
