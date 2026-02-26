import { OAuthStateStore } from '../stores/oauth-state.store';

describe('OAuthStateStore', () => {
  let store: OAuthStateStore;

  beforeEach(() => {
    store = new OAuthStateStore();
  });

  describe('generate', () => {
    it('should return a non-empty string', () => {
      const state = store.generate();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should return unique values on each call', () => {
      const state1 = store.generate();
      const state2 = store.generate();
      expect(state1).not.toBe(state2);
    });
  });

  describe('validate', () => {
    it('should return true for a recently generated state', () => {
      const state = store.generate();
      expect(store.validate(state)).toBe(true);
    });

    it('should return false for an unknown state', () => {
      expect(store.validate('nonexistent-state')).toBe(false);
    });

    it('should return false on second use (single-use)', () => {
      const state = store.generate();
      expect(store.validate(state)).toBe(true);
      expect(store.validate(state)).toBe(false);
    });

    it('should return false for an expired state', () => {
      const state = store.generate();
      const statesMap = (store as unknown as { states: Map<string, number> }).states;
      statesMap.set(state, Date.now() - 6 * 60 * 1000); // 6 minutes ago
      expect(store.validate(state)).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      const state = store.generate();
      const statesMap = (store as unknown as { states: Map<string, number> }).states;
      statesMap.set(state, Date.now() - 6 * 60 * 1000);
      store.cleanup();
      expect(statesMap.has(state)).toBe(false);
    });

    it('should keep non-expired entries', () => {
      const state = store.generate();
      store.cleanup();
      const statesMap = (store as unknown as { states: Map<string, number> }).states;
      expect(statesMap.has(state)).toBe(true);
    });
  });
});
