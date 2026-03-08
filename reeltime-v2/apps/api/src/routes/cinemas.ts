import { FastifyInstance } from 'fastify';
import { getAllCinemas, getCinemaShowtimes } from '../services/cinemaService.js';
import { parseCinemaIdParam, parseCinemaShowtimesQuery } from '../schemas/cinemaSchemas.js';

export async function cinemasRoutes(app: FastifyInstance) {
  // GET /api/v1/cinemas
  app.get('/cinemas', async () => {
    const cinemas = await getAllCinemas();
    return { data: cinemas };
  });

  // GET /api/v1/cinemas/:id/showtimes?date=YYYY-MM-DD
  app.get('/cinemas/:id/showtimes', async (request, reply) => {
    let params;
    try {
      params = parseCinemaIdParam(request.params as Record<string, unknown>);
    } catch {
      return reply.status(400).send({
        error: {
          code: 'INVALID_PARAMS',
          message: 'id must be a positive integer',
        },
      });
    }

    let query;
    try {
      query = parseCinemaShowtimesQuery(request.query as Record<string, unknown>);
    } catch {
      return reply.status(400).send({
        error: {
          code: 'INVALID_PARAMS',
          message: 'Date must be in YYYY-MM-DD format',
        },
      });
    }

    const result = await getCinemaShowtimes(params.id, query.date);
    if (!result) {
      return reply.status(404).send({
        error: {
          code: 'CINEMA_NOT_FOUND',
          message: `Cinema with id ${params.id} not found`,
        },
      });
    }

    return { data: result };
  });
}
