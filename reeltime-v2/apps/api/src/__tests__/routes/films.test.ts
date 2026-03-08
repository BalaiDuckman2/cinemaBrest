import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

// Mock the film service module
vi.mock('../../services/filmService.js', () => ({
  getFilmsWithFilters: vi.fn(),
  getFilmById: vi.fn(),
  searchAllFilms: vi.fn(),
}));

import { filmsRoutes } from '../../routes/films.js';
import * as filmService from '../../services/filmService.js';

const mockGetFilmsWithFilters = vi.mocked(filmService.getFilmsWithFilters);
const mockGetFilmById = vi.mocked(filmService.getFilmById);
const mockSearchAllFilms = vi.mocked(filmService.searchAllFilms);

describe('films routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(filmsRoutes, { prefix: '/api/v1' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- GET /api/v1/films ---

  describe('GET /api/v1/films', () => {
    it('returns films array with meta', async () => {
      mockGetFilmsWithFilters.mockResolvedValue({
        films: [
          {
            id: 1,
            title: 'Nosferatu',
            year: 2024,
            posterUrl: null,
            director: 'Robert Eggers',
            genres: ['Horreur'],
            filmAge: 0,
            rating: 100,
            totalShowtimes: 3,
            letterboxdUrl: 'https://letterboxd.com/search/films/nosferatu/',
            showtimes: [],
          },
        ],
        meta: {
          weekStart: '2025-01-13',
          weekEnd: '2025-01-19',
          weekOffset: 0,
          totalFilms: 1,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/films',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('Nosferatu');
      expect(body.meta.weekOffset).toBe(0);
      expect(body.meta.totalFilms).toBe(1);
    });

    it('passes weekOffset=1 to service', async () => {
      mockGetFilmsWithFilters.mockResolvedValue({
        films: [],
        meta: { weekStart: '2025-01-20', weekEnd: '2025-01-26', weekOffset: 1, totalFilms: 0 },
      });

      await app.inject({
        method: 'GET',
        url: '/api/v1/films?weekOffset=1',
      });

      expect(mockGetFilmsWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ weekOffset: 1 }),
      );
    });

    it('passes version=VO filter to service', async () => {
      mockGetFilmsWithFilters.mockResolvedValue({
        films: [],
        meta: { weekStart: '2025-01-13', weekEnd: '2025-01-19', weekOffset: 0, totalFilms: 0 },
      });

      await app.inject({
        method: 'GET',
        url: '/api/v1/films?version=VO',
      });

      expect(mockGetFilmsWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ version: 'VO' }),
      );
    });

    it('returns 400 for invalid weekOffset', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/films?weekOffset=100',
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for invalid version', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/films?version=INVALID',
      });

      expect(response.statusCode).toBe(400);
      // Fastify's built-in schema validation rejects invalid enum values
      // before the Zod handler runs, so the error format is Fastify's own
      const body = response.json();
      expect(body).toHaveProperty('message');
    });

    it('passes multiple filters correctly', async () => {
      mockGetFilmsWithFilters.mockResolvedValue({
        films: [],
        meta: { weekStart: '2025-01-13', weekEnd: '2025-01-19', weekOffset: 0, totalFilms: 0 },
      });

      await app.inject({
        method: 'GET',
        url: '/api/v1/films?weekOffset=2&q=batman&version=VF&minTime=18:00&minRating=3',
      });

      expect(mockGetFilmsWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          weekOffset: 2,
          q: 'batman',
          version: 'VF',
          minTime: '18:00',
          minRating: 3,
        }),
      );
    });
  });

  // --- GET /api/v1/films/:id ---

  describe('GET /api/v1/films/:id', () => {
    it('returns film detail for valid id', async () => {
      mockGetFilmById.mockResolvedValue({
        id: 42,
        title: 'Le Film',
        year: 2024,
        posterUrl: null,
        synopsis: 'Great movie',
        cast: ['Actor One'],
        director: 'Director One',
        genres: ['Drame'],
        runtime: 120,
        rating: 50,
        filmAge: 0,
        letterboxdUrl: 'https://letterboxd.com/search/films/le%20film/',
        showtimesByDate: {},
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/films/42',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.id).toBe(42);
      expect(body.data.title).toBe('Le Film');
    });

    it('returns 404 for unknown film id', async () => {
      mockGetFilmById.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/films/99999',
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error.code).toBe('FILM_NOT_FOUND');
    });

    it('returns 400 for non-numeric id', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/films/abc',
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error.code).toBe('INVALID_PARAMS');
    });

    it('returns 400 for negative id', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/films/-1',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // --- GET /api/v1/films/search ---

  describe('GET /api/v1/films/search', () => {
    it('returns search results', async () => {
      mockSearchAllFilms.mockResolvedValue({
        films: [
          {
            id: 10,
            title: 'Batman Begins',
            year: 2005,
            posterUrl: null,
            director: 'Christopher Nolan',
            genres: ['Action'],
            filmAge: 19,
            rating: 200,
            totalShowtimes: 0,
            letterboxdUrl: 'https://letterboxd.com/search/films/batman%20begins/',
            showtimes: [],
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/films/search?q=batman',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('Batman Begins');
      expect(body.meta.total).toBe(1);
    });

    it('returns 400 when q is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/films/search',
      });

      // Fastify schema validation will reject missing required q
      expect(response.statusCode).toBe(400);
    });
  });
});
