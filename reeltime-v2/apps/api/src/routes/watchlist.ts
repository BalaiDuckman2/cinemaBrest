import { FastifyInstance } from 'fastify';
import { Prisma } from '../generated/prisma/index.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { addToWatchlistSchema, watchlistParamsSchema } from '../schemas/watchlistSchema.js';
import * as watchlistRepository from '../repositories/watchlistRepository.js';

export async function watchlistRoutes(app: FastifyInstance) {
  // All watchlist routes require authentication
  app.addHook('preHandler', requireAuth);

  // POST /me/watchlist - Add a showtime to watchlist
  app.post(
    '/me/watchlist',
    {
      schema: {
        description: 'Add a showtime to the user watchlist',
        tags: ['Watchlist'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['filmTitle', 'cinemaName', 'date', 'time', 'version'],
          properties: {
            filmTitle: { type: 'string', minLength: 1 },
            cinemaName: { type: 'string', minLength: 1 },
            date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            time: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
            version: { type: 'string', minLength: 1 },
            bookingUrl: { type: 'string', format: 'uri' },
            posterUrl: { type: 'string', format: 'uri' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  filmTitle: { type: 'string' },
                  cinemaName: { type: 'string' },
                  date: { type: 'string' },
                  time: { type: 'string' },
                  version: { type: 'string' },
                  bookingUrl: { type: 'string', nullable: true },
                  posterUrl: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  details: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
          409: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const result = addToWatchlistSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: result.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
      }

      try {
        const item = await watchlistRepository.addToWatchlist(
          request.user!.userId,
          result.data,
        );
        return reply.status(201).send({
          data: {
            id: item.id,
            filmTitle: item.filmTitle,
            cinemaName: item.cinemaName,
            date: item.date,
            time: item.time,
            version: item.version,
            bookingUrl: item.bookingUrl,
            posterUrl: item.posterUrl,
            createdAt: item.createdAt,
          },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          return reply.status(409).send({
            error: {
              code: 'ALREADY_IN_WATCHLIST',
              message: 'Cette seance est deja dans votre calendrier',
            },
          });
        }
        throw err;
      }
    },
  );

  // GET /me/watchlist - Get user's watchlist
  app.get(
    '/me/watchlist',
    {
      schema: {
        description: 'Get the authenticated user watchlist',
        tags: ['Watchlist'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    filmTitle: { type: 'string' },
                    cinemaName: { type: 'string' },
                    date: { type: 'string' },
                    time: { type: 'string' },
                    version: { type: 'string' },
                    bookingUrl: { type: 'string', nullable: true },
                    posterUrl: { type: 'string', nullable: true },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const items = await watchlistRepository.getUserWatchlist(
        request.user!.userId,
      );

      return reply.send({
        data: items.map((item) => ({
          id: item.id,
          filmTitle: item.filmTitle,
          cinemaName: item.cinemaName,
          date: item.date,
          time: item.time,
          version: item.version,
          bookingUrl: item.bookingUrl,
          posterUrl: item.posterUrl,
          createdAt: item.createdAt,
        })),
      });
    },
  );

  // DELETE /me/watchlist/:id - Remove from watchlist
  app.delete(
    '/me/watchlist/:id',
    {
      schema: {
        description: 'Remove a showtime from the user watchlist',
        tags: ['Watchlist'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          204: {
            type: 'null',
            description: 'Item removed successfully',
          },
          400: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = watchlistParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid watchlist item ID',
          },
        });
      }

      const removed = await watchlistRepository.removeFromWatchlist(
        params.data.id,
        request.user!.userId,
      );

      if (!removed) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Element introuvable dans votre calendrier',
          },
        });
      }

      return reply.status(204).send();
    },
  );
}
