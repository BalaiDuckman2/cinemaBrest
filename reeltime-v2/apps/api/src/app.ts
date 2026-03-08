import crypto from 'node:crypto';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/index.js';
import prometheusPlugin from './plugins/prometheus.js';
import requestLoggerPlugin from './plugins/requestLogger.js';
import { healthcheckRoutes } from './routes/healthcheck.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { filmsRoutes } from './routes/films.js';
import { watchlistRoutes } from './routes/watchlist.js';
import { cinemasRoutes } from './routes/cinemas.js';
import { alertesRoutes } from './routes/alertes.js';
import { devicesRoutes } from './routes/devices.js';
import { adminRoutes } from './routes/admin.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      ...(config.nodeEnv === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss' },
        },
      }),
      serializers: {
        req(request) {
          return { method: request.method, url: request.url, requestId: request.id };
        },
        res(reply) {
          return { statusCode: reply.statusCode };
        },
      },
    },
    genReqId: () => crypto.randomUUID(),
  });

  // CORS
  await app.register(cors, {
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Trop de requetes. Reessayez plus tard.',
      },
    }),
  });

  // Swagger / OpenAPI
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'ReelTime API',
        version: '1.0.0',
        description: 'API for ReelTime cinema showtimes aggregator',
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/documentation',
  });

  // Observability plugins
  await app.register(prometheusPlugin);
  await app.register(requestLoggerPlugin);

  // Health check
  await app.register(healthcheckRoutes);

  // API v1 routes
  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(meRoutes, { prefix: '/api/v1' });
  await app.register(filmsRoutes, { prefix: '/api/v1' });
  await app.register(watchlistRoutes, { prefix: '/api/v1' });
  await app.register(cinemasRoutes, { prefix: '/api/v1' });
  await app.register(alertesRoutes, { prefix: '/api/v1' });
  await app.register(devicesRoutes, { prefix: '/api/v1' });
  await app.register(adminRoutes, { prefix: '/api/v1' });

  return app;
}
