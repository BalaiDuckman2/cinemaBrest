import { FastifyInstance } from 'fastify';
import { registerSchema, loginSchema, refreshSchema } from '../schemas/authSchema.js';
import * as authService from '../services/authService.js';
import { AuthError } from '../services/authService.js';

const errorResponseSchema = {
  type: 'object' as const,
  properties: {
    error: {
      type: 'object' as const,
      properties: {
        code: { type: 'string' as const },
        message: { type: 'string' as const },
        details: { type: 'array' as const, items: { type: 'object' as const } },
      },
    },
  },
};

const authTokensWithUserSchema = {
  type: 'object' as const,
  properties: {
    data: {
      type: 'object' as const,
      properties: {
        accessToken: { type: 'string' as const },
        refreshToken: { type: 'string' as const },
        user: {
          type: 'object' as const,
          properties: {
            id: { type: 'string' as const },
            email: { type: 'string' as const },
            name: { type: 'string' as const, nullable: true },
            createdAt: { type: 'string' as const },
          },
        },
      },
    },
  },
};

export async function authRoutes(app: FastifyInstance) {
  // Apply stricter rate limiting on all auth routes
  app.addHook('onRequest', async (request, reply) => {
    // Use Fastify's rate limit with auth-specific config
    // The global rate limit is 100/min; we enforce 10/min for auth
    const key = `auth:${request.ip}`;
    const now = Date.now();
    const windowMs = 60_000;
    const maxRequests = 10;

    // Use a simple in-memory store for auth rate limiting
    if (!authRateStore.has(key)) {
      authRateStore.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    const entry = authRateStore.get(key)!;
    if (now > entry.resetAt) {
      entry.count = 1;
      entry.resetAt = now + windowMs;
      return;
    }

    entry.count++;
    if (entry.count > maxRequests) {
      reply.status(429).send({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Trop de tentatives, reessayez plus tard',
        },
      });
    }
  });

  // POST /auth/register
  app.post(
    '/auth/register',
    {
      schema: {
        description: 'Register a new user account',
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string' },
          },
        },
        response: {
          201: authTokensWithUserSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = registerSchema.safeParse(request.body);

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
        const data = await authService.register(result.data);
        return reply.status(201).send({ data });
      } catch (err) {
        if (err instanceof AuthError && err.code === 'EMAIL_ALREADY_EXISTS') {
          return reply.status(400).send({
            error: {
              code: err.code,
              message: err.message,
            },
          });
        }
        throw err;
      }
    },
  );

  // POST /auth/login
  app.post(
    '/auth/login',
    {
      schema: {
        description: 'Log in with email and password',
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 },
          },
        },
        response: {
          200: authTokensWithUserSchema,
          401: errorResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = loginSchema.safeParse(request.body);

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
        const data = await authService.login(result.data);
        return reply.status(200).send({ data });
      } catch (err) {
        if (err instanceof AuthError && err.code === 'INVALID_CREDENTIALS') {
          return reply.status(401).send({
            error: {
              code: err.code,
              message: err.message,
            },
          });
        }
        throw err;
      }
    },
  );

  // POST /auth/refresh
  app.post(
    '/auth/refresh',
    {
      schema: {
        description: 'Refresh an access token using a valid refresh token',
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string', minLength: 1 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                },
              },
            },
          },
          401: errorResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = refreshSchema.safeParse(request.body);

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
        const data = await authService.refresh(result.data.refreshToken);
        return reply.status(200).send({ data });
      } catch (err) {
        if (err instanceof AuthError && err.code === 'TOKEN_EXPIRED') {
          return reply.status(401).send({
            error: {
              code: err.code,
              message: err.message,
            },
          });
        }
        throw err;
      }
    },
  );
}

// Simple in-memory rate limit store for auth routes (10 req/min per IP)
const authRateStore = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of authRateStore) {
    if (now > entry.resetAt) {
      authRateStore.delete(key);
    }
  }
}, 300_000).unref();
