import { PermissionsCache } from '../permissions.cache';

describe('PermissionsCache', () => {
  let cache: PermissionsCache;

  beforeEach(() => {
    cache = new PermissionsCache();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return null for missing keys', () => {
    expect(cache.get('USER')).toBeNull();
  });

  it('should store and retrieve permissions', () => {
    cache.set('USER', ['dashboard:read', 'settings:read']);
    expect(cache.get('USER')).toEqual(['dashboard:read', 'settings:read']);
  });

  it('should return null after TTL expires', () => {
    cache.set('USER', ['dashboard:read'], 1000);
    expect(cache.get('USER')).toEqual(['dashboard:read']);

    jest.advanceTimersByTime(1001);
    expect(cache.get('USER')).toBeNull();
  });

  it('should invalidate a specific role', () => {
    cache.set('USER', ['dashboard:read']);
    cache.set('ADMIN', ['users:read']);

    cache.invalidate('USER');

    expect(cache.get('USER')).toBeNull();
    expect(cache.get('ADMIN')).toEqual(['users:read']);
  });

  it('should invalidate all entries', () => {
    cache.set('USER', ['dashboard:read']);
    cache.set('ADMIN', ['users:read']);

    cache.invalidateAll();

    expect(cache.get('USER')).toBeNull();
    expect(cache.get('ADMIN')).toBeNull();
  });

  it('should return stats', () => {
    cache.set('USER', ['dashboard:read']);
    cache.set('ADMIN', ['users:read']);

    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.roles).toContain('USER');
    expect(stats.roles).toContain('ADMIN');
  });
});
