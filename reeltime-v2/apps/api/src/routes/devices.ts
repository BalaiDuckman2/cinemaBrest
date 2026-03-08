import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middlewares/authMiddleware.js';
import * as deviceTokenRepository from '../repositories/deviceTokenRepository.js';
import * as z from 'zod';

const registerDeviceSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  platform: z.enum(['web', 'ios', 'android']),
});

const deviceParamsSchema = z.object({
  tokenId: z.string().uuid('Invalid token ID'),
});

export async function devicesRoutes(app: FastifyInstance) {
  // All device routes require authentication
  app.addHook('preHandler', requireAuth);

  // POST /api/v1/me/devices - Register/update FCM token
  app.post(
    '/me/devices',
    {
      schema: {
        description: 'Register or update a device FCM token',
        tags: ['Devices'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['token', 'platform'],
          properties: {
            token: { type: 'string', minLength: 1 },
            platform: { type: 'string', enum: ['web', 'ios', 'android'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  platform: { type: 'string' },
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
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = registerDeviceSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid device registration data',
          },
        });
      }

      const deviceToken = await deviceTokenRepository.registerToken(
        request.user!.userId,
        parsed.data.token,
        parsed.data.platform,
      );

      return reply.send({
        data: {
          id: deviceToken.id,
          platform: deviceToken.platform,
          createdAt: deviceToken.createdAt,
        },
      });
    },
  );

  // DELETE /api/v1/me/devices/:tokenId - Remove a device token
  app.delete(
    '/me/devices/:tokenId',
    {
      schema: {
        description: 'Remove a device FCM token',
        tags: ['Devices'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['tokenId'],
          properties: {
            tokenId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          204: {
            type: 'null',
            description: 'Token removed successfully',
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
      const parsed = deviceParamsSchema.safeParse(request.params);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid token ID',
          },
        });
      }

      const deleted = await deviceTokenRepository.deleteUserToken(
        parsed.data.tokenId,
        request.user!.userId,
      );

      if (!deleted) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Token introuvable',
          },
        });
      }

      return reply.status(204).send();
    },
  );
}
