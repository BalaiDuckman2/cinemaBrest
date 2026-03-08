import { FastifyInstance } from 'fastify';
import { requireAdmin } from '../middlewares/authMiddleware.js';
import { runFullSync, getSyncState } from '../services/refreshService.js';

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAdmin);

  app.post(
    '/admin/refresh',
    {
      schema: {
        description: 'Trigger a manual cache refresh for all cinemas',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  triggeredBy: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const state = getSyncState();

      if (state.isSyncing) {
        return reply.send({
          data: { status: 'already_running' },
        });
      }

      // Fire and forget
      runFullSync(request.log).catch((err) =>
        request.log.error(err, 'Manual sync failed'),
      );

      return reply.send({
        data: { status: 'started', triggeredBy: 'manual' },
      });
    },
  );

  app.get(
    '/admin/sync-status',
    {
      schema: {
        description: 'Get the current sync status',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  isSyncing: { type: 'boolean' },
                  lastSyncAt: { type: 'string', nullable: true },
                  lastSyncResult: { type: 'object', nullable: true },
                },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const state = getSyncState();
      return reply.send({ data: state });
    },
  );
}
