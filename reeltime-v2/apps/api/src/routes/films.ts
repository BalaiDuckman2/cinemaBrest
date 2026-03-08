import { FastifyInstance } from 'fastify';
import { getFilmsWithFilters, getFilmById, searchAllFilms } from '../services/filmService.js';
import {
  filmFilterSchema,
  filmSearchSchema,
  parseFilmIdParam,
} from '../schemas/filmSchemas.js';

export async function filmsRoutes(app: FastifyInstance) {
  // GET /api/v1/films?weekOffset=N&q=...&cinemaId=...&version=...&minTime=...&minRating=...
  app.get('/films', {
    schema: {
      description: 'List films for a given week with optional filters',
      tags: ['Films'],
      querystring: {
        type: 'object',
        properties: {
          weekOffset: { type: 'integer', default: 0, description: 'Week offset from current week (-52 to 52)' },
          q: { type: 'string', description: 'Search query (case/accent insensitive)' },
          cinemaId: { type: 'string', description: 'Filter by cinema allocineId' },
          version: { type: 'string', enum: ['VO', 'VF', 'VOST'], description: 'Filter by showtime version' },
          minTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$', description: 'Minimum showtime time (HH:mm)' },
          minRating: { type: 'number', minimum: 0, maximum: 5, description: 'Minimum film rating (0-5)' },
        },
      },
    },
  }, async (request, reply) => {
    const parsed = filmFilterSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid filter parameters',
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      });
    }

    const result = await getFilmsWithFilters(parsed.data);
    return { data: result.films, meta: result.meta };
  });

  // GET /api/v1/films/search?q=...&limit=50&offset=0
  app.get('/films/search', {
    schema: {
      description: 'Search across all cached films (not limited to current week)',
      tags: ['Films'],
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 1, description: 'Search query (case/accent insensitive)' },
          limit: { type: 'integer', default: 50, minimum: 1, maximum: 200, description: 'Max results to return (1-200)' },
          offset: { type: 'integer', default: 0, minimum: 0, description: 'Number of results to skip' },
        },
      },
    },
  }, async (request, reply) => {
    const parsed = filmSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search query is required',
        },
      });
    }

    const result = await searchAllFilms(parsed.data.q, parsed.data.limit, parsed.data.offset);
    return {
      data: result.films,
      meta: { total: result.total, limit: result.limit, offset: result.offset },
    };
  });

  // GET /api/v1/films/:id
  app.get('/films/:id', async (request, reply) => {
    let params;
    try {
      params = parseFilmIdParam(request.params as Record<string, unknown>);
    } catch {
      return reply.status(400).send({
        error: {
          code: 'INVALID_PARAMS',
          message: 'id must be a positive integer',
        },
      });
    }

    const film = await getFilmById(params.id);
    if (!film) {
      return reply.status(404).send({
        error: {
          code: 'FILM_NOT_FOUND',
          message: `Film with id ${params.id} not found`,
        },
      });
    }

    return { data: film };
  });
}
