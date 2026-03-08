import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock node-cache before importing cacheService
vi.mock('node-cache', () => {
  const store = new Map<string, unknown>();
  return {
    default: class MockNodeCache {
      private stdTTL: number;
      constructor(opts?: { stdTTL?: number }) {
        this.stdTTL = opts?.stdTTL ?? 0;
      }
      get<T>(key: string): T | undefined {
        return store.get(key) as T | undefined;
      }
      set(key: string, value: unknown, _ttl?: number): boolean {
        store.set(key, value);
        return true;
      }
      del(key: string): number {
        return store.delete(key) ? 1 : 0;
      }
      flushAll(): void {
        store.clear();
      }
      keys(): string[] {
        return Array.from(store.keys());
      }
      // Expose for tests
      static _store = store;
    },
  };
});

// Mock prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    cacheMetadata: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    cinema: {
      findUnique: vi.fn(),
    },
    showtime: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    film: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// Mock allocineService
vi.mock('../services/allocineService.js', () => ({
  getShowtimesForCinema: vi.fn().mockResolvedValue({ films: [], showtimes: [] }),
}));

// Mock prometheus metrics
vi.mock('../plugins/prometheus.js', () => ({
  cacheHitsTotal: { inc: vi.fn() },
  cacheMissesTotal: { inc: vi.fn() },
  cacheInvalidationsTotal: { inc: vi.fn() },
  cacheEntriesL1Gauge: { set: vi.fn() },
}));

import { invalidateL1, invalidateAllL1 } from '../services/cacheService.js';
import NodeCache from 'node-cache';

// Access internal mock store
const mockStore = (NodeCache as unknown as { _store: Map<string, unknown> })._store;

describe('cacheService', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  describe('invalidateL1', () => {
    it('removes a specific key from L1 cache', () => {
      mockStore.set('showtimes:P0153:2025-01-15', { films: [], showtimes: [] });
      expect(mockStore.has('showtimes:P0153:2025-01-15')).toBe(true);

      invalidateL1('showtimes:P0153:2025-01-15');
      expect(mockStore.has('showtimes:P0153:2025-01-15')).toBe(false);
    });

    it('does nothing for non-existent key', () => {
      expect(() => invalidateL1('nonexistent')).not.toThrow();
    });
  });

  describe('invalidateAllL1', () => {
    it('clears all entries from L1 cache', () => {
      mockStore.set('key1', { films: [], showtimes: [] });
      mockStore.set('key2', { films: [], showtimes: [] });
      expect(mockStore.size).toBe(2);

      invalidateAllL1();
      expect(mockStore.size).toBe(0);
    });
  });
});
