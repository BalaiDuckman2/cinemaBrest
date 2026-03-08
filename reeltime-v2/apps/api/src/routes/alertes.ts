import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { createAlertSchema, alertParamsSchema } from '../schemas/alerteSchema.js';
import * as alertRepository from '../repositories/alertRepository.js';
import { prisma } from '../lib/prisma.js';
import type { Alert } from '../generated/prisma/index.js';

function computeAlertStatus(
  alert: Alert,
): 'active' | 'triggered' | 'expired' {
  if (alert.triggeredAt) return 'triggered';
  if (!alert.isActive) return 'expired';
  return 'active';
}

function mapToResponse(alert: Alert) {
  return {
    id: alert.id,
    filmTitle: alert.filmTitle,
    criteria: alertRepository.parseCriteria(alert.criteria),
    isActive: alert.isActive,
    status: computeAlertStatus(alert),
    createdAt: alert.createdAt,
    triggeredAt: alert.triggeredAt,
  };
}

async function checkImmediateMatch(filmTitle: string): Promise<boolean> {
  const normalizedTitle = filmTitle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const today = new Date().toISOString().slice(0, 10);

  // Check if any film currently showing matches the title
  const films = await prisma.film.findMany({
    where: {
      showtimes: {
        some: {
          date: { gte: today },
        },
      },
    },
    select: { title: true },
  });

  return films.some((film) => {
    const normalizedFilmTitle = film.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return (
      normalizedFilmTitle.includes(normalizedTitle) ||
      normalizedTitle.includes(normalizedFilmTitle)
    );
  });
}

const errorResponseSchema = {
  type: 'object' as const,
  properties: {
    error: {
      type: 'object' as const,
      properties: {
        code: { type: 'string' as const },
        message: { type: 'string' as const },
      },
    },
  },
};

export async function alertesRoutes(app: FastifyInstance) {
  // All alertes routes require authentication
  app.addHook('preHandler', requireAuth);

  // POST /me/alertes - Create an alert
  app.post(
    '/me/alertes',
    {
      schema: {
        description: 'Create a new alert for a film',
        tags: ['Alertes'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['filmTitle'],
          properties: {
            filmTitle: { type: 'string', minLength: 1, maxLength: 200 },
            criteria: {
              type: 'object',
              properties: {
                cinemaId: { type: 'string' },
                version: { type: 'string', enum: ['VF', 'VO', 'VOST'] },
                minTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
              },
            },
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
                  criteria: { type: 'object' },
                  isActive: { type: 'boolean' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                  triggeredAt: { type: 'string', nullable: true },
                  immediateMatch: { type: 'boolean' },
                  matchMessage: { type: 'string' },
                },
              },
            },
          },
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = createAlertSchema.safeParse(request.body);

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

      const alert = await alertRepository.createAlert(
        request.user!.userId,
        result.data,
      );

      const immediateMatch = await checkImmediateMatch(result.data.filmTitle);

      const responseData: Record<string, unknown> = mapToResponse(alert);
      if (immediateMatch) {
        responseData.immediateMatch = true;
        responseData.matchMessage = "Ce film est deja a l'affiche !";
      }

      return reply.status(201).send({ data: responseData });
    },
  );

  // GET /me/alertes - Get user's alerts
  app.get(
    '/me/alertes',
    {
      schema: {
        description: 'Get the authenticated user alerts',
        tags: ['Alertes'],
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
                    criteria: { type: 'object' },
                    isActive: { type: 'boolean' },
                    status: { type: 'string' },
                    createdAt: { type: 'string' },
                    triggeredAt: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const alerts = await alertRepository.getUserAlerts(
        request.user!.userId,
      );

      return reply.send({
        data: alerts.map(mapToResponse),
      });
    },
  );

  // DELETE /me/alertes/:id - Delete an alert
  app.delete(
    '/me/alertes/:id',
    {
      schema: {
        description: 'Delete an alert',
        tags: ['Alertes'],
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
            description: 'Alert deleted successfully',
          },
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const params = alertParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid alert ID',
          },
        });
      }

      const deleted = await alertRepository.deleteAlert(
        params.data.id,
        request.user!.userId,
      );

      if (!deleted) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Alerte introuvable',
          },
        });
      }

      return reply.status(204).send();
    },
  );
}
