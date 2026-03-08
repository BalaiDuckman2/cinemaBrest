import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

// Mock the cinema service module
vi.mock('../../services/cinemaService.js', () => ({
  getAllCinemas: vi.fn(),
  getCinemaShowtimes: vi.fn(),
}));

import { cinemasRoutes } from '../../routes/cinemas.js';
import * as cinemaService from '../../services/cinemaService.js';

const mockGetAllCinemas = vi.mocked(cinemaService.getAllCinemas);
const mockGetCinemaShowtimes = vi.mocked(cinemaService.getCinemaShowtimes);

describe('cinemas routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(cinemasRoutes, { prefix: '/api/v1' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- GET /api/v1/cinemas ---

  describe('GET /api/v1/cinemas', () => {
    it('returns all cinemas', async () => {
      mockGetAllCinemas.mockResolvedValue([
        { id: 1, allocineId: 'P0153', name: 'Les Studios', address: '136 Rue Jean Jaures', city: 'Brest', latitude: 48.3886, longitude: -4.4942 },
        { id: 2, allocineId: 'P0151', name: 'CGR Brest Le Celtic', address: '38 Rue de Glasgow', city: 'Brest', latitude: 48.3897, longitude: -4.4864 },
        { id: 3, allocineId: 'P0417', name: 'Multiplexe Liberte', address: '2 Rue de la Porte', city: 'Brest', latitude: 48.3904, longitude: -4.4861 },
        { id: 4, allocineId: 'W2920', name: 'Pathe Capucins', address: 'Centre Commercial Les Capucins', city: 'Brest', latitude: 48.3838, longitude: -4.4977 },
        { id: 5, allocineId: 'G02PD', name: 'Cine Galaxy', address: 'Zone de Mescoat', city: 'Landerneau', latitude: 48.4474, longitude: -4.2544 },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/cinemas',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(5);
      expect(body.data[0].allocineId).toBe('P0153');
      expect(body.data[0].name).toBe('Les Studios');
    });
  });

  // --- GET /api/v1/cinemas/:id/showtimes ---

  describe('GET /api/v1/cinemas/:id/showtimes', () => {
    it('returns showtimes for a valid cinema', async () => {
      mockGetCinemaShowtimes.mockResolvedValue({
        cinema: {
          id: 1,
          allocineId: 'P0153',
          name: 'Les Studios',
          address: '136 Rue Jean Jaures',
          city: 'Brest',
          latitude: 48.3886,
          longitude: -4.4942,
        },
        date: '2025-01-15',
        films: [
          {
            id: 42,
            title: 'Nosferatu',
            posterUrl: null,
            year: 2024,
            director: 'Robert Eggers',
            genres: ['Horreur'],
            showtimes: [
              { time: '14:30', version: 'VF', bookingUrl: null },
              { time: '20:00', version: 'VO', bookingUrl: null },
            ],
          },
        ],
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/cinemas/1/showtimes?date=2025-01-15',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.cinema.name).toBe('Les Studios');
      expect(body.data.date).toBe('2025-01-15');
      expect(body.data.films).toHaveLength(1);
      expect(body.data.films[0].showtimes).toHaveLength(2);
    });

    it('returns 404 for unknown cinema id', async () => {
      mockGetCinemaShowtimes.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/cinemas/9999/showtimes?date=2025-01-15',
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error.code).toBe('CINEMA_NOT_FOUND');
    });

    it('returns 400 for non-numeric cinema id', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/cinemas/abc/showtimes?date=2025-01-15',
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error.code).toBe('INVALID_PARAMS');
    });

    it('returns 400 for invalid date format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/cinemas/1/showtimes?date=15-01-2025',
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error.code).toBe('INVALID_PARAMS');
    });

    it('defaults to today when date is omitted', async () => {
      mockGetCinemaShowtimes.mockResolvedValue({
        cinema: {
          id: 1,
          allocineId: 'P0153',
          name: 'Les Studios',
          address: '136 Rue Jean Jaures',
          city: 'Brest',
          latitude: 48.3886,
          longitude: -4.4942,
        },
        date: '2025-01-15',
        films: [],
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/cinemas/1/showtimes',
      });

      // Should not error -- date defaults to today
      expect(response.statusCode).toBe(200);
      expect(mockGetCinemaShowtimes).toHaveBeenCalledWith(1, expect.any(String));
    });
  });
});
