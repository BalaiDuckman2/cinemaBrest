import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    film: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../config/index.js', () => ({
  config: { tmdbApiKey: 'test-key' },
}));

vi.mock('../utils/rateLimiter.js', () => ({
  RateLimiter: class {
    async acquire(): Promise<void> {}
  },
}));

vi.mock('../services/letterboxdEnrich.js', () => ({
  fetchTmdbId: vi.fn(),
  fetchLetterboxdRatingByTmdbId: vi.fn(),
}));

vi.mock('../services/cacheService.js', () => ({
  invalidateAllL1: vi.fn(),
}));

import { runLetterboxdEnrichment } from '../services/letterboxdService.js';
import { fetchTmdbId, fetchLetterboxdRatingByTmdbId } from '../services/letterboxdEnrich.js';
import { invalidateAllL1 } from '../services/cacheService.js';
import { prisma } from '../lib/prisma.js';

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

describe('runLetterboxdEnrichment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invalidates L1 cache after updating at least one rating, so the HTTP path serves fresh ratings', async () => {
    vi.mocked(prisma.film.findMany).mockResolvedValue([
      { id: 1, title: 'Film A', year: 2024, productionYear: 2024 },
    ] as never);
    vi.mocked(prisma.film.update).mockResolvedValue({} as never);
    vi.mocked(fetchTmdbId).mockResolvedValue(777);
    vi.mocked(fetchLetterboxdRatingByTmdbId).mockResolvedValue(4.2);

    await runLetterboxdEnrichment(logger);

    expect(prisma.film.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ letterboxdRating: 4.2 }),
    });
    expect(invalidateAllL1).toHaveBeenCalled();
  });

  it('does not invalidate L1 when no rating was found', async () => {
    vi.mocked(prisma.film.findMany).mockResolvedValue([
      { id: 1, title: 'Film A', year: 2024, productionYear: 2024 },
    ] as never);
    vi.mocked(prisma.film.update).mockResolvedValue({} as never);
    vi.mocked(fetchTmdbId).mockResolvedValue(null);

    await runLetterboxdEnrichment(logger);

    expect(invalidateAllL1).not.toHaveBeenCalled();
  });
});
