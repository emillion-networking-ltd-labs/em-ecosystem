import { Injectable } from '@nestjs/common';

interface CacheEntry {
  permissions: string[];
  expiresAt: number;
}

@Injectable()
export class PermissionsCache {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL_MS = 300_000; // 5 minutes

  get(role: string): string[] | null {
    const entry = this.cache.get(role);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(role);
      return null;
    }

    return entry.permissions;
  }

  set(role: string, permissions: string[], ttlMs?: number): void {
    this.cache.set(role, {
      permissions,
      expiresAt: Date.now() + (ttlMs ?? this.DEFAULT_TTL_MS),
    });
  }

  invalidate(role: string): void {
    this.cache.delete(role);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  getStats(): { size: number; roles: string[] } {
    return {
      size: this.cache.size,
      roles: Array.from(this.cache.keys()),
    };
  }
}
