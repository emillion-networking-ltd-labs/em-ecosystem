import { OAuthStateStore } from '../stores/oauth-state.store';

describe('OAuthStateStore', () => {
  let store: OAuthStateStore;

  beforeEach(() => {
    store = new OAuthStateStore();
  });

  describe('generate', () => {
    it('should return an object with state and codeChallenge strings', () => {
      const result = store.generate();
      expect(typeof result.state).toBe('string');
      expect(result.state.length).toBeGreaterThan(0);
      expect(typeof result.codeChallenge).toBe('string');
      expect(result.codeChallenge.length).toBeGreaterThan(0);
    });

    it('should return unique values on each call', () => {
      const result1 = store.generate();
      const result2 = store.generate();
      expect(result1.state).not.toBe(result2.state);
      expect(result1.codeChallenge).not.toBe(result2.codeChallenge);
    });
  });

  describe('validate', () => {
    it('should return true for a recently generated state', () => {
      const { state } = store.generate();
      expect(store.validate(state)).toBe(true);
    });

    it('should return false for an unknown state', () => {
      expect(store.validate('nonexistent-state')).toBe(false);
    });

    it('should return false on second use (single-use)', () => {
      const { state } = store.generate();
      expect(store.validate(state)).toBe(true);
      expect(store.validate(state)).toBe(false);
    });

    it('should return false for an expired state', () => {
      const { state } = store.generate();
      const statesMap = (store as unknown as { states: Map<string, { timestamp: number; codeVerifier: string }> }).states;
      const entry = statesMap.get(state)!;
      statesMap.set(state, { ...entry, timestamp: Date.now() - 6 * 60 * 1000 }); // 6 minutes ago
      expect(store.validate(state)).toBe(false);
    });
  });

  describe('getCodeVerifier', () => {
    it('should return code verifier for a valid state', () => {
      const { state } = store.generate();
      const verifier = store.getCodeVerifier(state);
      expect(typeof verifier).toBe('string');
      expect(verifier!.length).toBeGreaterThan(0);
    });

    it('should return undefined for an unknown state', () => {
      expect(store.getCodeVerifier('nonexistent')).toBeUndefined();
    });

    it('should not consume the state (peek only)', () => {
      const { state } = store.generate();
      store.getCodeVerifier(state);
      // State should still be valid after peek
      expect(store.validate(state)).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      const { state } = store.generate();
      const statesMap = (store as unknown as { states: Map<string, { timestamp: number; codeVerifier: string }> }).states;
      const entry = statesMap.get(state)!;
      statesMap.set(state, { ...entry, timestamp: Date.now() - 6 * 60 * 1000 });
      store.cleanup();
      expect(statesMap.has(state)).toBe(false);
    });

    it('should keep non-expired entries', () => {
      const { state } = store.generate();
      store.cleanup();
      const statesMap = (store as unknown as { states: Map<string, { timestamp: number; codeVerifier: string }> }).states;
      expect(statesMap.has(state)).toBe(true);
    });
  });
});
