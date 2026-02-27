import { CryptoService } from '../crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(() => {
    process.env.MFA_ENCRYPTION_KEY = 'test-key-for-unit-tests-32chars!';
    service = new CryptoService();
  });

  afterEach(() => {
    delete process.env.MFA_ENCRYPTION_KEY;
  });

  describe('encrypt', () => {
    it('should return a string in iv:authTag:ciphertext format', () => {
      const encrypted = service.encrypt('hello world');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      // IV is 16 bytes = 32 hex chars
      expect(parts[0]).toHaveLength(32);
      // Auth tag is 16 bytes = 32 hex chars
      expect(parts[1]).toHaveLength(32);
      // Ciphertext should be non-empty
      expect(parts[2].length).toBeGreaterThan(0);
    });

    it('should produce different ciphertexts for the same plaintext (random IV)', () => {
      const encrypted1 = service.encrypt('same input');
      const encrypted2 = service.encrypt('same input');
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    it('should round-trip encrypt/decrypt correctly', () => {
      const plaintext = 'JBSWY3DPEHPK3PXP';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const encrypted = service.encrypt('');
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle long strings', () => {
      const long = 'A'.repeat(1000);
      const encrypted = service.encrypt(long);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(long);
    });

    it('should throw on invalid format', () => {
      expect(() => service.decrypt('invalid')).toThrow(
        'Invalid encrypted data format',
      );
    });

    it('should throw on tampered ciphertext', () => {
      const encrypted = service.encrypt('test');
      const parts = encrypted.split(':');
      // Tamper with ciphertext
      parts[2] = 'ff'.repeat(parts[2].length / 2);
      expect(() => service.decrypt(parts.join(':'))).toThrow();
    });

    it('should throw on tampered auth tag', () => {
      const encrypted = service.encrypt('test');
      const parts = encrypted.split(':');
      // Tamper with auth tag
      parts[1] = '00'.repeat(16);
      expect(() => service.decrypt(parts.join(':'))).toThrow();
    });
  });

  describe('key derivation', () => {
    it('should pad short keys to 32 characters', () => {
      process.env.MFA_ENCRYPTION_KEY = 'short';
      const shortKeyService = new CryptoService();
      const encrypted = shortKeyService.encrypt('test');
      const decrypted = shortKeyService.decrypt(encrypted);
      expect(decrypted).toBe('test');
    });

    it('should truncate long keys to 32 characters', () => {
      process.env.MFA_ENCRYPTION_KEY = 'A'.repeat(64);
      const longKeyService = new CryptoService();
      const encrypted = longKeyService.encrypt('test');
      const decrypted = longKeyService.decrypt(encrypted);
      expect(decrypted).toBe('test');
    });
  });
});
