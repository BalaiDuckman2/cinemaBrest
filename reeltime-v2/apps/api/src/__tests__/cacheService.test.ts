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
      findMany: vi.fn(),
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

import { invalidateL1, invalidateAllL1, fetchAndCacheShowtimes } from '../services/cacheService.js';
import { prisma } from '../lib/prisma.js';
import { getShowtimesForCinema } from '../services/allocineService.js';
import type { CachedShowtimeData } from '../types/cache.js';
import NodeCache from 'node-cache';

// Access internal mock store
const mockStore = (NodeCache as unknown as { _store: Map<string, unknown> })._store;

describe('cacheService', () => {
  beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
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

  describe('fetchAndCacheShowtimes', () => {
    it('merges existing DB letterboxd ratings into the freshly scraped data stored in L1', async () => {
      // AlloCiné scrape never knows letterboxd ratings — they come from the DB enrichment.
      vi.mocked(getShowtimesForCinema).mockResolvedValue({
        films: [
          {
            allocineId: 123,
            title: 'Film A',
            year: 2024,
            posterUrl: null,
            synopsis: null,
            cast: [],
            director: null,
            rating: 3.5,
            productionYear: 2024,
            releaseDate: null,
            runtime: null,
            genres: [],
            filmAge: 0,
            letterboxdRating: null,
          },
        ],
        showtimes: [
          {
            filmAllocineId: 123,
            cinemaAllocineId: 'P0153',
            date: '2026-06-12',
            startsAt: '2026-06-12T20:00:00',
            version: 'VF',
            bookingUrl: null,
          },
        ],
      } as CachedShowtimeData);

      const prismaMock = vi.mocked(prisma, true);
      prismaMock.cinema.findUnique.mockResolvedValue({ id: 1, allocineId: 'P0153' } as never);
      prismaMock.film.upsert.mockResolvedValue({} as never);
      prismaMock.film.findUnique.mockResolvedValue({ id: 10, allocineId: 123 } as never);
      prismaMock.showtime.deleteMany.mockResolvedValue({ count: 0 } as never);
      prismaMock.showtime.create.mockResolvedValue({} as never);
      prismaMock.cacheMetadata.upsert.mockResolvedValue({} as never);
      // The film was already enriched in a previous run
      prismaMock.film.findMany.mockResolvedValue([
        { allocineId: 123, letterboxdRating: 4.2 },
      ] as never);

      await fetchAndCacheShowtimes('P0153', '2026-06-12');

      const cached = mockStore.get('showtimes:P0153:2026-06-12') as CachedShowtimeData;
      expect(cached).toBeDefined();
      expect(cached.films[0].letterboxdRating).toBe(4.2);
    });
  });
});
