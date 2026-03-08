import { describe, it, expect } from 'vitest';
import { parseAllocineResponse, hasMorePages, isEmptyResponse } from '../services/allocineParser.js';

// --- Helper: minimal valid AlloCiné response ---

function makeRawResponse(overrides: Record<string, unknown> = {}) {
  return {
    message: '',
    error: null,
    pagination: { page: 1, totalPages: 1 },
    results: [
      {
        movie: {
          internalId: 12345,
          title: 'Le Film',
          runtime: '1h 54min',
          synopsis: 'Un synopsis.',
          poster: { url: 'https://img.allocine.fr/poster.jpg' },
          genres: [{ translate: 'Drame' }, { translate: 'Comedie' }],
          cast: {
            edges: [
              { node: { actor: { firstName: 'Jean', lastName: 'Dujardin' } } },
              { node: { actor: { firstName: 'Marion', lastName: 'Cotillard' } } },
            ],
          },
          credits: [{ person: { firstName: 'Michel', lastName: 'Hazanavicius' } }],
          stats: { wantToSeeCount: 42 },
          productionYear: 2020,
          releases: [
            { releaseDate: { date: '2020-10-14' } },
            { releaseDate: { date: '2021-03-01' } },
          ],
        },
        showtimes: {
          DUBBED: [
            {
              startsAt: '2025-01-15T14:30:00',
              diffusionVersion: 'DUBBED',
              service: [{ name: 'Booking', url: 'https://booking.example.com' }],
            },
          ],
          ORIGINAL: [
            {
              startsAt: '2025-01-15T20:00:00',
              diffusionVersion: 'ORIGINAL',
              service: null,
            },
          ],
        },
      },
    ],
    ...overrides,
  };
}

// ============================
// parseAllocineResponse
// ============================

describe('parseAllocineResponse', () => {
  it('extracts films and showtimes from valid data', () => {
    const raw = makeRawResponse();
    const { films, showtimes } = parseAllocineResponse(raw, 'P0153');

    expect(films).toHaveLength(1);
    expect(films[0].allocineId).toBe(12345);
    expect(films[0].title).toBe('Le Film');
    expect(films[0].posterUrl).toBe('https://img.allocine.fr/poster.jpg');
    expect(films[0].synopsis).toBe('Un synopsis.');
    expect(films[0].cast).toEqual(['Jean Dujardin', 'Marion Cotillard']);
    expect(films[0].director).toBe('Michel Hazanavicius');
    expect(films[0].rating).toBe(42);
    expect(films[0].genres).toEqual(['Drame', 'Comedie']);
    expect(films[0].runtime).toBe(114); // 1*60 + 54

    expect(showtimes).toHaveLength(2);
    expect(showtimes[0].version).toBe('VF');
    expect(showtimes[0].cinemaAllocineId).toBe('P0153');
    expect(showtimes[0].bookingUrl).toBe('https://booking.example.com');
    expect(showtimes[0].date).toBe('2025-01-15');

    expect(showtimes[1].version).toBe('VO');
    expect(showtimes[1].bookingUrl).toBeNull();
  });

  it('skips results with missing movie data', () => {
    const raw = makeRawResponse({
      results: [
        { movie: null, showtimes: {} },
        {
          movie: {
            internalId: 99,
            title: 'Bon Film',
            runtime: null,
            synopsis: null,
            poster: null,
            genres: [],
            cast: null,
            credits: null,
            stats: null,
            productionYear: 2024,
            releases: [],
          },
          showtimes: {},
        },
      ],
    });

    const { films, showtimes } = parseAllocineResponse(raw, 'P0151');
    expect(films).toHaveLength(1);
    expect(films[0].title).toBe('Bon Film');
    expect(showtimes).toHaveLength(0);
  });

  it('returns empty arrays for empty results', () => {
    const raw = makeRawResponse({ results: [] });
    const { films, showtimes } = parseAllocineResponse(raw, 'P0153');
    expect(films).toEqual([]);
    expect(showtimes).toEqual([]);
  });

  it('handles missing results array gracefully', () => {
    const { films, showtimes } = parseAllocineResponse({}, 'P0153');
    expect(films).toEqual([]);
    expect(showtimes).toEqual([]);
  });

  it('handles null input', () => {
    const { films, showtimes } = parseAllocineResponse(null, 'P0153');
    expect(films).toEqual([]);
    expect(showtimes).toEqual([]);
  });

  it('deduplicates films by allocineId', () => {
    const movieData = {
      internalId: 100,
      title: 'Same Film',
      runtime: null,
      synopsis: null,
      poster: null,
      genres: [],
      cast: null,
      credits: null,
      stats: null,
      productionYear: 2024,
      releases: [],
    };
    const raw = makeRawResponse({
      results: [
        { movie: movieData, showtimes: { DUBBED: [{ startsAt: '2025-01-15T10:00:00', diffusionVersion: 'DUBBED', service: null }] } },
        { movie: movieData, showtimes: { DUBBED: [{ startsAt: '2025-01-15T14:00:00', diffusionVersion: 'DUBBED', service: null }] } },
      ],
    });

    const { films, showtimes } = parseAllocineResponse(raw, 'P0153');
    expect(films).toHaveLength(1);
    expect(showtimes).toHaveLength(2);
  });
});

// ============================
// Version mapping
// ============================

describe('version mapping', () => {
  it('maps DUBBED to VF', () => {
    const raw = makeRawResponse({
      results: [{
        movie: { internalId: 1, title: 'T', runtime: null, synopsis: null, poster: null, genres: [], cast: null, credits: null, stats: null, productionYear: 2024, releases: [] },
        showtimes: { DUBBED: [{ startsAt: '2025-01-15T10:00:00', diffusionVersion: 'DUBBED', service: null }] },
      }],
    });
    const { showtimes } = parseAllocineResponse(raw, 'C1');
    expect(showtimes[0].version).toBe('VF');
  });

  it('maps ORIGINAL to VO', () => {
    const raw = makeRawResponse({
      results: [{
        movie: { internalId: 1, title: 'T', runtime: null, synopsis: null, poster: null, genres: [], cast: null, credits: null, stats: null, productionYear: 2024, releases: [] },
        showtimes: { ORIGINAL: [{ startsAt: '2025-01-15T10:00:00', diffusionVersion: 'ORIGINAL', service: null }] },
      }],
    });
    const { showtimes } = parseAllocineResponse(raw, 'C1');
    expect(showtimes[0].version).toBe('VO');
  });

  it('maps LOCAL to VF', () => {
    const raw = makeRawResponse({
      results: [{
        movie: { internalId: 1, title: 'T', runtime: null, synopsis: null, poster: null, genres: [], cast: null, credits: null, stats: null, productionYear: 2024, releases: [] },
        showtimes: { LOCAL: [{ startsAt: '2025-01-15T10:00:00', diffusionVersion: 'LOCAL', service: null }] },
      }],
    });
    const { showtimes } = parseAllocineResponse(raw, 'C1');
    expect(showtimes[0].version).toBe('VF');
  });

  it('defaults unknown versions to VF', () => {
    const raw = makeRawResponse({
      results: [{
        movie: { internalId: 1, title: 'T', runtime: null, synopsis: null, poster: null, genres: [], cast: null, credits: null, stats: null, productionYear: 2024, releases: [] },
        showtimes: { UNKNOWN: [{ startsAt: '2025-01-15T10:00:00', diffusionVersion: 'UNKNOWN_VERSION', service: null }] },
      }],
    });
    const { showtimes } = parseAllocineResponse(raw, 'C1');
    expect(showtimes[0].version).toBe('VF');
  });
});

// ============================
// Film year computation
// ============================

describe('film year computation', () => {
  it('uses productionYear when no releases', () => {
    const raw = makeRawResponse({
      results: [{
        movie: {
          internalId: 1, title: 'Old Movie', runtime: null, synopsis: null, poster: null,
          genres: [], cast: null, credits: null, stats: null,
          productionYear: 1995, releases: [],
        },
        showtimes: {},
      }],
    });
    const { films } = parseAllocineResponse(raw, 'C1');
    expect(films[0].year).toBe(1995);
    expect(films[0].productionYear).toBe(1995);
  });

  it('uses minimum of productionYear and releases', () => {
    const raw = makeRawResponse({
      results: [{
        movie: {
          internalId: 1, title: 'ReRelease', runtime: null, synopsis: null, poster: null,
          genres: [], cast: null, credits: null, stats: null,
          productionYear: 2000,
          releases: [
            { releaseDate: { date: '2020-06-01' } },
            { releaseDate: { date: '1998-03-15' } },
          ],
        },
        showtimes: {},
      }],
    });
    const { films } = parseAllocineResponse(raw, 'C1');
    expect(films[0].year).toBe(1998); // min of 2000, 2020, 1998
  });

  it('computes filmAge correctly', () => {
    const currentYear = new Date().getFullYear();
    const raw = makeRawResponse({
      results: [{
        movie: {
          internalId: 1, title: 'Classic', runtime: null, synopsis: null, poster: null,
          genres: [], cast: null, credits: null, stats: null,
          productionYear: 1990, releases: [],
        },
        showtimes: {},
      }],
    });
    const { films } = parseAllocineResponse(raw, 'C1');
    expect(films[0].filmAge).toBe(currentYear - 1990);
  });

  it('defaults to currentYear when no year data', () => {
    const currentYear = new Date().getFullYear();
    const raw = makeRawResponse({
      results: [{
        movie: {
          internalId: 1, title: 'Mystery', runtime: null, synopsis: null, poster: null,
          genres: [], cast: null, credits: null, stats: null,
          productionYear: null, releases: [],
        },
        showtimes: {},
      }],
    });
    const { films } = parseAllocineResponse(raw, 'C1');
    expect(films[0].year).toBe(currentYear);
    expect(films[0].filmAge).toBe(0);
  });
});

// ============================
// Runtime parsing
// ============================

describe('runtime parsing', () => {
  it('parses "1h 54min" to 114', () => {
    const raw = makeRawResponse({
      results: [{
        movie: {
          internalId: 1, title: 'T', runtime: '1h 54min', synopsis: null, poster: null,
          genres: [], cast: null, credits: null, stats: null, productionYear: 2024, releases: [],
        },
        showtimes: {},
      }],
    });
    const { films } = parseAllocineResponse(raw, 'C1');
    expect(films[0].runtime).toBe(114);
  });

  it('parses "2h" to 120', () => {
    const raw = makeRawResponse({
      results: [{
        movie: {
          internalId: 1, title: 'T', runtime: '2h', synopsis: null, poster: null,
          genres: [], cast: null, credits: null, stats: null, productionYear: 2024, releases: [],
        },
        showtimes: {},
      }],
    });
    const { films } = parseAllocineResponse(raw, 'C1');
    expect(films[0].runtime).toBe(120);
  });

  it('parses "45min" to 45', () => {
    const raw = makeRawResponse({
      results: [{
        movie: {
          internalId: 1, title: 'T', runtime: '45min', synopsis: null, poster: null,
          genres: [], cast: null, credits: null, stats: null, productionYear: 2024, releases: [],
        },
        showtimes: {},
      }],
    });
    const { films } = parseAllocineResponse(raw, 'C1');
    expect(films[0].runtime).toBe(45);
  });

  it('passes through numeric runtime as-is', () => {
    const raw = makeRawResponse({
      results: [{
        movie: {
          internalId: 1, title: 'T', runtime: 90, synopsis: null, poster: null,
          genres: [], cast: null, credits: null, stats: null, productionYear: 2024, releases: [],
        },
        showtimes: {},
      }],
    });
    const { films } = parseAllocineResponse(raw, 'C1');
    expect(films[0].runtime).toBe(90);
  });

  it('returns null for null runtime', () => {
    const raw = makeRawResponse({
      results: [{
        movie: {
          internalId: 1, title: 'T', runtime: null, synopsis: null, poster: null,
          genres: [], cast: null, credits: null, stats: null, productionYear: 2024, releases: [],
        },
        showtimes: {},
      }],
    });
    const { films } = parseAllocineResponse(raw, 'C1');
    expect(films[0].runtime).toBeNull();
  });
});

// ============================
// isEmptyResponse
// ============================

describe('isEmptyResponse', () => {
  it('returns true for "no.showtime.error" message', () => {
    expect(isEmptyResponse({ message: 'no.showtime.error', results: [] })).toBe(true);
  });

  it('returns true for "next.showtime.on" message', () => {
    expect(isEmptyResponse({ message: 'next.showtime.on', results: [] })).toBe(true);
  });

  it('returns true for empty results array', () => {
    expect(isEmptyResponse({ message: '', results: [] })).toBe(true);
  });

  it('returns true for missing results', () => {
    expect(isEmptyResponse({ message: '' })).toBe(true);
  });

  it('returns false for valid data with results', () => {
    const raw = makeRawResponse();
    expect(isEmptyResponse(raw)).toBe(false);
  });
});

// ============================
// hasMorePages
// ============================

describe('hasMorePages', () => {
  it('returns hasMore=true when currentPage < totalPages', () => {
    const result = hasMorePages({
      pagination: { page: 1, totalPages: 3 },
      results: [],
    });
    expect(result).toEqual({ hasMore: true, currentPage: 1, totalPages: 3 });
  });

  it('returns hasMore=false when currentPage === totalPages', () => {
    const result = hasMorePages({
      pagination: { page: 2, totalPages: 2 },
      results: [],
    });
    expect(result).toEqual({ hasMore: false, currentPage: 2, totalPages: 2 });
  });

  it('handles missing pagination gracefully', () => {
    const result = hasMorePages({});
    expect(result).toEqual({ hasMore: false, currentPage: 1, totalPages: 1 });
  });

  it('handles null input', () => {
    const result = hasMorePages(null);
    expect(result).toEqual({ hasMore: false, currentPage: 1, totalPages: 1 });
  });
});
