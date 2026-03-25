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
import { filmsRoutes } from './routes/films.js';
import { cinemasRoutes } from './routes/cinemas.js';

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
    },
    disableRequestLogging: true,
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
  await app.register(filmsRoutes, { prefix: '/api/v1' });
  await app.register(cinemasRoutes, { prefix: '/api/v1' });

  return app;
}
