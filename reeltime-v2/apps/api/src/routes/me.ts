import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middlewares/authMiddleware.js';
import * as userRepository from '../repositories/userRepository.js';
import * as authService from '../services/authService.js';

export async function meRoutes(app: FastifyInstance) {
  // GET /me - Get current user profile
  // Stateless logout: no server-side endpoint needed.
  // The client discards tokens to "log out". If token blacklisting
  // becomes necessary, this is the extension point.
  app.get(
    '/me',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get the authenticated user profile',
        tags: ['User'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                },
              },
            },
          },
          401: {
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
      const user = await userRepository.findById(request.user!.userId);

      if (!user) {
        return reply.status(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Utilisateur introuvable',
          },
        });
      }

      return reply.send({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      });
    },
  );

  // DELETE /me - Delete user account and all data (RGPD)
  app.delete(
    '/me',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Delete the authenticated user account and all associated data (RGPD right to erasure)',
        tags: ['User'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['confirm'],
          properties: {
            confirm: { type: 'boolean', enum: [true] },
          },
        },
        response: {
          204: {
            type: 'null',
            description: 'Account deleted successfully',
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
        },
      },
    },
    async (request, reply) => {
      const body = request.body as { confirm?: boolean } | undefined;

      if (!body || body.confirm !== true) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Vous devez confirmer la suppression avec confirm: true',
          },
        });
      }

      const userId = request.user!.userId;
      await authService.deleteAccount(userId);

      request.log.info({ userId }, 'User account deleted (RGPD)');

      return reply.status(204).send();
    },
  );
}
